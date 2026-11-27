// Arranque, bucle de frames y estados de partida (titulo, venta, jugando, fin). Une ciudad, agentes, peatones, cámara, render y controles.
// Economía por rondas: economia.js (sin DOM); pantallas Mercadería y Mejoras: venta.js.
import { generarCiudad, obstaculoEn, celdaPeatonal, celdaCaminableMasCerca, zonaEn } from './ciudad.js';
import { cargarCiudadReal } from './ciudad_real.js';   // mapa real de CABA (OpenStreetMap)
import { ZONA_CENTRO, centroideBarrio, perfilesDe } from './barrios.js';
import { dibujarMinimapa, dibujarMapaSeleccion } from './minimapa.js';
import { crearSimulacion, stepAgentes, ventaVista, alertarAgentes, resetAgentes, activarAgentes } from './agentes.js';
import { hudEstrellas } from './busqueda.js';
import { stepEnergia } from './energia.js';
import { crearCamara, seguir, zoomPor, aMundo } from './camara.js';
import { crearMapa, dibujar, dibujarSprite } from './render.js';
import { OPCIONES_PERSONAJE, cargarPersonaje, guardarPersonaje, personajeAlAzar, spriteJugador } from './personaje.js';   // personaje del vendedor (D1)
import { crearControles } from './controles.js';
import { crearCamino, planearCamino, iniciarCamino, cancelarCamino, pasoCamino } from './caminar.js';   // clic para caminar (G22)
import { dprLimitado, prefsMovil } from './viewport.js';   // tope del devicePixelRatio (2; 1 con calidad baja)
import './movil.js';   // modo táctil, pantalla completa y capa "Girá el teléfono" (avisa con 'movil:vertical')
import {
  SPEED, OFR_MED_ANG, OFR_CD, OFR_PAUSA,
  ZOOM_OPCIONES, ENERGIA_MAX, PEAT_RECICLO_T, PATRULLA_OPCIONES,
} from './config.js';
import {
  crearPartida, registrarVenta, registrarEscape, marcarPerseguido, cerrarRondaPuntos, puntosTotal, desgloseFin,
  unidadesCompradas, medalla, actualizarRecord, textoCompartir, enlacesCompartir, puntosEscape, registrarCoima,
} from './puntaje.js';
import { ofrecerCoima } from './coima.js';
import { COIMA_CIEGO } from './config.js';
import { REACCIONES, TEXTOS, MOTIVOS_FIN, MEJORAS_TEXTO } from './textos.js';
import { NOMBRE_PRODUCTO } from './productos.js';
import {
  crearPeaton, reiniciarMemoria, buscarObjetivoOfrecer, reaccionPara, aplicarReaccion, contagiarInsulto,
  ajustarPeatones, stepPeatones,
} from './peatones.js';
import { pistaUnaVez } from './pistas.js';
import { MOMENTO_INICIAL, jornadaPorId, momentoEn, cantidadPeatones, luzDe, acercarLuz } from './jornada.js';
import { mostrar, ocultar, ocultarTodas, irA, estaVisible, pasoNav } from './pantallas.js';
import { cargarAjustes, guardarAjustes } from './ajustes.js';
import { audio } from './audio.js';   // audio sintetizado (D6): efectos y música como la 3D
import {
  cargarEconomia, guardarEconomia, reiniciarEconomia, rondaNueva, productoActivo, stockTotal,
  reponer, vender, cerrarRonda, comprarMejora, nivel, radioOfrecer, velocidadCorrer, consumoCorrer, sinFondos,
  cambiarProducto, loteDe,
} from './economia.js';
import { montarVenta, pintarMercaderia, pintarMejoras, limpiarSel } from './venta.js';

const ICONO_PRODUCTO = { medias: '🧦', empanadas: '🥟', churros: '🍩', figuritas: '🃏', paltas: '🥑' };

const $ = id => document.getElementById(id);
const pesos = n => '$' + Math.round(n).toLocaleString('es-AR');
const wrapAng = a => { const T = Math.PI * 2; a = (a + Math.PI) % T; if (a < 0) a += T; return a - Math.PI; };
const angDiff = (a, b) => wrapAng(a - b);

const canvas = $('juego');
const ctx = canvas.getContext('2d');
const cam = crearCamara();
// Ciudad: el mapa real de CABA (datos/caba_recorte.*); si no carga, la ciudad procedural de respaldo (132 x 132).
let city;
try { city = await cargarCiudadReal(); }
catch (e) { console.warn('No se pudo cargar el mapa real; se usa la ciudad generada.', e); city = generarCiudad(); }
const N = city.N;
const ZONAS_NOMBRE = perfilesDe(city).map(b => b.nombre);       // nombres reales (o los 9 de la grilla de respaldo)
const ZONA_INI = city.zonaCentro ?? ZONA_CENTRO;                 // barrio del Obelisco
const centroZona = z => city.barrios?.[z]?.centro ?? centroideBarrio(z, N);
const mapa = crearMapa(city);               // mapa por mosaicos perezosos (render.js)
$('cargando').hidden = true;                // la ciudad ya está lista
const cvMini = $('minimapa'), cvSel = $('selMapa');
const SEL_ESPERA_S = 10;                    // segundos antes de empezar en el barrio central si no se elige
let zonaElegida = false;                    // la zona se elige una vez por partida, al salir de Mercadería la primera vez
let zonaSel = -1;                           // barrio resaltado en la pantalla de selección
let selTimer = 0;
let zonaHud = -2;                           // barrio mostrado en el HUD (solo se reescribe al cambiar)

