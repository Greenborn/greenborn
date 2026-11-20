'use strict';

/* Pisá con cuidado: buscaminas en veredas y plazas, con niveles crecientes.
   Te movés baldosa por baldosa. Cada baldosa revelada muestra cuántas cacas
   de perro hay en sus 8 vecinos. Pisar una caca termina el paseo. */

const CELDA_BASE = 44;              // tamaño de baldosa en px (pensado para el dedo)
const BORDE_CANVAS = 3;             // borde CSS del canvas (ver estilo.css)
const PERIODO_PASEOS = 700;         // ms entre pasos de los paseadores
const PULSACION_LARGA = 450;        // ms para poner bandera con el dedo
const NIVELES = [
  { ancho: 9, alto: 7, densidad: 0.8 },
  { ancho: 11, alto: 8, densidad: 0.9 },
  { ancho: 13, alto: 9, densidad: 1.0 },
  { ancho: 14, alto: 10, densidad: 1.1 },
  { ancho: 16, alto: 11, densidad: 1.2 },
  { ancho: 18, alto: 12, densidad: 1.3 },
];
// Variedad de paseadores y perros (emojis de color opaco).
const PERSONAS = ['🧑', '👨', '👩', '🧔', '👵', '👴', '👧', '👦'];
const PERROS = ['🐕', '🐩', '🦮'];
// Colores oscuros para que las pistas se lean sobre vereda y sobre pasto.
const COLORES_PISTA = ['', '#1e3a8a', '#14532d', '#991b1b', '#5b21b6', '#7c2d12', '#115e59', '#111827', '#374151'];
const FUENTE_EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif';
const CLAVE_PERSONAJE = 'pisa.personaje';

let CELDA = CELDA_BASE;             // tamaño actual de baldosa en px

const $ = (id) => document.getElementById(id);
const canvas = $('mundo');
const ctx = canvas.getContext('2d');
const pantallaPersonaje = $('pantalla-personaje');
const pantallaFin = $('pantalla-fin');
const elAviso = $('aviso');

let estado = 'personaje'; // personaje | jugando | perdido | nivel | completo
let corrida = { nivel: 0, pasosTotales: 0 };
let juego = null;         // estado de la partida actual
let control = null;       // control devuelto por ConstructorPersonaje.montar
let spriteJugador = null;
let temporizadorAviso = null;
let temporizadorPaseos = null;
let sucio = true;         // hay que redibujar el canvas
let claveHud = '';
let gesto = null;         // toque o clic en curso sobre el canvas
const vista = { cols: 8, filas: 6, cam: { x: 0, y: 0 }, dpr: 1 };

/* ---------- Utilidades ---------- */

