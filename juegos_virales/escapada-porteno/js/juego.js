'use strict';

/* Escapada porteña: escabullirse, vender y no ser atrapado.
   Cada nivel transcurre en una zona reconocible de CABA. */

const COLUMNAS = 20;
const FILAS = 12;
const ANCHO = COLUMNAS * TAM_TILE;
const ALTO = FILAS * TAM_TILE;

const BLOQUEADOS = new Set(['#', 'T', 'K', 'B']);
const CAMINABLES_ARTICULO = ['.', 'p'];
const MAX_BOLSA = 6;
const MAX_ARTICULOS_EN_MAPA = 9;
const VEL_CAMINAR = 60;
const VEL_CORRER = 104;
const VEL_PATRULLA = 40;
const VEL_BUSQUEDA = 50;
const CLAVE_MEJOR = 'escapada.mejor';
const CAMINABLES_PEATON = ['.', '=', 'p', 'C'];
const PEATONES_MIN = 4;
const PEATONES_EXTRA = 3;       // se suman 0..2 -> entre 4 y 6 por nivel
const DIST_CONTACTO = 14;       // px entre el centro del jugador y el del peatón
const DURACION_CHARLA = 1.8;    // segundos que el jugador queda quieto hablando
const PROB_VENTA = 0.25;        // Math.random() < 0.25 -> se concreta la venta
const COOLDOWN_PEATON = 3;      // segundos antes de poder volver a hablarle al mismo

const ARTICULOS = {
  palta:    { valor: 3, nombre: 'palta' },
  media:    { valor: 2, nombre: 'media' },
  empanada: { valor: 4, nombre: 'empanada' },
  churro:   { valor: 5, nombre: 'churro' },
};
const CLAVES_ARTICULO = Object.keys(ARTICULOS);

/* ---------- Niveles por zona ----------
   Cada fila interior tiene 18 caracteres. Filas 5 y 6 son la calle principal.
   Leyenda: . acera · = calle · # edificio · p pasto · h arbusto (escondite)
            T árbol · K kiosco · B banco · C parada de colectivo (decorativa;
            allí esperan más peatones). Para vender hay que hablar con un peatón. */
const CALLE_COMPLETA = '='.repeat(COLUMNAS - 2);

const NIVELES = [
  {
    nombre: 'Obelisco',
    descripcion: 'Centro, entre la plaza y la avenida. Hablá con los peatones para vender.',
    meta: 30,
    tinte: null,
    interior: [
      '..pppp.#....#..hh.',
      '..pppp.#....#..hh.',
      '........T...#.....',
      '.K......B.........',
      '.........C........',
      CALLE_COMPLETA,
      CALLE_COMPLETA,
      '.......==.........',
      '.h.....==....T....',
      '.......==.......C.',
    ],
  },
  {
    nombre: 'San Telmo',
    descripcion: 'Feria de los domingos: muchos puestos y mucha gente.',
    meta: 45,
    tinte: 'rgba(255, 170, 80, 0.10)',
    interior: [
      'K.K.....K.K.....pp',
      '..pp....B.......pp',
      '....K.K...h.K.K...',
      '...C.........C....',
      '..h.......B.....hh',
      CALLE_COMPLETA,
      CALLE_COMPLETA,
      '........==........',
      '..K.....==..K.....',
      '........==....C...',
    ],
  },
  {
    nombre: 'La Boca',
    descripcion: 'Caminito y sus colores. Los setos te tapan bien.',
    meta: 60,
    tinte: 'rgba(60, 160, 255, 0.08)',
    interior: [
      'hhhh..pp..hhhh....',
      'hhhh..pp..hhhh....',
      '....K.......B.....',
      '..K.K.....T.....K.',
      '....C..........C..',
      CALLE_COMPLETA,
      CALLE_COMPLETA,
      '...==........h....',
      '...==....K.......h',
      '...==....C........',
    ],
  },
  {
    nombre: 'Palermo',
    descripcion: 'Bosques y lagos: el último tramo, con más agentes.',
    meta: 80,
    tinte: 'rgba(40, 140, 70, 0.14)',
    interior: [
      'hhhhh.pppp..hhhh..',
      'hpppppp.hhh..pppp.',
      '..T.......K.....T.',
      'hhh...B.........hh',
      '.....C..........C.',
      CALLE_COMPLETA,
      CALLE_COMPLETA,
      '......==...h......',
      '..h...==..........',
      '......==....C.....',
    ],
  },
];