let sim = null;                              // simulación de agentes (agentes.js)
let pl = null;                               // jugador: posición, energía ({ energia, agotado }) y movimiento
let personajeGuardado = cargarPersonaje();   // personaje del vendedor (personaje.js, clave 2d_personaje)
let borrador = { ...personajeGuardado };     // lo que se edita en la pantalla Personaje hasta Guardar
const camino = crearCamino();                // camino del clic para caminar (caminar.js); la entrada manual lo cancela
let peds = [];                               // peatones
let burbujas = [];                           // { x, z, texto, tipo, t0, dur }
let estado = 'titulo';                       // 'titulo' | 'venta' (Mercadería y Mejoras) | 'jugando' | 'fin'
let pausaJuego = false;                      // pausa del menú (Esc o P, o botón Pausa); congela la partida
let tiempo = 0, cdOfr = 0, finPend = 0;
let tRonda = 0, cdReciclo = PEAT_RECICLO_T;  // tiempo de la ronda en curso (s) y temporizador del reciclado de peatones
let objetivoOfr = null;                      // peatón objetivo de ofrecer en este cuadro (flecha amarilla), o null
let jornadaId = MOMENTO_INICIAL;             // momento del día (jornada.js) de la ronda en curso
let luz = luzDe(jornadaPorId(MOMENTO_INICIAL)); // colores de cielo y niebla, con transición hacia el momento actual
let partida = crearPartida();                // contadores y puntaje de la partida (puntaje.js)
let ultimoFin = null;                        // datos de la última pantalla de fin, para compartir
let snap = true;
const ajustes = cargarAjustes();             // volumen, distancia, zoom inicial y límite de FPS (ajustes.js)
let econ = cargarEconomia();                 // economía persistida (economia.js): caja, ronda, mejoras
let rd = rondaNueva();                       // ronda en curso: stock por producto, ingresos y costo

const hud = {
  ronda: $('hudRonda'), icono: $('hudIcono'), stockN: $('hudStockN'), stockBarra: $('hudStock'),
  dinero: $('hudDinero'), energia: $('hudEnergia'), puntos: $('hudPuntos'), alerta: $('hudAlerta'), alertaTxt: $('hudAlertaTxt'),
  jornada: $('hudJornada'), zona: $('hudZona'), energiaBar: $('hudEnergiaBar'), estrellas: $('hudEstrellas'),
};
const SEG_MAX = 45;                          // máximo de segmentos de la barra de stock (CAP_MAX de config.js)
let barraKey = '';                           // producto y lote de la barra, para no reconstruirla en cada cuadro