function ruido(x, y, k) {
  let h = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(k + 1, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Tamaño de fuente proporcional a la baldosa (base pensada para 32 px).
function fz(base) {
  return Math.round(base * CELDA / 32);
}

function mensaje(texto) {
  elAviso.textContent = texto;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => { elAviso.textContent = ''; }, 2600);
}

function segundos() {
  const fin = juego.fin ?? performance.now();
  return Math.floor((fin - juego.inicio) / 1000);
}

/* ---------- Vista y cámara ---------- */

// Ajusta el canvas al espacio disponible. Si el mapa no entra, la cámara
// sigue al personaje (scroll centrado) en lugar de achicar las baldosas.
function ajustarVista() {
  if (!juego) return;
  const { t } = juego;
  CELDA = CELDA_BASE;
  const disponibleW = canvas.parentElement.clientWidth - 2 * BORDE_CANVAS;
  const disponibleH = Math.max(220, window.innerHeight - 330);
  vista.cols = Math.max(4, Math.min(t.ancho, Math.floor(disponibleW / CELDA)));
  vista.filas = Math.max(4, Math.min(t.alto, Math.floor(disponibleH / CELDA)));
  vista.dpr = window.devicePixelRatio || 1;

  const anchoCss = vista.cols * CELDA;
  const altoCss = vista.filas * CELDA;
  canvas.style.width = `${anchoCss + 2 * BORDE_CANVAS}px`;
  canvas.style.height = `${altoCss + 2 * BORDE_CANVAS}px`;
  canvas.width = Math.round(anchoCss * vista.dpr);
  canvas.height = Math.round(altoCss * vista.dpr);
  sucio = true;
}

function actualizarCamara() {
  const { t } = juego;
  const mundoW = t.ancho * CELDA;
  const mundoH = t.alto * CELDA;
  const vistaW = vista.cols * CELDA;
  const vistaH = vista.filas * CELDA;
  const cx = juego.jugador.x * CELDA + CELDA / 2;
  const cy = juego.jugador.y * CELDA + CELDA / 2;
  const limitar = (v, max) => Math.min(Math.max(v, 0), max);
  vista.cam.x = mundoW <= vistaW ? 0 : limitar(cx - vistaW / 2, mundoW - vistaW);
  vista.cam.y = mundoH <= vistaH ? 0 : limitar(cy - vistaH / 2, mundoH - vistaH);
  sucio = true;
}

/* ---------- Partida ---------- */

function nuevaPartida() {
  const cfg = NIVELES[corrida.nivel];
  const t = Tablero.crear({ ancho: cfg.ancho, alto: cfg.alto, densidad: cfg.densidad });
  juego = {
    t,
    jugador: { x: t.inicio.x, y: t.inicio.y },
    mirando: { dx: 0, dy: -1 },      // hacia dónde mira: última dirección usada
    visitadas: new Set(),            // baldosas pisadas (seguras)
    seguras: new Set(),              // baldosas que sabemos que no tienen caca
    pistas: new Map(),               // índice -> cantidad de cacas alrededor
    banderas: new Set(),             // marcas del jugador
    pasos: 0,                        // pasos de este nivel
    inicio: performance.now(),
    fin: null,
    paseos: crearPaseos(t),
  };
  const { x, y } = t.inicio;
  juego.visitadas.add(Tablero.idx(t, x, y));
  revelar(x, y);
  estado = 'jugando';
  ocultarFin();
  mensaje(`Nivel ${corrida.nivel + 1} de ${NIVELES.length}`);
  ajustarVista();
  actualizarCamara();

  clearInterval(temporizadorPaseos);
  temporizadorPaseos = setInterval(() => {
    if (estado === 'jugando' && !document.hidden) {
      moverPaseos();
      sucio = true;
    }
  }, PERIODO_PASEOS);
}

// Revela la pista de una baldosa. Si no tiene cacas alrededor, sus vecinos
// son seguros y también se revelan (igual que el buscaminas clásico).
function revelar(x0, y0) {
  const { t } = juego;
  const pila = [[x0, y0]];
  while (pila.length) {
    const [x, y] = pila.pop();
    const i = Tablero.idx(t, x, y);
    if (juego.pistas.has(i)) continue;
    const p = Tablero.pista(t, x, y);
    juego.pistas.set(i, p);
    if (p === 0) {
      for (const v of Tablero.vecinos(t, x, y, Tablero.VECINOS_8)) {
        juego.seguras.add(Tablero.idx(t, v.x, v.y));
        pila.push([v.x, v.y]);
      }
    }
  }
}

function mover(dx, dy) {
  if (estado !== 'jugando') return;
  const { t } = juego;
  juego.mirando = { dx, dy };
  const nx = juego.jugador.x + dx;
  const ny = juego.jugador.y + dy;
  if (!Tablero.dentro(t, nx, ny)) {
    mensaje('Ahí no hay vereda: es el borde del mapa.');
    sucio = true;
    return;
  }
  const i = Tablero.idx(t, nx, ny);
  if (juego.banderas.has(i)) {
    mensaje('Hay una bandera ahí. Quitala para pasar.');
    sucio = true;
    return;
  }
  juego.pasos++;
  corrida.pasosTotales++;
  juego.jugador = { x: nx, y: ny };
  sucio = true;
  if (Tablero.celda(t, nx, ny).caca) {
    perder();
    return;
  }
  juego.visitadas.add(i);
  revelar(nx, ny);
  actualizarCamara();
  if (nx === t.salida.x && ny === t.salida.y) ganar();
}

function baldosaDeFrente() {
  const { dx, dy } = juego.mirando;
  return { x: juego.jugador.x + dx, y: juego.jugador.y + dy };
}

function alternarBandera(x, y) {
  if (estado !== 'jugando') return;
  const { t } = juego;
  if (!Tablero.dentro(t, x, y)) return;
  const i = Tablero.idx(t, x, y);
  if (juego.visitadas.has(i) || juego.pistas.has(i)) {
    mensaje('Esa baldosa ya la conocés: no hace falta marcarla.');
    return;
  }
  if (juego.banderas.has(i)) juego.banderas.delete(i);
  else juego.banderas.add(i);
  sucio = true;
}

function ganar() {
  juego.fin = performance.now();
  sucio = true;
  const esUltimo = corrida.nivel === NIVELES.length - 1;
  $('fin-titulo').textContent = `¡Llegaste a la parada! Nivel ${corrida.nivel + 1}`;
  $('fin-texto').textContent =
    `Pasos en este nivel: ${juego.pasos} · Pasos totales: ${corrida.pasosTotales} · Tiempo: ${segundos()} s.`;
  if (esUltimo) {
    estado = 'completo';
    $('fin-titulo').textContent = '¡Completaste todos los niveles!';
    $('fin-texto').textContent = `Pasos totales del paseo: ${corrida.pasosTotales}.`;
    $('btn-siguiente').classList.add('oculta');
    $('btn-otra').textContent = 'Jugar de nuevo';
    $('btn-otra').classList.add('principal');
  } else {
    estado = 'nivel';
    $('btn-siguiente').classList.remove('oculta');
    $('btn-otra').textContent = 'Repetir nivel';
    $('btn-otra').classList.remove('principal');
  }
  mostrarFin();
}

function perder() {
  estado = 'perdido';
  juego.fin = performance.now();
  sucio = true;
  $('fin-titulo').textContent = '¡Pisaste caca de perro!';
  $('fin-texto').textContent =
    `Llegaste a ${juego.pasos} pasos en este nivel. Pasos totales: ${corrida.pasosTotales}.`;
  $('btn-siguiente').classList.add('oculta');
  $('btn-otra').textContent = 'Otra vez';
  $('btn-otra').classList.add('principal');
  mostrarFin();
}

function mostrarFin() {
  pantallaFin.classList.remove('oculta');
}

function ocultarFin() {
  pantallaFin.classList.add('oculta');
}

/* ---------- Paseadores (ambientación, no afectan la lógica) ---------- */

function crearPaseos(t) {
  const lista = [];
  const libres = [];
  for (let y = 0; y < t.alto; y++) {
    for (let x = 0; x < t.ancho; x++) {
      if (t.celdas[Tablero.idx(t, x, y)].zona === 'vereda') libres.push({ x, y });
    }
  }
  for (let k = 0; k < 4 && libres.length; k++) {
    const p = libres.splice(Math.floor(Math.random() * libres.length), 1)[0];
    lista.push({
      x: p.x, y: p.y, dx: Math.random() < 0.5 ? 1 : -1, dy: 0,
      persona: PERSONAS[Math.floor(Math.random() * PERSONAS.length)],
      perro: PERROS[Math.floor(Math.random() * PERROS.length)],
    });
  }
  return lista;
}

function moverPaseos() {
  const { t } = juego;
  for (const p of juego.paseos) {
    const nx = p.x + p.dx;
    if (Tablero.dentro(t, nx, p.y)) {
      p.x = nx;
    } else {
      p.dx = -p.dx; // da la vuelta en el borde
      p.x += p.dx;
    }
    // Un giro aleatorio de vez en cuando para que no sea una línea recta.
    if (Math.random() < 0.15 && Tablero.dentro(t, p.x, p.y + 1)) {
      p.dy = Math.random() < 0.5 ? 1 : -1;
      p.dx = 0;
    }
    if (p.dy !== 0 && Tablero.dentro(t, p.x, p.y + p.dy)) {
      p.y += p.dy;
      if (Math.random() < 0.5) { p.dy = 0; p.dx = Math.random() < 0.5 ? 1 : -1; }
    } else {
      p.dy = 0;
      if (p.dx === 0) p.dx = 1;
    }
  }
}

/* ---------- Dibujo ---------- */

function dibujarTerreno(x, y, zona) {
  const px = x * CELDA;
  const py = y * CELDA;
  const s = CELDA;
  if (zona === 'plaza') {
    ctx.fillStyle = '#8fc26b';
    ctx.fillRect(px, py, s, s);
    ctx.fillStyle = '#7aae58';
    for (let k = 0; k < 4; k++) {
      const cx = px + s * 0.15 + ruido(x, y, k) * s * 0.7;
      const cy = py + s * 0.15 + ruido(x, y, k + 10) * s * 0.7;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1.5, s / 16), 0, Math.PI * 2);
      ctx.fill();
    }
    // Cordón: borde oscuro que separa el pasto de la vereda.
    ctx.strokeStyle = '#5f8f3e';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
  } else {
    ctx.fillStyle = ruido(x, y, 20) > 0.5 ? '#cfc9bc' : '#c4bead';
    ctx.fillRect(px, py, s, s);
    // Juntas de las baldosas de vereda.
    ctx.strokeStyle = '#a79f8f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + s / 2 + 0.5);
    ctx.lineTo(px + s, py + s / 2 + 0.5);
    if (ruido(x, y, 21) > 0.5) {
      ctx.moveTo(px + s / 2 + 0.5, py);
      ctx.lineTo(px + s / 2 + 0.5, py + s / 2);
    } else {
      ctx.moveTo(px + s / 2 + 0.5, py + s / 2);
      ctx.lineTo(px + s / 2 + 0.5, py + s);
    }
    ctx.stroke();
    ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
  }
}