function armarMapa(interior) {
  const filas = interior.map(f => '#' + f.padEnd(COLUMNAS - 2, '.').slice(0, COLUMNAS - 2) + '#');
  return ['#'.repeat(COLUMNAS), ...filas, '#'.repeat(COLUMNAS)];
}

/* Rutas de patrulla en coordenadas de tile: todas sobre la calle principal,
   que es caminable en todos los niveles. */
const RUTAS = [
  [[1, 6], [18, 6]],
  [[18, 7], [1, 7]],
  [[4, 6], [4, 7], [14, 7], [14, 6]],
];
const INICIO_RUTA = [1, 0, 2];

const CONFIG_AGENTES = ['#e0a878', '#8d5a36', '#f6d2b1'].map(piel => ({
  piel,
  pelo: '#1d1a2a',
  peinado: 'gorra',
  remera: '#2a4fa0',
  pantalon: '#1c2233',
  zapatillas: '#111111',
  gorra: '#15172e',
  accesorio: 'nada',
  bolso: '#000000',
}));

/* Peatones: apariencia totalmente aleatoria dentro de las opciones del
   constructor del jugador. Son civiles: no persiguen ni atrapan a nadie. */
function configPeatonAleatoria() {
  const cfg = {};
  for (const [cat, def] of Object.entries(ConstructorPersonaje.OPCIONES)) {
    cfg[cat] = def.valores[Math.floor(Math.random() * def.valores.length)];
  }
  return cfg;
}

const FRASES_JUGADOR_ABRE = ['¿Qué llevás?'];
const FRASE_JUGADOR_PALTA = '¿Cuánto por las paltas?';
const FRASES_PEATON_ESPERA = ['Mmm, a ver...', '...'];
const FRASES_PEATON_VENTA = ['Dale, te compro'];
const FRASES_PEATON_NO = ['Mejor no, gracias', 'Ahora no tengo plata'];
const FRASES_JUGADOR_RESULTADO = { si: '¡Genial!', no: 'Bueno, nos vemos' };

const E_PIXEL = ['###', '#..', '##.', '#..', '###'];

function elegirFrase(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

/* ---------- Canvas y recursos ---------- */
const canvas = document.getElementById('mundo');
const ctx = canvas.getContext('2d');
canvas.width = ANCHO;
canvas.height = ALTO;
ctx.imageSmoothingEnabled = false;

const elAviso = document.getElementById('aviso');
const elFin = document.getElementById('pantalla-fin');
const elFinTitulo = document.getElementById('fin-titulo');
const elFinTexto = document.getElementById('fin-texto');
const btnOtra = document.getElementById('btn-otra');

const TILES = generarTiles();
const SPR_ARTICULO = {};
for (const k of CLAVES_ARTICULO) {
  const s = SPRITES_ARTICULO[k];
  SPR_ARTICULO[k] = spriteDesdeFilas(s.filas, s.paleta);
}

/* ---------- Estado ---------- */
let estado = 'personaje';   // personaje | jugando | transicion | fin
let nivelIdx = 0;
let mapa = armarMapa(NIVELES[0].interior);
let jugador = null;
let agentes = [];
let agenteExtraLlegado = false;
let articulos = [];
let bolsa = [];
let sprJugador = null;
let sprAgentes = [];
let puntos = 0;
let puntosInicioNivel = 0;
let tiempoNivel = 0;
let aire = 100;
let mejor = 0;
let timerSpawn = 0;
let cdAvisoBolsa = 0;
let tiempoTransicion = 0;
let ganado = false;
let avisoT = null;
let peatones = [];
let charla = null;          // { peaton, tiempo } mientras el jugador habla con alguien

const teclas = { arr: false, aba: false, izq: false, der: false, shift: false, correrTactil: false };
const MAPA_TECLAS = {
  ArrowUp: 'arr', KeyW: 'arr', ArrowDown: 'aba', KeyS: 'aba',
  ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der',
  ShiftLeft: 'shift', ShiftRight: 'shift',
};

/* ---------- Utilidades de mapa ---------- */
function centro(tx, ty) {
  return { x: tx * TAM_TILE + TAM_TILE / 2, y: ty * TAM_TILE + TAM_TILE / 2 };
}

function tipoEn(x, y) {
  const tx = Math.floor(x / TAM_TILE);
  const ty = Math.floor(y / TAM_TILE);
  if (tx < 0 || ty < 0 || tx >= COLUMNAS || ty >= FILAS) return '#';
  return mapa[ty][tx];
}

function libre(x, y) {
  const r = 3;
  const puntosChequeo = [[x - r, y - r], [x + r - 0.01, y - r], [x - r, y + r - 0.01], [x + r - 0.01, y + r - 0.01]];
  return puntosChequeo.every(([px, py]) => !BLOQUEADOS.has(tipoEn(px, py)));
}

function distancia(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function moverCuerpo(e, dx, dy) {
  if (dx && libre(e.x + dx, e.y)) e.x += dx;
  if (dy && libre(e.x, e.y + dy)) e.y += dy;
}

/* Devuelve true si llegó al destino. Si queda trabado, rodea el obstáculo. */
function moverHacia(e, tx, ty, vel, dt) {
  const dx = tx - e.x;
  const dy = ty - e.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const paso = Math.min(d, vel * dt);
  const ux = (dx / d) * paso;
  const uy = (dy / d) * paso;
  const x0 = e.x;
  const y0 = e.y;
  moverCuerpo(e, ux, uy);
  if (e.x === x0 && e.y === y0) moverCuerpo(e, -uy * e.lado, ux * e.lado);
  return false;
}

function buscarCaminable(tx, ty) {
  for (let r = 0; r < COLUMNAS; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = tx + dx;
        const y = ty + dy;
        if (x > 0 && y > 0 && x < COLUMNAS - 1 && y < FILAS - 1 && !BLOQUEADOS.has(mapa[y][x])) {
          return centro(x, y);
        }
      }
    }
  }
  return centro(1, 1);
}