function toast(texto, tipo = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + tipo;
  el.textContent = texto;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// Pista de tutorial (pistas.js): se muestra una sola vez y queda guardada. Usa el cartel #pista sobre el HUD.
let pistaT = 0;
function pista(id, texto) {
  if (!pistaUnaVez(id, texto)) return;
  const el = $('pista');
  el.textContent = '💡 ' + texto;
  el.classList.add('on');
  clearTimeout(pistaT);
  pistaT = setTimeout(() => el.classList.remove('on'), 5500);
}

function bubble(x, z, texto, tipo = '', dur = 1.8) {
  burbujas.push({ x, z, texto, tipo, t0: tiempo, dur });
  while (burbujas.length > 6) burbujas.shift();
}

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function ciudadSpawn() {
  // Celda caminable más cercana al centro de la ciudad.
  const c = celdaPeatonal(city, N / 2, N / 2, 30) ?? { i: 0, j: 0 };
  return { x: c.i + .5, y: c.j + .5 };
}

// Partida: jugador en el centro, agentes en su esquina, peatones nuevos y contadores en cero. La economía no se toca aquí.
function nuevaPartida() {
  const s = ciudadSpawn();
  pl = { px: s.x, py: s.y, heading: 0, spd: 0, corre: false, prevPx: s.x, prevPy: s.y, path: [], target: null, energia: ENERGIA_MAX, agotado: false };
  const patrulla = PATRULLA_OPCIONES[ajustes.patrulla];   // patrulla elegida en Opciones (se aplica al empezar la partida)
  if (!sim) sim = crearSimulacion(city, { patrulla, coima: cobrarCoima });
  else resetAgentes(sim, patrulla, econ.ronda);
  sim.ronda = econ.ronda;
  activarAgentes(sim, pl);
  peds = [];
  for (let k = 0; k < cantidadPeatones(jornadaPorId(MOMENTO_INICIAL)); k++) peds.push(crearPeaton(city, city.real ? { cerca: jugadorXZ() } : {}));   // mapa real: cerca del jugador
  burbujas = [];
  tiempo = 0; cdOfr = 0; finPend = 0;
  tRonda = 0; cdReciclo = PEAT_RECICLO_T; jornadaId = MOMENTO_INICIAL;
  luz = luzDe(jornadaPorId(MOMENTO_INICIAL));
  partida = crearPartida();
  rd = rondaNueva();
  seguir(cam, pl.px, pl.py, 0, true);
  pintarJornada();
  actualizarHud();
}

// Coima al capturar (agentes.js llama con el agente). Paga con la ronda en curso (coima.js) y devuelve true si el agente aceptó.
// Si no hay nada que pagar o el agente rechaza, devuelve false y la captura termina la partida como antes.
function cobrarCoima() {
  const r = ofrecerCoima(econ, rd, Math.random, undefined, partida.coimas);
  if (!r.oferta) return false;
  if (!r.aceptada) { toast('No aceptaron la coima', 'mal'); return false; }
  econ = r.econ; rd = r.rd;
  partida = registrarCoima(partida);
  audio.sfx('venta');
  const txt = r.oferta.modo === 'producto'
    ? '-' + r.oferta.unidades + ' u.' : '-' + pesos(r.oferta.monto);
  bubble(pl.px, pl.py, txt, 'mala');
  toast(r.oferta.modo === 'producto'
    ? 'Le diste ' + r.oferta.unidades + ' unidades: por ' + COIMA_CIEGO + ' s no te ven'
    : 'Le pagaste ' + pesos(r.oferta.monto) + ' y por ' + COIMA_CIEGO + ' s no te ven', 'mal');
  pintarStock();
  actualizarHud();
  return true;
}

// Posición del jugador en el formato de los peatones (x, z).
const jugadorXZ = () => ({ x: pl.px, z: pl.py });

// Muestra el momento del día en el HUD (solo cuando cambia).
function pintarJornada() {
  hud.jornada.textContent = jornadaPorId(jornadaId).nombre;
}

// Cambia de momento del día: ajusta la cantidad de peatones (jornada.peat) y avisa.
function cambiarMomento(j) {
  jornadaId = j.id;
  ajustarPeatones(peds, city, cantidadPeatones(j), jugadorXZ());
  pintarJornada();
  toast('Jornada: ' + j.nombre);
  audio.sfx('cuenta');
}

// Ofrecer: el peatón elegible más cercano dentro del cono del jugador reacciona según su memoria (peatones.js).
// Vende el producto activo (el primero con stock); el alcance sale de la mejora Alcance.
// La compra usa la DEMANDA del producto y el momento del día; sin mercadería en mano, la reacción es 'ignorar'.
function ofrecer() {
  if (cdOfr > 0 || estado !== 'jugando' || sim.G.capT > 0) return;
  cdOfr = OFR_CD;
  const p = productoActivo(rd);
  if (!p) { if (finPend <= 0) toast('Sin mercadería', 'mal'); return; }
  const best = buscarObjetivoOfrecer(peds, city, pl, radioOfrecer(econ), OFR_MED_ANG);   // peatones.js: cono, alcance y línea de visión
  if (!best) return;
  const id = reaccionPara(best, { producto: p, dem: jornadaPorId(jornadaId).dem, tiempo });
  best.pausa = OFR_PAUSA;
  let unidades = 0, ingreso = 0;
  if (id === 'comprar1' || id === 'comprar2') {
    const v = vender(econ, rd, p, REACCIONES.find(r => r.id === id).n);
    econ = v.econ; rd = v.rd;
    unidades = v.vendidas; ingreso = v.ingreso;
  }
  aplicarReaccion(best, id, tiempo, unidades);   // memoria del peatón: M, C, I, P o A según lo que pasó
  switch (id) {
    case 'comprar1':
    case 'comprar2': {
      partida = registrarVenta(partida, p, unidades, ingreso);
      audio.sfx('venta');
      pista('venta', 'Cada venta suma puntos y dinero. Lo que gastás en mercadería se recupera al cerrar la ronda.');
      bubble(best.x, best.z, pick(TEXTOS.compra), 'venta');
      bubble(pl.px, pl.py, '+' + pesos(ingreso), 'venta', 1.4);
      ventaVista(sim, pl);
      if (stockTotal(rd) === 0) { finPend = 2.5; toast('Mercadería agotada', 'bien'); }
      break;
    }
    case 'insultar':
      bubble(best.x, best.z, pick(TEXTOS.insultar), 'mala');
      audio.sfx('rechazo');
      contagiarInsulto(peds, best, tiempo);   // los vecinos cercanos se contagian (peatones.js)
      ventaVista(sim, pl);
      break;
    case 'cortes':
      bubble(best.x, best.z, pick(TEXTOS.cortes), '');
      audio.sfx('cortes');
      break;
    case 'llamado':
      bubble(best.x, best.z, pick(TEXTOS.llamado), 'mala');
      alertarAgentes(sim, best.x, best.z);
      audio.sfx('alerta');
      break;
    default:
      audio.sfx('ignorar');                                      // ignorar: no pasa nada (solo un sonido corto)
      break;
  }
  actualizarHud();
}

// Movimiento del jugador. Energía (energia.js): se gasta corriendo (consumo según Resistencia, más un costo por arranque) y se
// recupera quieto o caminando tras una demora. Agotado (energía en 0) no se puede correr hasta llegar a UMBRAL_REINICIO.
function moverJugador(dt, inp) {
  const capturado = sim.G.capT > 0;
  pl.prevPx = pl.px; pl.prevPy = pl.py;
  let dx = capturado ? 0 : inp.dx, dy = capturado ? 0 : inp.dy;
  const m = Math.hypot(dx, dy);
  stepEnergia(pl, dt, { quiere: !capturado && inp.corre, mueve: m > 0.01, consumo: consumoCorrer(econ) });
  if (m > 0.01) pl.heading = wrapAng(pl.heading + angDiff(Math.atan2(dx, dy), pl.heading) * (1 - Math.exp(-dt * 14)));
  const v = (pl.corre ? velocidadCorrer(econ) : SPEED) * Math.min(1, m);
  pl.spd = v;
  if (v <= 0) return;
  const nx = pl.px + dx * v * dt, ny = pl.py + dy * v * dt;
  if (!obstaculoEn(city, nx, pl.py)) pl.px = nx;
  if (!obstaculoEn(city, pl.px, ny)) pl.py = ny;
}

function procesarEventos() {
  for (const e of sim.eventos) {
    if (e.t === 'coima') continue;   // la coima ya se muestra en cobrarCoima()
    if (e.t === 'zafe') {
      const pts = puntosEscape(e.nivel);
      partida = registrarEscape(partida, e.nivel);
      bubble(pl.px, pl.py, '😮‍💨 ¡Zafaste! +' + pts, 'venta');
      toast('¡ZAFASTE de ' + e.nivel + '★! +' + pts, 'bien');
      audio.sfx('escape');
    } else if (e.t === 'estrella') {
      partida = marcarPerseguido(partida);
      toast('★'.repeat(e.nivel) + (e.motivo === 'corrida' ? ' Te vieron correr' : ' Te vieron vendiendo'), 'mal');
      audio.sfx('alerta');
      pista('estrellas', 'Más estrellas, más te buscan. Perdelos de vista y alejate para volver a cero. Correr frente a un agente suma otra.');
    } else if (e.t === 'persecucion') {
      partida = marcarPerseguido(partida);
    } else if (e.t === 'patrulla') {
      toast('Entra una patrulla: metete por la vereda', 'mal');
      audio.sfx('patrulla');
    } else if (e.t === 'heli') {
      toast('¡Helicóptero! Salí corriendo de su círculo', 'mal');
      audio.sfx('heli');
    } else if (e.t === 'heli_fin') {
      toast('El helicóptero se retira', 'bien');
    } else if (e.t === 'atrapado') {
      toast('¡Te quitaron la mercadería!', 'mal');
      audio.sfx('captura');
    } else if (e.t === 'capturado') {
      finPartida('capturado');
      return;
    }
  }
  sim.eventos.length = 0;
}

// Ronda vendida (stock en 0): suma el bonus de sigilo (sin persecución) y el de tiempo (puntaje.js), liquida la ronda y vuelve a Mercadería.
// Si la caja no alcanza para nada, termina la partida ('sin_fondos').
function cerrarRondaJuego() {
  const antes = puntosTotal(partida);
  partida = cerrarRondaPuntos(partida, { tRonda, unidadesRonda: unidadesCompradas(rd), ronda: econ.ronda });
  const sumado = puntosTotal(partida) - antes;
  if (sumado > 0) { bubble(pl.px, pl.py, 'Bonus +' + sumado, 'venta', 1.6); audio.sfx('medalla'); }
  const r = cerrarRonda(econ, rd);
  econ = r.econ; rd = r.rd;
  guardarEconomia(econ);
  cancelarCamino(camino);
  resetAgentes(sim, undefined, econ.ronda);   // fin de ronda: sin estrellas ni vehículos
  activarAgentes(sim, pl);
  if (r.estado === 'sin_fondos') { finPartida('sin_fondos'); return; }
  const g = r.ganancia;
  toast('Ronda cerrada: ganancia ' + (g < 0 ? '-' : '') + pesos(Math.abs(g)), g >= 0 ? 'bien' : 'mal');
  audio.sfx('victoria');
  estado = 'venta';
  pausaJuego = false;
  audioMenu();
  actualizarHud();
  irA('mercaderia', () => { pintarMercaderia(); }, 'venta');
}

// Termina la partida. 'capturado' y 'sin_fondos' son game over: la mercadería de la ronda se pierde y la economía vuelve al inicio.
// Calcula el desglose, la medalla y el récord (puntaje.js) y muestra la pantalla de fin (M12).
function finPartida(motivo) {
  if (estado === 'fin') return;
  cancelarCamino(camino);
  ocultarTodas();   // también cierra Mercadería o Mejoras si la partida termina desde ahí
  if (motivo === 'capturado' || motivo === 'sin_fondos') econ = reiniciarEconomia();
  const pa = partida, producto = pa.producto, total = puntosTotal(pa);
  rd = rondaNueva();
  estado = 'fin';
  pausaJuego = false;
  audio.sfx('rechazo');
  audioMenu();
  const rec = actualizarRecord(total, producto);
  const m = medalla(total);
  const [titulo, detalle] = MOTIVOS_FIN[motivo] ?? ['Fin de la partida', ''];
  $('finTitulo').textContent = titulo;
  $('finMotivo').textContent = detalle;
  const dl = $('finDesglose');
  dl.replaceChildren();
  for (const f of desgloseFin(pa).slice(0, -1)) {
    const dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = f.nombre;
    dd.textContent = (f.detalle ? f.detalle + ' · ' : '') + fmtPuntos(f.puntos);
    dl.append(dt, dd);
  }
  $('finPuntaje').textContent = fmtPuntos(total);
  const med = $('finMedalla');
  med.hidden = !m;
  med.className = m ? 'fin-medalla ' + m.id : 'fin-medalla';
  med.textContent = m ? m.ico + ' Medalla ' + m.txt.toLowerCase() : '';
  const r = $('finRecord');
  r.textContent = rec.nuevoGlobal ? '¡NUEVO RÉCORD! ' + fmtPuntos(total) : 'Récord: ' + fmtPuntos(rec.global);
  r.classList.toggle('nuevo', rec.nuevoGlobal);
  $('finRecordProd').textContent = producto ? 'Mejor con ' + NOMBRE_PRODUCTO[producto] + ': ' + fmtPuntos(rec.producto) : '';
  ultimoFin = { motivo, puntos: total, medalla: m, producto };
  $('btnFinShare').hidden = total <= 0;
  $('shareRedes').hidden = true;
  pasoNav(null);
  mostrar('fin');
  $('hudAlerta').hidden = true;
  resetAgentes(sim);   // limpia estrellas, patrullas y helicóptero
  activarAgentes(sim, pl);
}

const fmtPuntos = n => Math.round(n).toLocaleString('es-AR');

// Copia el texto con la API del portapapeles; si no está o falla, usa un campo temporal y execCommand.
async function copiarTexto(texto) {
  try { await navigator.clipboard.writeText(texto); return true; } catch (e) { /* sigue con el respaldo */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = texto; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (e) { return false; }
}

// Enlace que se comparte: la página actual, sin datos del usuario.
const urlJuego = () => location.origin + location.pathname;

$('btnFinShare').addEventListener('click', () => {
  if (!ultimoFin) return;
  const texto = textoCompartir(ultimoFin), L = enlacesCompartir(texto, urlJuego()), box = $('shareRedes');
  for (const a of box.querySelectorAll('a[data-red]')) a.href = L[a.dataset.red];
  box.hidden = !box.hidden;
});
$('shareRedes').querySelector('[data-red=copiar]').addEventListener('click', async e => {
  const ok = await copiarTexto(textoCompartir(ultimoFin ?? {}) + ' ' + urlJuego());
  e.currentTarget.textContent = ok ? '¡Copiado!' : 'No se pudo copiar';
  setTimeout(() => { e.currentTarget.textContent = 'Copiar'; }, 1800);
});
$('btnFinJugar').addEventListener('click', jugar);
$('btnFinMenu').addEventListener('click', irAlTitulo);

// Icono, "x<n>" y barra segmentada del producto activo. La barra tiene un segmento por unidad comprada en el lote.
function pintarStock() {
  const p = productoActivo(rd);
  const { comprado, queda } = p ? loteDe(rd, p) : { comprado: 0, queda: 0 };
  if (hud.icono.dataset.producto !== (p ?? '')) pintarIcono(p);
  hud.icono.title = p ? NOMBRE_PRODUCTO[p] + ' (tecla F o clic para cambiar)' : 'Sin mercadería';
  hud.stockN.textContent = 'x' + queda;
  const n = Math.min(comprado, SEG_MAX), key = p + ':' + n;
  if (key !== barraKey) {
    barraKey = key;
    hud.stockBarra.replaceChildren(...Array.from({ length: n }, () => document.createElement('i')));
  }
  const fill = n ? Math.round(queda / comprado * n) : 0;
  [...hud.stockBarra.children].forEach((seg, i) => seg.classList.toggle('on', i < fill));
}

// Icono del producto en el HUD: la ilustración SVG (copiada en 2d/assets/ilustraciones); si no carga, el emoji de siempre.
function pintarIcono(p) {
  hud.icono.dataset.producto = p ?? '';
  if (!p) { hud.icono.replaceChildren(); return; }
  const img = document.createElement('img');
  img.src = 'assets/ilustraciones/' + p + '.svg'; img.alt = ''; img.width = 22; img.height = 22; img.decoding = 'async';
  img.addEventListener('error', () => { if (hud.icono.dataset.producto === p) hud.icono.textContent = ICONO_PRODUCTO[p]; }, { once: true });
  hud.icono.replaceChildren(img);
}

// Cambia el producto activo (tecla F o clic en el icono). Solo mientras se vende en la calle.
function cambiarProductoUI() {
  if (estado !== 'jugando' || pausaJuego || pausado) return;
  rd = cambiarProducto(rd);
  actualizarHud();
}
hud.icono.addEventListener('click', cambiarProductoUI);
window.addEventListener('keydown', e => { if (e.code === 'KeyF' && !e.repeat) cambiarProductoUI(); });

// Nivel de alerta de los agentes (como la 3D): rojo si alguno persigue, amarillo si alguno está en alerta visual, si no verde.
const TXT_ALERTA = { verde: 'Tranquilo', amarillo: '¡Te vieron!', rojo: '¡Persecución!' };
let alertaNivel = '';
function nivelAgentes() {
  if (!sim || estado !== 'jugando') return 'verde';
  if (sim.patrullas.length || sim.heli) return 'rojo';
  let niv = 'verde';
  for (const a of sim.agentes) {
    if (a.estado === 'persecucion') return 'rojo';
    if (a.estado === 'alerta' && !a.aviso) niv = 'amarillo';
  }
  return niv;
}
// Luces verde, amarilla y roja del HUD (solo se reescriben al cambiar de nivel).
function pintarAlerta() {
  const niv = nivelAgentes();
  hud.alerta.hidden = estado !== 'jugando';
  pintarEstrellas();
  audio.alerta(niv);   // sirena y música de alerta (audio.js); no hace nada si el nivel no cambió
  if (niv === alertaNivel) return;
  alertaNivel = niv;
  hud.alerta.className = 'hud-alerta ' + niv;
  hud.alertaTxt.textContent = TXT_ALERTA[niv];
  if (niv !== 'verde') pista('agente', 'Un agente te vio: la luz pasa a amarillo (alerta) o rojo (persecución). Corré y escondete: sin verte, van donde te vieron.');
}

// Cinco estrellas de búsqueda junto a las luces; parpadean al subir. Solo se reescriben al cambiar.
let estrellasKey = '';
function pintarEstrellas() {
  const h = sim ? hudEstrellas(sim.busq, sim.t) : { encendidas: 0, total: 5, parpadea: false };
  const key = h.encendidas + ':' + h.parpadea;
  if (key === estrellasKey) return;
  estrellasKey = key;
  [...hud.estrellas.children].forEach((el, i) => el.classList.toggle('on', i < h.encendidas));
  hud.estrellas.classList.toggle('sube', h.parpadea);
  hud.estrellas.setAttribute('aria-label', 'Búsqueda: ' + h.encendidas + ' de ' + h.total + ' estrellas');
}

function actualizarHud() {
  hud.ronda.textContent = String(econ.ronda);
  pintarStock();
  hud.dinero.textContent = pesos(rd.dinero);
  hud.energia.textContent = pl ? (pl.agotado ? 'sin correr' : Math.round(pl.energia) + '%') : '-';
  if (hud.energiaBar) {                       // barra de energía con degradé (solo presentación)
    const e = pl ? Math.round(pl.energia) : 0;
    if (hud.energiaBar.dataset.v !== String(e) + pl?.agotado) {
      hud.energiaBar.dataset.v = String(e) + pl?.agotado;
      hud.energiaBar.style.setProperty('--e', e + '%');
      hud.energiaBar.classList.toggle('agotado', !!pl?.agotado);
    }
  }
  hud.puntos.textContent = partida ? fmtPuntos(puntosTotal(partida)) : '';
  pintarAlerta();
}

function actualizar(dt, inp) {
  tiempo += dt;
  tRonda += dt;
  if (cdOfr > 0) cdOfr -= dt;
  if (inp.ofrecer) ofrecer();
  if (sim.G.capT > 0) cancelarCamino(camino);
  // Clic para caminar (G22): si hay camino y no hay entrada manual, la dirección sale del camino (caminar.js).
  const paso = pasoCamino(camino, { x: pl.px, y: pl.py }, inp, dt);
  moverJugador(dt, camino.activo ? { ...inp, dx: paso.dx, dy: paso.dy, corre: false } : inp);
  objetivoOfr = buscarObjetivoOfrecer(peds, city, pl, radioOfrecer(econ), OFR_MED_ANG);   // flecha amarilla (G23)
  if (objetivoOfr) pista('ofrecer', 'Acercate a alguien (aparece una flecha amarilla) y apretá E u OFRECER.');
  stepPeatones(peds, city, dt);
  // Jornada: cambia el momento según el tiempo de la ronda; el reciclado de peatones lejanos se revisa cada PEAT_RECICLO_T s.
  const momento = momentoEn(tRonda);
  if (momento.id !== jornadaId) cambiarMomento(momento);
  if ((cdReciclo -= dt) <= 0) {
    cdReciclo = PEAT_RECICLO_T;
    ajustarPeatones(peds, city, cantidadPeatones(jornadaPorId(jornadaId)), jugadorXZ());
  }
  stepAgentes(sim, pl, dt);
  sonarVehiculos(dt);
  if (!pl.corre && sim.agentes.some(a => a.ve && a.atento && (a.estado === 'patrulla' || a.estado === 'regreso' || a.estado === 'alerta'))) {
    pista('corre', 'Empezar a correr frente a un agente suma una estrella. Arrancá cuando no te esté mirando.');
  }
  procesarEventos();
  if (estado !== 'jugando') return;
  if (finPend > 0) {
    finPend -= dt;
    if (finPend <= 0 && stockTotal(rd) === 0) { cerrarRondaJuego(); return; }
  }
  burbujas = burbujas.filter(b => tiempo - b.t0 < b.dur);
  actualizarHud();
}

// Sonido repetido de los vehículos mientras están en escena: aspas del helicóptero y bocina de las patrullas cercanas.
let tHeli = 0, tBocina = 0;
function sonarVehiculos(dt) {
  if (sim.heli && (tHeli -= dt) <= 0) { tHeli = 0.5; audio.sfx('heli'); }
  if ((tBocina -= dt) <= 0 && sim.patrullas.some(v => Math.hypot(v.x - pl.px, v.z - pl.py) < 15)) { tBocina = 4; audio.sfx('patrulla'); }
}

// Pantalla Mercadería (venta.js) con la economía actual; la selección se reinicia en cada entrada.
function irAMercaderia() {
  estado = 'venta';
  pausaJuego = false;
  audioMenu();
  $('hudAlerta').hidden = true;
  pintarMercaderia();
}

// Jugar (título, Reiniciar, Jugar de nuevo): partida nueva con economía inicial y pantalla Mercadería.
function jugar() {
  irA('mercaderia', () => {
    econ = reiniciarEconomia();
    zonaElegida = false;
    nuevaPartida();
    irAMercaderia();
    soltarControles();
  }, 'venta');
}

// Reponer y salir a la calle: la ronda arranca con el stock comprado, en el mismo lugar del personaje.
function reponerYSalir(sel) {
  if (sinFondos(econ)) { finPartida('sin_fondos'); return; }
  const r = reponer(econ, sel);
  if (!r) return;
  econ = r.econ; rd = r.rd;
  guardarEconomia(econ);
  limpiarSel();
  // Primera salida de la partida: pantalla de zona (M8) antes de la calle. Después, sale directo.
  if (!zonaElegida) return irA('seleccion', abrirSeleccion, 'mapa');
  irA(null, () => empezarRonda(), 'mapa');
}

// Selección de zona (M8, F7): minimapa de la ciudad y un botón por barrio. Sin elección en SEL_ESPERA_S s, empieza en el centro.
function abrirSeleccion() {
  zonaSel = -1;
  $('selBotones').replaceChildren(...ZONAS_NOMBRE.map((n, z) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = n; b.dataset.zona = z; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => elegirZona(z));
    return b;
  }));
  pintarSeleccion();
  let s = SEL_ESPERA_S;
  const pintar = () => { $('selEstado').textContent = 'Si no elegís, empezás en ' + ZONAS_NOMBRE[ZONA_INI] + ' en ' + s + ' s.'; };
  pintar();
  clearInterval(selTimer);
  selTimer = setInterval(() => { s--; if (s <= 0) elegirZona(ZONA_INI); else pintar(); }, 1000);
}
function pintarSeleccion() {
  dibujarMapaSeleccion(cvSel, city, zonaSel);
  for (const b of $('selBotones').children) b.setAttribute('aria-pressed', String(+b.dataset.zona === zonaSel));
  $('selEstado').textContent = zonaSel >= 0 ? 'Elegiste ' + ZONAS_NOMBRE[zonaSel] + '. Empezás ahí.' : $('selEstado').textContent;
}
cvSel.addEventListener('click', e => {
  const r = cvSel.getBoundingClientRect();
  const i = Math.min(N - 1, Math.floor((e.clientX - r.left) / r.width * N));
  const j = Math.min(N - 1, Math.floor((e.clientY - r.top) / r.height * N));
  elegirZona(zonaEn(city, i, j));
});
// Posiciona al jugador en la celda caminable más cercana al centro del barrio y arranca la ronda.
function elegirZona(z) {
  if (!estaVisible('seleccion') || zonaElegida) return;
  clearInterval(selTimer);
  zonaSel = z;
  pintarSeleccion();
  const cen = centroZona(z);
  const c = celdaCaminableMasCerca(city, cen.i, cen.j, 60);
  if (c) {
    pl.px = c.i + .5; pl.py = c.j + .5; pl.prevPx = pl.px; pl.prevPy = pl.py;
    pl.path = []; pl.target = null;
  }
  snap = true;                              // la cámara salta al barrio elegido
  zonaElegida = true;
  irA(null, () => empezarRonda(), 'mapa');
}