function dibujarEmoji(emoji, cx, cy, base) {
  ctx.font = `${fz(base)}px ${FUENTE_EMOJI}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, cx, cy);
}

function dibujarPista(n, px, py) {
  const txt = String(n);
  const cx = px + CELDA / 2;
  const cy = py + CELDA / 2 + 1;
  ctx.font = `bold ${fz(16)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Halo claro para que el número se lea sobre pasto y sobre vereda.
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, fz(16) / 4);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.strokeText(txt, cx, cy);
  ctx.fillStyle = COLORES_PISTA[n];
  ctx.fillText(txt, cx, cy);
}

function dibujarJugador(px, py) {
  if (!spriteJugador) return;
  const alto = CELDA * 0.95;
  const ancho = spriteJugador.width * alto / spriteJugador.height;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spriteJugador, px + (CELDA - ancho) / 2, py + CELDA - alto, ancho, alto);
}

function dibujarPaseos() {
  for (const p of juego.paseos) {
    const cx = p.x * CELDA + CELDA / 2;
    const cy = p.y * CELDA + CELDA / 2;
    dibujarEmoji(p.persona, cx, cy - CELDA * 0.06, 20);
    dibujarEmoji(p.perro, cx - p.dx * CELDA * 0.7, cy + CELDA * 0.1, 18);
  }
}