function celdaArticulo() {
  for (let i = 0; i < 60; i++) {
    const tx = 1 + Math.floor(Math.random() * (COLUMNAS - 2));
    const ty = 1 + Math.floor(Math.random() * (FILAS - 2));
    if (CAMINABLES_ARTICULO.includes(mapa[ty][tx])) return centro(tx, ty);
  }
  return null;
}

/* ---------- Agentes (sin armas; solo persiguen) ---------- */
function crearAgente(i) {
  const ruta = RUTAS[i];
  const inicio = INICIO_RUTA[i];
  const p = centro(ruta[inicio][0], ruta[inicio][1]);
  return {
    i,
    x: p.x,
    y: p.y,
    destino: inicio,
    estado: 'patrulla',
    tiempo: 0,
    visto: 0,
    ux: p.x,
    uy: p.y,
    lado: Math.random() < 0.5 ? 1 : -1,
    bob: Math.random() * 6,
  };
}

function veAJugador(a) {
  const escondido = tipoEn(jugador.x, jugador.y) === 'h';
  const radio = escondido ? 14 : (jugador.corriendo ? 96 : 64);
  return distancia(a, jugador) <= radio;
}

function velocidadPersecucion() {
  const base = Math.min(86, 66 + tiempoNivel * 0.1);
  return base * (1 + 0.05 * nivelIdx);
}

function masCercanoEnRuta(a) {
  const ruta = RUTAS[a.i];
  let mejorIdx = 0;
  let mejorDist = Infinity;
  ruta.forEach(([tx, ty], idx) => {
    const p = centro(tx, ty);
    const d = distancia(a, p);
    if (d < mejorDist) { mejorDist = d; mejorIdx = idx; }
  });
  return mejorIdx;
}