// Barrio actual en el HUD: solo se reescribe cuando cambia.
function pintarZona() {
  const z = zonaEn(city, Math.floor(pl.px), Math.floor(pl.py));
  if (z === zonaHud) return;
  zonaHud = z;
  hud.zona.textContent = ZONAS_NOMBRE[z];
}

function empezarRonda() {
  estado = 'jugando';
  pausaJuego = false;
  audio.escena('partida');
  resetAgentes(sim, undefined, econ.ronda);
  activarAgentes(sim, pl);
  burbujas = [];
  cdOfr = 0; finPend = 0; tHeli = 0; tBocina = 0;
  // Ronda nueva: la memoria de los peatones se reinicia y la jornada vuelve al momento inicial.
  tRonda = 0; cdReciclo = PEAT_RECICLO_T; jornadaId = MOMENTO_INICIAL;
  reiniciarMemoria(peds);
  ajustarPeatones(peds, city, cantidadPeatones(jornadaPorId(jornadaId)), jugadorXZ());
  pintarJornada();
  pl.energia = ENERGIA_MAX; pl.agotado = false; pl.corre = false; pl.sinCorrer = undefined;
  $('hudAlerta').hidden = true;
  soltarControles();
  actualizarHud();
}

function comprarMejoraUI(k) {
  const n = comprarMejora(econ, k);
  if (!n) return;
  econ = n;
  guardarEconomia(econ);
  toast(MEJORAS_TEXTO[k].nombre + ' mejorado al nivel ' + nivel(econ, k), 'bien');
  pintarMejoras();
}