function dibujar() {
  if (!juego) return;
  const { t } = juego;
  const terminado = estado !== 'jugando';
  const dpr = vista.dpr;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Coordenadas del mundo en px, con la cámara desplazada y escala de pantalla.
  ctx.setTransform(dpr, 0, 0, dpr, -vista.cam.x * dpr, -vista.cam.y * dpr);

  // Pasada 1: terreno. Los paseadores van encima del terreno y debajo de
  // las marcas, así las pistas y la niebla siguen legibles.
  for (let y = 0; y < t.alto; y++) {
    for (let x = 0; x < t.ancho; x++) dibujarTerreno(x, y, t.celdas[Tablero.idx(t, x, y)].zona);
  }
  dibujarPaseos();

  for (let y = 0; y < t.alto; y++) {
    for (let x = 0; x < t.ancho; x++) {
      const i = Tablero.idx(t, x, y);
      const celda = t.celdas[i];
      const px = x * CELDA;
      const py = y * CELDA;
      const pista = juego.pistas.get(i);

      // Baldosas sin revelar: un velo para distinguirlas.
      if (pista === undefined && !juego.visitadas.has(i)) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
        ctx.fillRect(px, py, CELDA, CELDA);
      }
      if (pista !== undefined && pista > 0) dibujarPista(pista, px, py);
      // Huellas de las baldosas pisadas.
      if (juego.visitadas.has(i)) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(px + CELDA / 2, py + CELDA / 2, Math.max(2, CELDA / 12), 0, Math.PI * 2);
        ctx.fill();
      }
      // Bandera del jugador: 🚩 (no se confunde con la caca).
      if (juego.banderas.has(i)) dibujarEmoji('🚩', px + CELDA / 2, py + CELDA / 2, 18);
      if (terminado && celda.caca) dibujarEmoji('💩', px + CELDA / 2, py + CELDA / 2, 20);
    }
  }

  // Inicio (casa) y salida (parada de colectivo).
  dibujarEmoji('🏠', t.inicio.x * CELDA + CELDA / 2, t.inicio.y * CELDA + CELDA / 2, 18);
  dibujarEmoji('🚏', t.salida.x * CELDA + CELDA / 2, t.salida.y * CELDA + CELDA / 2, 18);

  // Baldosa hacia la que mira el personaje.
  if (!terminado) {
    const f = baldosaDeFrente();
    if (Tablero.dentro(t, f.x, f.y)) {
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 4;
      ctx.strokeRect(f.x * CELDA + 2, f.y * CELDA + 2, CELDA - 4, CELDA - 4);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(f.x * CELDA + 2, f.y * CELDA + 2, CELDA - 4, CELDA - 4);
    }
  }

  dibujarJugador(juego.jugador.x * CELDA, juego.jugador.y * CELDA);
}