/* Devuelve true si el agente atrapó al jugador en este frame. */
function actualizarAgente(a, dt) {
  a.bob += dt * 8;
  const ve = veAJugador(a);
  const ruta = RUTAS[a.i];

  switch (a.estado) {
    case 'patrulla': {
      if (ve) { a.estado = 'alerta'; a.tiempo = 0.6; return false; }
      const p = centro(ruta[a.destino][0], ruta[a.destino][1]);
      if (moverHacia(a, p.x, p.y, VEL_PATRULLA, dt)) {
        a.destino = (a.destino + 1) % ruta.length;
      }
      return false;
    }
    case 'alerta': {
      if (!ve) { a.estado = 'patrulla'; return false; }
      a.tiempo -= dt;
      if (a.tiempo <= 0) {
        a.estado = 'persecucion';
        a.visto = 0;
        a.ux = jugador.x;
        a.uy = jugador.y;
      }
      return false;
    }
    case 'persecucion': {
      if (ve) {
        a.visto = 0;
        a.ux = jugador.x;
        a.uy = jugador.y;
      } else {
        a.visto += dt;
      }
      if (a.visto > 2.5) {
        a.estado = 'busqueda';
        a.tiempo = 2;
        return false;
      }
      moverHacia(a, a.ux, a.uy, velocidadPersecucion(), dt);
      return distancia(a, jugador) < 9;
    }
    case 'busqueda': {
      if (ve) { a.estado = 'alerta'; a.tiempo = 0.6; return false; }
      if (moverHacia(a, a.ux, a.uy, VEL_BUSQUEDA, dt)) {
        a.tiempo -= dt;
        if (a.tiempo <= 0) {
          a.estado = 'patrulla';
          a.destino = masCercanoEnRuta(a);
        }
      }
      return false;
    }
  }
  return false;
}

/* ---------- Artículos ---------- */
function actualizarArticulos(dt) {
  timerSpawn -= dt;
  if (timerSpawn <= 0 && articulos.length < MAX_ARTICULOS_EN_MAPA) {
    timerSpawn = 1.2;
    const p = celdaArticulo();
    if (p && distancia(p, jugador) > 40) {
      const clave = CLAVES_ARTICULO[Math.floor(Math.random() * CLAVES_ARTICULO.length)];
      articulos.push({ tipo: clave, x: p.x, y: p.y });
    }
  }

  cdAvisoBolsa -= dt;
  for (let i = articulos.length - 1; i >= 0; i--) {
    const a = articulos[i];
    if (distancia(a, jugador) >= 10) continue;
    if (bolsa.length < MAX_BOLSA) {
      bolsa.push(a.tipo);
      articulos.splice(i, 1);
      renderBolsa();
      aviso(`Levantaste una ${ARTICULOS[a.tipo].nombre}`);
    } else if (cdAvisoBolsa <= 0) {
      cdAvisoBolsa = 3;
      aviso('La bolsa está llena: hablá con un peatón para vender');
    }
  }
}

/* ---------- Peatones (civiles, no persiguen) ---------- */
function celdasCon(tipos) {
  const out = [];
  for (let y = 1; y < FILAS - 1; y++) {
    for (let x = 1; x < COLUMNAS - 1; x++) {
      if (tipos.includes(mapa[y][x])) out.push(centro(x, y));
    }
  }
  return out;
}

/* Destino al azar sobre tiles caminables. A veces elige una parada (C). */
function destinoPeaton(distMinJugador = 0) {
  const paradas = celdasCon(['C']);
  const todas = celdasCon(CAMINABLES_PEATON);
  const pool = (paradas.length && Math.random() < 0.3) ? paradas : todas;
  for (let i = 0; i < 40; i++) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    if (!jugador || distancia(c, jugador) >= distMinJugador) return c;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function caminablePeaton(x, y) {
  const r = 3;
  const puntosChequeo = [[x - r, y - r], [x + r - 0.01, y - r], [x - r, y + r - 0.01], [x + r - 0.01, y + r - 0.01]];
  return puntosChequeo.every(([px, py]) => CAMINABLES_PEATON.includes(tipoEn(px, py)));
}

function moverPeaton(p, dx, dy) {
  if (dx && caminablePeaton(p.x + dx, p.y)) p.x += dx;
  if (dy && caminablePeaton(p.x, p.y + dy)) p.y += dy;
}

function crearPeaton() {
  const p = destinoPeaton(40);
  return {
    x: p.x,
    y: p.y,
    spr: ConstructorPersonaje.crearSprite(configPeatonAleatoria()),
    destino: null,
    pausa: Math.random() * 2,
    vel: 26 + Math.random() * 14,
    bloqueo: 0,
    bob: Math.random() * 6,
    cooldown: 0,
    huyendo: 0,
    globo: null,
  };
}

function actualizarPeaton(p, dt) {
  if (p.cooldown > 0) p.cooldown -= dt;
  if (p.huyendo > 0) p.huyendo -= dt;
  if (p.globo && !(charla && charla.peaton === p)) {
    p.globo.t -= dt;
    if (p.globo.t <= 0) p.globo = null;
  }
  if (charla && charla.peaton === p) return;   // quieto mientras charla
  if (p.pausa > 0) { p.pausa -= dt; return; }
  if (!p.destino) { p.destino = destinoPeaton(); return; }

  const dx = p.destino.x - p.x;
  const dy = p.destino.y - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) {
    p.destino = null;
    p.pausa = 0.5 + Math.random() * 1.5;
    return;
  }
  const vel = p.huyendo > 0 ? 56 : p.vel;
  const paso = Math.min(d, vel * dt);
  const x0 = p.x;
  const y0 = p.y;
  moverPeaton(p, (dx / d) * paso, (dy / d) * paso);
  if (p.x === x0 && p.y === y0) {
    p.bloqueo += dt;
    if (p.bloqueo > 0.4) { p.bloqueo = 0; p.destino = null; }  // trabado: elige otro
  } else {
    p.bloqueo = 0;
    p.bob += dt * 8;
  }
}