// Suelta las lecturas de entrada y cancela el camino (al pausar, cambiar de pantalla o empezar una partida).
function soltarControles() {
  controles.resetLecturas();
  cancelarCamino(camino);
}

// Clic o toque en el mapa (G22): camina hasta la celda clicada. Un toque sobre el HUD (paneles, botones, joystick) no cuenta.
function sobreHud(x, y) {
  for (const el of [...document.querySelectorAll('#hud > *'), cvMini]) {
    const r = el.getBoundingClientRect();
    if (r.width && r.height && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
  }
  return false;
}
function alTocarMapa({ x, y }) {
  if (estado !== 'jugando' || pausaJuego || pausado || sim.G.capT > 0 || sobreHud(x, y)) return;
  const r = canvas.getBoundingClientRect();
  const [mx, mz] = aMundo(cam, (x - r.left) * cam.w / r.width, (y - r.top) * cam.h / r.height);   // con el giro de la vista (F7)
  const plan = planearCamino(city, { x: pl.px, y: pl.py }, { x: mx, y: mz });
  if (!plan) { toast('No hay camino hasta ahí', 'mal'); return; }
  iniciarCamino(camino, plan);
}

// Controles y pantallas.
const controles = crearControles({ canvas, cam, onToque: alTocarMapa,
  onCambiar: cambiarProductoUI, onPausa: () => setPausa(!pausaJuego),   // botones táctiles ⇄ y II
  onInicio: () => {
  // Espacio o Enter en el título inician la partida; si el foco está en un botón, lo atiende el botón.
  if (estado === 'titulo' && estaVisible('titulo') && document.activeElement?.tagName !== 'BUTTON') jugar();
} });

// Pausa del menú: el juego no avanza mientras está abierta. Solo aplica durante una partida.
function setPausa(p) {
  if (estado !== 'jugando') return;
  pausaJuego = p;
  if (p) mostrar('pausa'); else ocultar('pausa');
  soltarControles();
  pausaAudio();
}
// Audio en pausa (filtro y sin sirena) mientras la pausa del menú o la del giro del celular estén activas.
function pausaAudio() { audio.pausa(pausaJuego || pausado); }
// Música de menú (escena 'menu') y luz verde, como la 3D al volver a un menú.
function audioMenu() { audio.alerta('verde'); audio.escena('menu'); }
function volverDePersonaje() {
  if (estado === 'jugando') irA('pausa', () => { pausaJuego = true; soltarControles(); }, 'mapa');
  else if (estado === 'venta') irA('mercaderia', () => pintarMercaderia(), 'venta');
  else irA('titulo', null, null);
}
function abrirOpciones() { pintarOpciones(); mostrar('opciones'); }

// Pantalla Personaje (D1): vista previa pixelart a escala entera y controles por categoría. Se edita un borrador;
// Guardar lo pasa a personajeGuardado (y a localStorage "2d_personaje"); Volver lo descarta.
const ETIQUETAS_PERSONAJE = {
  piel: 'Color de piel', peloColor: 'Color de pelo', peloEstilo: 'Estilo de pelo',
  ropa: 'Color de ropa', accesorio: 'Accesorio', calzado: 'Color de calzado',
};
const TEXTO_OPCION = {
  corto: 'Corto', largo: 'Largo', rapado: 'Rapado',
  ninguno: 'Sin accesorio', gorra: 'Gorra', lentes: 'Lentes',
};
const ESCALA_PERSONAJE = 12;   // px de pantalla por píxel del sprite en la vista previa (entero)
function abrirPersonaje() {
  borrador = { ...personajeGuardado };
  pintarPersonaje();
  irA('personaje', null, 'personaje');
}
function pintarPersonaje() {
  const cont = $('persControles');
  if (!cont.childElementCount) {
    for (const cat of Object.keys(OPCIONES_PERSONAJE)) {
      const fila = document.createElement('div');
      fila.className = 'pers-cat';
      const titulo = document.createElement('span');
      titulo.textContent = ETIQUETAS_PERSONAJE[cat];
      const grupo = document.createElement('div');
      grupo.className = 'pers-fila';
      grupo.setAttribute('role', 'group');
      grupo.setAttribute('aria-label', ETIQUETAS_PERSONAJE[cat]);
      OPCIONES_PERSONAJE[cat].forEach((valor, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.cat = cat;
        b.dataset.valor = valor;
        if (valor.startsWith('#')) {
          b.className = 'pers-sw';
          b.style.setProperty('--sw', valor);
          b.setAttribute('aria-label', `${ETIQUETAS_PERSONAJE[cat]} ${i + 1}`);
        } else {
          b.className = 'pers-op';
          b.textContent = TEXTO_OPCION[valor];
        }
        b.addEventListener('click', () => { borrador[cat] = valor; $('persEstado').textContent = ''; pintarPersonaje(); });
        grupo.appendChild(b);
      });
      fila.append(titulo, grupo);
      cont.appendChild(fila);
    }
  }
  for (const b of cont.querySelectorAll('button[data-cat]')) {
    b.setAttribute('aria-pressed', String(borrador[b.dataset.cat] === b.dataset.valor));
  }
  const lienzo = $('persLienzo'), g = lienzo.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, lienzo.width, lienzo.height);
  g.imageSmoothingEnabled = false;
  const sprite = spriteJugador(borrador, 0, 'quieto');   // vista previa de frente, quieta
  dibujarSprite(g, sprite, 0, 0, ESCALA_PERSONAJE);
}
$('btnPersAlAzar').addEventListener('click', () => {
  borrador = personajeAlAzar();
  $('persEstado').textContent = 'Personaje al azar. Guardalo si te gusta.';
  pintarPersonaje();
});
$('btnPersGuardar').addEventListener('click', () => {
  const ok = guardarPersonaje(borrador);
  personajeGuardado = { ...borrador };
  $('persEstado').textContent = ok ? 'Personaje guardado.' : 'No se pudo guardar en este navegador: queda solo para esta sesión.';
});