function actualizarHud() {
  if (!juego) return;
  const seg = segundos();
  const clave = [corrida.nivel, juego.pasos, corrida.pasosTotales, juego.banderas.size, seg].join('|');
  if (clave === claveHud) return;
  claveHud = clave;
  $('nivel').textContent = `${corrida.nivel + 1}/${NIVELES.length}`;
  $('pasos').textContent = juego.pasos;
  $('pasos-totales').textContent = corrida.pasosTotales;
  $('banderas').textContent = juego.banderas.size;
  $('tiempo').textContent = `${seg}s`;
  canvas.setAttribute('aria-label',
    `Nivel ${corrida.nivel + 1}. Pasos ${juego.pasos}. Banderas ${juego.banderas.size}.`);
}

// Dibujo bajo demanda: solo se redibuja cuando algo cambió.
function bucle() {
  if (estado === 'jugando') actualizarHud();
  if (sucio && juego) {
    dibujar();
    sucio = false;
  }
  requestAnimationFrame(bucle);
}

/* ---------- Entrada ---------- */

const TECLAS_MOVER = {
  ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
  ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
  ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
};

document.addEventListener('keydown', (e) => {
  if (estado !== 'jugando') return;
  if (TECLAS_MOVER[e.key]) {
    e.preventDefault();
    mover(...TECLAS_MOVER[e.key]);
  } else if (e.key === 'f' || e.key === 'F') {
    const f = baldosaDeFrente();
    alternarBandera(f.x, f.y);
  }
});