/* Peatón más cercano dentro del radio de contacto (o null). */
function peatonCercano() {
  let elegido = null;
  let distElegido = DIST_CONTACTO;
  for (const p of peatones) {
    const d = distancia(p, jugador);
    if (d <= distElegido) { distElegido = d; elegido = p; }
  }
  return elegido;
}

/* ---------- Charla y venta ---------- */
function intentarHablar() {
  if (estado !== 'jugando' || charla) return;
  if (bolsa.length === 0) { aviso('No llevás nada para vender'); return; }
  const p = peatonCercano();
  if (!p) { aviso('Acercate a un peatón para hablarle'); return; }
  if (p.cooldown > 0) { aviso('Esperá un poco: ese peatón ya no quiere hablar'); return; }
  iniciarCharla(p);
}

function iniciarCharla(p) {
  const abre = (bolsa.includes('palta') && Math.random() < 0.5)
    ? FRASE_JUGADOR_PALTA
    : elegirFrase(FRASES_JUGADOR_ABRE);
  charla = { peaton: p, tiempo: DURACION_CHARLA };
  p.destino = null;
  jugador.globo = { texto: abre, t: 99 };   // se reemplaza al resolver
  p.globo = { texto: elegirFrase(FRASES_PEATON_ESPERA), t: 99 };
}

function resolverCharla() {
  const p = charla.peaton;
  charla = null;
  p.cooldown = COOLDOWN_PEATON;
  if (Math.random() < PROB_VENTA) {
    jugador.globo = { texto: FRASES_JUGADOR_RESULTADO.si, t: 1.4 };
    p.globo = { texto: elegirFrase(FRASES_PEATON_VENTA), t: 1.4 };
    venderBolsa();
  } else {
    jugador.globo = { texto: FRASES_JUGADOR_RESULTADO.no, t: 1.4 };
    p.globo = { texto: elegirFrase(FRASES_PEATON_NO), t: 1.4 };
    p.huyendo = 2.5;                       // se aleja unos segundos
    p.destino = destinoPeaton(120);
    p.pausa = 0;
  }
}

function venderBolsa() {
  const cantidad = bolsa.length;
  const suma = bolsa.reduce((acc, t) => acc + ARTICULOS[t].valor, 0);
  puntos += suma;
  bolsa = [];
  renderBolsa();
  aviso(`¡Vendiste ${cantidad} artículos! +$${suma}`);
}

/* ---------- Flujo de niveles ---------- */
function cargarNivel(idx, puntosBase) {
  nivelIdx = idx;
  const nivel = NIVELES[idx];
  mapa = armarMapa(nivel.interior);
  puntos = puntosBase;
  puntosInicioNivel = puntosBase;

  const inicio = buscarCaminable(3, 8);
  jugador = { x: inicio.x, y: inicio.y, corriendo: false, moviendo: false, bob: 0, globo: null };

  agentes = (idx === 0 ? [0, 1] : [0, 1, 2]).map(crearAgente);
  agenteExtraLlegado = idx !== 0;

  const cantPeatones = PEATONES_MIN + Math.floor(Math.random() * PEATONES_EXTRA);
  peatones = Array.from({ length: cantPeatones }, crearPeaton);
  charla = null;

  articulos = [];
  bolsa = [];
  tiempoNivel = 0;
  aire = 100;
  timerSpawn = 0.5;
  cdAvisoBolsa = 0;
  estado = 'jugando';
  renderBolsa();
  aviso(`Nivel ${idx + 1} · ${nivel.nombre}: ${nivel.descripcion} Meta: $${nivel.meta}`, 5000);
}