// Esc y P: cierran opciones o ayuda (Esc), vuelven del personaje (Esc), o abren y cierran la pausa.
window.addEventListener('keydown', e => {
  if (e.repeat || (e.code !== 'Escape' && e.code !== 'KeyP')) return;
  const esc = e.code === 'Escape';
  if (estaVisible('opciones') || estaVisible('ayuda')) {
    if (esc) { ocultar('opciones'); ocultar('ayuda'); }
    return;
  }
  if (estaVisible('personaje')) { if (esc) volverDePersonaje(); return; }
  if (estado === 'jugando') setPausa(!pausaJuego);
});

// Opciones (guardadas en localStorage con la clave 2d_ajustes; ver ajustes.js).
function pintarOpciones() {
  $('optVolumen').value = String(ajustes.volumen);
  pintarSilencio();
  $('optDistancia').value = ajustes.distancia;
  $('optZoom').value = ajustes.zoom;
  $('optFps').value = String(ajustes.fps);
  $('optPatrulla').value = ajustes.patrulla;
  $('optControles').value = ajustes.controles;
}
// Controles en pantalla (táctil): joystick (por defecto) o pad de flechas. Clase en body; el CSS decide qué se muestra.
function pintarControles() { document.body.classList.toggle('ctl-flechas', ajustes.controles === 'flechas'); }
function guardarAjuste(clave, valor) { ajustes[clave] = valor; guardarAjustes(ajustes); }
$('optControles').addEventListener('change', e => { guardarAjuste('controles', e.target.value); pintarControles(); });
$('optVolumen').addEventListener('input', e => { guardarAjuste('volumen', Number(e.target.value)); audio.setVolumen(ajustes.volumen); audio.sfx('clic'); });
// Silenciar (Opciones): alterna y guarda en 2d_ajustes. El texto y aria-pressed siguen al estado.
function pintarSilencio() {
  const b = $('btnSilenciar');
  b.textContent = ajustes.silencio ? 'Activar sonido' : 'Silenciar';
  b.setAttribute('aria-pressed', String(ajustes.silencio));
}
$('btnSilenciar').addEventListener('click', () => { guardarAjuste('silencio', !ajustes.silencio); audio.silenciar(ajustes.silencio); pintarSilencio(); });
$('optDistancia').addEventListener('change', e => guardarAjuste('distancia', e.target.value));
$('optZoom').addEventListener('change', e => guardarAjuste('zoom', e.target.value));
$('optFps').addEventListener('change', e => guardarAjuste('fps', Number(e.target.value)));
$('optPatrulla').addEventListener('change', e => guardarAjuste('patrulla', e.target.value));   // se aplica en la próxima partida