// Baldosa a partir de un evento sobre el canvas (incluye la cámara).
function celdaDesdeEvento(e) {
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left - canvas.clientLeft;
  const py = e.clientY - rect.top - canvas.clientTop;
  return {
    x: Math.floor((px + vista.cam.x) / CELDA),
    y: Math.floor((py + vista.cam.y) / CELDA),
  };
}

function cancelarGesto() {
  if (gesto) clearTimeout(gesto.timer);
  gesto = null;
}

// Toque corto = moverse; mantener apretado = bandera. Funciona con mouse y touch.
canvas.addEventListener('pointerdown', (e) => {
  if (estado !== 'jugando') return;
  if (e.pointerType === 'mouse' && e.button !== 0) return; // el derecho usa contextmenu
  const celda = celdaDesdeEvento(e);
  gesto = { id: e.pointerId, x: e.clientX, y: e.clientY, celda, larga: false, timer: null };
  gesto.timer = setTimeout(() => {
    if (!gesto) return;
    gesto.larga = true;
    alternarBandera(celda.x, celda.y);
    if (navigator.vibrate) navigator.vibrate(15);
  }, PULSACION_LARGA);
});

canvas.addEventListener('pointermove', (e) => {
  if (!gesto || e.pointerId !== gesto.id) return;
  // Si el dedo se corre, es un desplazamiento: no cuenta como toque.
  if (Math.hypot(e.clientX - gesto.x, e.clientY - gesto.y) > 12) cancelarGesto();
});

canvas.addEventListener('pointercancel', cancelarGesto);

canvas.addEventListener('pointerup', (e) => {
  if (!gesto || e.pointerId !== gesto.id) return;
  const g = gesto;
  cancelarGesto();
  if (g.larga || estado !== 'jugando') return;
  const dx = g.celda.x - juego.jugador.x;
  const dy = g.celda.y - juego.jugador.y;
  if (dx === 0 && dy === 0) return;
  if (Math.abs(dx) + Math.abs(dy) !== 1) {
    mensaje('Solo podés pisar una baldosa contigua.');
    return;
  }
  mover(dx, dy);
  actualizarCamara();
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (estado !== 'jugando') return;
  const { x, y } = celdaDesdeEvento(e);
  alternarBandera(x, y);
});

document.querySelectorAll('.cruz button').forEach((b) => {
  const dirs = { arriba: [0, -1], abajo: [0, 1], izquierda: [-1, 0], derecha: [1, 0] };
  b.addEventListener('click', () => {
    mover(...dirs[b.dataset.dir]);
    actualizarCamara();
  });
});
$('btn-bandera').addEventListener('click', () => {
  const f = baldosaDeFrente();
  alternarBandera(f.x, f.y);
});

window.addEventListener('resize', () => {
  if (!juego) return;
  ajustarVista();
  actualizarCamara();
});

/* ---------- Pantallas ---------- */

$('btn-jugar').addEventListener('click', () => {
  spriteJugador = ConstructorPersonaje.crearSprite(control.obtenerConfig());
  pantallaPersonaje.classList.add('oculta');
  nuevaPartida();
});

$('btn-cambiar').addEventListener('click', () => {
  ocultarFin();
  estado = 'personaje';
  pantallaPersonaje.classList.remove('oculta');
});

$('btn-otra').addEventListener('click', () => {
  if (estado === 'completo') {
    corrida = { nivel: 0, pasosTotales: 0 };
  }
  // Si perdiste, se repite el mismo nivel: los pasos totales siguen contando.
  nuevaPartida();
});

$('btn-siguiente').addEventListener('click', () => {
  corrida.nivel++;
  nuevaPartida();
});

control = ConstructorPersonaje.montar({
  contenedor: $('opciones'),
  previa: $('previa'),
  botonAzar: $('btn-azar'),
  claveStorage: CLAVE_PERSONAJE,
});

requestAnimationFrame(bucle);