function completarNivel() {
  if (nivelIdx === NIVELES.length - 1) {
    ganar();
    return;
  }
  estado = 'transicion';
  tiempoTransicion = 3;
  aviso(`¡${NIVELES[nivelIdx].nombre} completo! Próxima parada: ${NIVELES[nivelIdx + 1].nombre}`, 3000);
}

function terminar() {
  estado = 'fin';
  ganado = false;
  charla = null;
  const perdidos = bolsa.length;
  if (puntos > mejor) guardarMejor(puntos);
  bolsa = [];
  renderBolsa();

  const nivel = NIVELES[nivelIdx];
  elFinTitulo.textContent = '¡Te atraparon!';
  elFinTexto.textContent =
    (perdidos
      ? `Se te cayeron ${perdidos} artículos de la bolsa. `
      : 'No llevabas nada en la bolsa. ') +
    `Nivel ${nivelIdx + 1} (${nivel.nombre}). Vendiste $${puntos} en total. Mejor marca: $${mejor}.`;
  btnOtra.textContent = 'Reintentar nivel';
  mostrarFin();
}

function ganar() {
  estado = 'fin';
  ganado = true;
  if (puntos > mejor) guardarMejor(puntos);
  bolsa = [];
  renderBolsa();
  elFinTitulo.textContent = '¡Recorriste la ciudad!';
  elFinTexto.textContent = `Pasaste por ${NIVELES.length} zonas y vendiste $${puntos}. Mejor marca: $${mejor}.`;
  btnOtra.textContent = 'Jugar de nuevo';
  mostrarFin();
}

function mostrarFin() { elFin.classList.remove('oculta'); }
function ocultarFin() { elFin.classList.add('oculta'); }

function iniciarJuego() {
  sprJugador = ConstructorPersonaje.crearSprite(obtenerConfigPersonaje());
  sprAgentes = CONFIG_AGENTES.map(c => ConstructorPersonaje.crearSprite(c));
  ocultarFin();
  cargarNivel(0, 0);
}

/* ---------- Mejor marca y avisos ---------- */
function leerMejor() {
  try { return Number(localStorage.getItem(CLAVE_MEJOR)) || 0; } catch (e) { return 0; }
}

function guardarMejor(valor) {
  mejor = valor;
  try { localStorage.setItem(CLAVE_MEJOR, String(valor)); } catch (e) { /* ignorar */ }
}

function aviso(texto, ms = 2200) {
  elAviso.textContent = texto;
  clearTimeout(avisoT);
  avisoT = setTimeout(() => { elAviso.textContent = ''; }, ms);
}

function renderBolsa() {
  const cont = document.getElementById('bolsa-iconos');
  cont.innerHTML = '';
  for (const t of bolsa) {
    const c = crearLienzo(8, 8);
    c.getContext('2d').drawImage(SPR_ARTICULO[t], 0, 0);
    cont.appendChild(c);
  }
}

function actualizarHUD() {
  document.getElementById('bolsa-contador').textContent = `${bolsa.length}/${MAX_BOLSA}`;
  document.getElementById('puntos').textContent = `$${puntos}`;
  document.getElementById('tiempo').textContent = `${Math.floor(tiempoNivel)}s`;
  document.getElementById('aire').style.width = `${Math.round(aire)}%`;
}