// Celular en vertical: la partida queda en pausa hasta volver a apaisado (sólo si la pausó el giro).
let pausado = false, pausaGiro = false;
window.addEventListener('movil:vertical', e => {
  if (e.detail.vertical) {
    if (estado === 'jugando' && !pausado) { pausado = true; pausaGiro = true; soltarControles(); }
  } else if (pausaGiro) { pausaGiro = false; pausado = false; }
  pausaAudio();
});

// Mercadería y Mejoras (venta.js).
montarVenta({
  getEcon: () => econ,
  reponer: reponerYSalir,
  personaje: abrirPersonaje,
  irMejoras: () => { ocultar('mercaderia'); mostrar('mejoras'); pintarMejoras(); },
  volverMercaderia: () => { ocultar('mejoras'); mostrar('mercaderia'); pintarMercaderia(); },
  comprarMejora: comprarMejoraUI,
});

// Menú principal, pausa y pantallas de apoyo (todas con fundido por irA, salvo las que se abren sobre otra).
$('btnJugar').addEventListener('click', jugar);
$('btnTituloPersonaje').addEventListener('click', abrirPersonaje);
$('btnPersonajeVolver').addEventListener('click', volverDePersonaje);
$('btnTituloAyuda').addEventListener('click', () => mostrar('ayuda'));
$('btnTituloOpc').addEventListener('click', abrirOpciones);
$('btnAyudaCerrar').addEventListener('click', () => ocultar('ayuda'));
$('btnOptCerrar').addEventListener('click', () => ocultar('opciones'));
$('btnPausaSeguir').addEventListener('click', () => setPausa(false));
$('btnPausaReiniciar').addEventListener('click', jugar);
$('btnPausaOpc').addEventListener('click', abrirOpciones);
$('btnPausaAyuda').addEventListener('click', () => mostrar('ayuda'));
$('btnPausaPers').addEventListener('click', abrirPersonaje);
// Menú: vuelve a la pantalla de título (desde la pausa o desde la pantalla de fin).
function irAlTitulo() {
  irA('titulo', () => {
    estado = 'titulo'; pausaJuego = false; $('hudAlerta').hidden = true; soltarControles();
    resetAgentes(sim); activarAgentes(sim, pl);
    audioMenu();
  }, null);
}
$('btnPausaMenu').addEventListener('click', irAlTitulo);
$('btnZoomMas').addEventListener('click', () => zoomPor(cam, 1.25));
$('btnZoomMenos').addEventListener('click', () => zoomPor(cam, 1 / 1.25));