/* ---------- Actualización ---------- */
function actualizar(dt) {
  if (estado === 'transicion') {
    tiempoTransicion -= dt;
    if (tiempoTransicion <= 0) cargarNivel(nivelIdx + 1, puntos);
    return;
  }

  tiempoNivel += dt;

  // Globos del jugador (los de la charla en curso se reemplazan al resolverla)
  if (jugador.globo && !charla) {
    jugador.globo.t -= dt;
    if (jugador.globo.t <= 0) jugador.globo = null;
  }

  // Durante la charla el jugador queda quieto: no lee teclas ni corre
  let dx = 0;
  let dy = 0;
  if (!charla) {
    if (teclas.izq) dx -= 1;
    if (teclas.der) dx += 1;
    if (teclas.arr) dy -= 1;
    if (teclas.aba) dy += 1;
  }
  const moviendo = dx !== 0 || dy !== 0;
  if (moviendo) {
    const l = Math.hypot(dx, dy);
    dx /= l;
    dy /= l;
  }

  const corriendo = !charla && (teclas.shift || teclas.correrTactil) && moviendo && aire > 0;
  jugador.corriendo = corriendo;
  aire = corriendo ? Math.max(0, aire - 28 * dt) : Math.min(100, aire + 18 * dt);

  const vel = corriendo ? VEL_CORRER : VEL_CAMINAR;
  moverCuerpo(jugador, dx * vel * dt, dy * vel * dt);
  jugador.moviendo = moviendo;
  if (moviendo) jugador.bob += dt * 10;

  if (!agenteExtraLlegado && tiempoNivel > 40) {
    agenteExtraLlegado = true;
    agentes.push(crearAgente(2));
    aviso('Llegó un refuerzo a la zona');
  }

  for (const a of agentes) {
    if (actualizarAgente(a, dt)) {
      terminar();
      return;
    }
  }

  for (const p of peatones) actualizarPeaton(p, dt);

  if (charla) {
    charla.tiempo -= dt;
    if (charla.tiempo <= 0) resolverCharla();
  }

  actualizarArticulos(dt);

  if (puntos - puntosInicioNivel >= NIVELES[nivelIdx].meta) {
    completarNivel();
  }
}

/* ---------- Dibujo ---------- */
function dibujarSombra(x, y) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(Math.round(x - 5), Math.round(y + 6), 10, 2);
}

function dibujarAgente(a) {
  const bob = Math.floor(a.bob) % 2 ? -1 : 0;
  dibujarSombra(a.x, a.y);
  ctx.drawImage(sprAgentes[a.i], Math.round(a.x - 6), Math.round(a.y - 8) + bob);
  if (a.estado === 'alerta' || a.estado === 'persecucion') {
    const x = Math.round(a.x) - 1;
    const y = Math.round(a.y) - 22;
    ctx.fillStyle = '#e53935';
    ctx.fillRect(x, y, 2, 6);
    ctx.fillRect(x, y + 8, 2, 2);
  }
}

function dibujarPeaton(p) {
  const bob = (p.destino && Math.floor(p.bob) % 2) ? -1 : 0;
  dibujarSombra(p.x, p.y);
  ctx.drawImage(p.spr, Math.round(p.x - 6), Math.round(p.y - 8) + bob);
}

/* Indicador "E" en pixel sobre un peatón con quien se puede hablar. */
function dibujarIndicadorE(p) {
  const bx = Math.round(p.x) - 3;
  const by = Math.round(p.y) - 26 - (Math.floor(ultimoT / 300) % 2);
  ctx.fillStyle = '#1d1a2a';
  ctx.fillRect(bx - 1, by - 1, 9, 9);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx, by, 7, 7);
  ctx.fillStyle = '#1d1a2a';
  E_PIXEL.forEach((fila, y) => {
    for (let x = 0; x < fila.length; x++) {
      if (fila[x] === '#') ctx.fillRect(bx + 2 + x, by + 1 + y, 1, 1);
    }
  });
}

/* Globo de diálogo en pixel: fondo blanco, borde oscuro y colita hacia la cabeza. */
function dibujarGlobo(ent, texto) {
  ctx.font = '8px monospace';
  ctx.textBaseline = 'middle';
  const w = Math.ceil(ctx.measureText(texto).width) + 6;
  const h = 11;
  const cx = Math.round(ent.x);
  const x = Math.max(2, Math.min(ANCHO - w - 2, cx - Math.floor(w / 2)));
  const y = Math.max(1, Math.round(ent.y) - 12 - h);
  const colita = Math.max(x + 2, Math.min(x + w - 3, cx));

  ctx.fillStyle = '#1d1a2a';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillRect(colita - 2, y + h + 1, 5, 1);
  ctx.fillRect(colita - 1, y + h + 2, 3, 1);
  ctx.fillRect(colita, y + h + 3, 1, 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.fillRect(colita - 1, y + h + 1, 3, 1);
  ctx.fillRect(colita, y + h + 2, 1, 1);
  ctx.fillStyle = '#1d1a2a';
  ctx.fillText(texto, x + 3, y + h / 2 + 0.5);
}

function dibujarJugador() {
  const bob = jugador.moviendo ? (Math.floor(jugador.bob) % 2 ? -1 : 0) : 0;
  const escondido = tipoEn(jugador.x, jugador.y) === 'h';
  dibujarSombra(jugador.x, jugador.y);
  ctx.globalAlpha = escondido ? 0.55 : 1;
  ctx.drawImage(sprJugador, Math.round(jugador.x - 6), Math.round(jugador.y - 8) + bob);
  ctx.globalAlpha = 1;
}

function dibujar() {
  ctx.clearRect(0, 0, ANCHO, ALTO);

  for (let y = 0; y < FILAS; y++) {
    for (let x = 0; x < COLUMNAS; x++) {
      ctx.drawImage(TILES[mapa[y][x]], x * TAM_TILE, y * TAM_TILE);
    }
  }

  const tinte = NIVELES[nivelIdx].tinte;
  if (tinte) {
    ctx.fillStyle = tinte;
    ctx.fillRect(0, 0, ANCHO, ALTO);
  }

  if (!jugador) return;

  for (const a of articulos) {
    dibujarSombra(a.x, a.y);
    ctx.drawImage(SPR_ARTICULO[a.tipo], Math.round(a.x - 4), Math.round(a.y - 4));
  }

  const entidades = agentes.map(a => ({ y: a.y, dibujar: () => dibujarAgente(a) }));
  for (const p of peatones) entidades.push({ y: p.y, dibujar: () => dibujarPeaton(p) });
  entidades.push({ y: jugador.y, dibujar: dibujarJugador });
  entidades.sort((p, q) => p.y - q.y);
  entidades.forEach(e => e.dibujar());

  // Indicador de contacto y globos, por encima de todo
  if (bolsa.length > 0 && !charla && estado === 'jugando') {
    const cerca = peatonCercano();
    if (cerca && cerca.cooldown <= 0) dibujarIndicadorE(cerca);
  }
  ctx.font = '8px monospace';
  for (const p of peatones) {
    if (p.globo) dibujarGlobo(p, p.globo.texto);
  }
  if (jugador.globo) dibujarGlobo(jugador, jugador.globo.texto);
}

/* ---------- Bucle principal ---------- */
let ultimoT = performance.now();

function bucle(t) {
  const dt = Math.min(0.05, (t - ultimoT) / 1000);
  ultimoT = t;
  if (estado === 'jugando' || estado === 'transicion') actualizar(dt);
  dibujar();
  if (jugador) actualizarHUD();
  requestAnimationFrame(bucle);
}

/* ---------- Controles ---------- */
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyE' || e.code === 'Space') {
    // Solo durante el juego: en las pantallas de menú Espacio sigue activando botones
    if (estado === 'jugando') {
      e.preventDefault();
      if (!e.repeat) intentarHablar();
    }
    return;
  }
  const k = MAPA_TECLAS[e.code];
  if (!k) return;
  teclas[k] = true;
  if (e.code.startsWith('Arrow')) e.preventDefault();
});

window.addEventListener('keyup', (e) => {
  const k = MAPA_TECLAS[e.code];
  if (k) teclas[k] = false;
});

window.addEventListener('blur', () => {
  for (const k of Object.keys(teclas)) teclas[k] = false;
});

const MAPA_DIR = { arriba: 'arr', abajo: 'aba', izquierda: 'izq', derecha: 'der' };
document.querySelectorAll('[data-dir]').forEach((b) => {
  const k = MAPA_DIR[b.dataset.dir];
  const encender = (e) => { e.preventDefault(); teclas[k] = true; };
  const apagar = (e) => { e.preventDefault(); teclas[k] = false; };
  b.addEventListener('pointerdown', encender);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, apagar));
});

const btnCorrer = document.getElementById('btn-correr');
btnCorrer.addEventListener('pointerdown', (e) => { e.preventDefault(); teclas.correrTactil = true; });
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev =>
  btnCorrer.addEventListener(ev, () => { teclas.correrTactil = false; }));

document.getElementById('btn-hablar').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  intentarHablar();
});

btnOtra.addEventListener('click', () => {
  if (ganado) {
    iniciarJuego();
  } else {
    ocultarFin();
    cargarNivel(nivelIdx, puntosInicioNivel);
  }
});

document.getElementById('btn-cambiar').addEventListener('click', () => {
  ocultarFin();
  estado = 'personaje';
  mostrarPersonaje();
});

mejor = leerMejor();
requestAnimationFrame(bucle);