// El canvas ocupa el viewport visible (en celular, la barra del navegador cambia el alto al scrollear o girar).
// El canvas usa la densidad de la pantalla (devicePixelRatio, con tope 2 en viewport.js) para verse nítido; la cámara trabaja en px CSS.
let dpr = 1;
function ajustarCanvas() {
  const vv = window.visualViewport;
  const w = Math.round(vv ? vv.width : window.innerWidth), h = Math.round(vv ? vv.height : window.innerHeight);
  dpr = Math.max(1, dprLimitado(window.devicePixelRatio || 1, prefsMovil().calidad));   // viewport.js: tope 2, calidad baja = 1
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  cam.w = w; cam.h = h;
}
// Movimiento reducido (prefers-reduced-motion): el render no hace pulsos ni rebotes.
const mqReducido = window.matchMedia?.('(prefers-reduced-motion: reduce)');
// Pasos: un sonido suave cada PASO_CELDAS celdas recorridas (más seguido al correr). Solo presentación.
const PASO_CELDAS = 0.9, PASO_CELDAS_CORRER = 1.3;
let distPaso = 0;
function sonarPasos() {
  if (estado !== 'jugando' || pausado || pausaJuego || !pl) { distPaso = 0; return; }
  distPaso += Math.hypot(pl.px - pl.prevPx, pl.py - pl.prevPy);
  const tramo = pl.corre ? PASO_CELDAS_CORRER : PASO_CELDAS;
  if (distPaso >= tramo) { distPaso = 0; audio.sfx(pl.corre ? 'pasoCorrer' : 'paso'); }
}
window.addEventListener('resize', ajustarCanvas);
window.visualViewport?.addEventListener('resize', ajustarCanvas);
window.addEventListener('orientationchange', () => setTimeout(ajustarCanvas, 200));
ajustarCanvas();
$('optCalidad').addEventListener('change', ajustarCanvas);   // movil.js guarda la preferencia antes (su listener es anterior)

// Pantalla de título: el mapa se ve de fondo mientras no hay partida.
cam.zoom = ZOOM_OPCIONES[ajustes.zoom];
nuevaPartida();
sim.eventos.length = 0;
// Audio (D6): el contexto se crea en el primer gesto (los navegadores bloquean el audio antes). Volumen y silencio de Opciones.
addEventListener('pointerdown', () => audio.desbloquear(), { once: true });
addEventListener('keydown', () => audio.desbloquear(), { once: true });
audio.setVolumen(ajustes.volumen);
audio.silenciar(ajustes.silencio);
audioMenu();
// Clic en cualquier botón de menú suena "clic" (como la 3D). El pad de flechas y los botones táctiles quedan callados.
addEventListener('click', e => { if (e.target.closest && e.target.closest('button:not(.dp):not(.touch-btn)')) audio.sfx('clic'); });

let last = performance.now(), ultimo = -Infinity;
function frame(now) {
  requestAnimationFrame(frame);
  // Límite de FPS (ajustes.fps): se saltan los cuadros que llegan antes del intervalo (1 ms de tolerancia).
  if (now - ultimo < 1000 / ajustes.fps - 1) return;
  ultimo = now;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const inp = controles.leer();
  if (estado === 'jugando' && !pausado && !pausaJuego) { actualizar(dt, inp); sonarPasos(); }
  seguir(cam, pl.px, pl.py, dt, snap);
  snap = false;
  luz = acercarLuz(luz, luzDe(jornadaPorId(jornadaId)), dt);   // transición suave del cielo y la niebla
  dibujar(ctx, cam, { personaje: personajeGuardado, mapa, sim, pl, peds, burbujas, tiempo, luz, dpr, reducido: !!mqReducido?.matches, ofr: { radio: radioOfrecer(econ), medAng: OFR_MED_ANG }, objetivo: estado === 'jugando' ? objetivoOfr : null, camino: camino.activo ? camino.pasos : null });
  pintarZona();
  dibujarMinimapa(cvMini, city, pl, cam, sim ? sim.agentes : [], sim);
}
pintarControles();
requestAnimationFrame(frame);
