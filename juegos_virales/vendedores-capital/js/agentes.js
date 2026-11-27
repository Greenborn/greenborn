// Máquina de estados de los agentes de control (versión 2D cenital). Sin DOM: se prueba en Node (tools/test_agentes.mjs).
// Lógica portada de la Fase 3 de index.html (funciones de regreso, nueva ruta, intercepción, llamado de peatón, ventaVista,
// corridaVista y el paso de simulación). Los nombres de constantes POLI_* se conservan para comparar con la versión 3D.
// Búsqueda (estrellas, busqueda.js): la única forma de que un agente persiga es que el nivel de búsqueda lo pida. El nivel sube
// por vender (o recibir un insulto) o por empezar a correr a la vista de un agente; el director (completarRespuesta) mantiene
// exactamente respuesta(nivel).agentes perseguidores a pie, y las patrullas y el helicóptero (vehiculos.js) del nivel.
// "Comprometido" = persiguiendo, o en alerta visual (el "!" previo a perseguir).
// Los perseguidores solo conocen la posición del jugador mientras alguno (o el helicóptero) lo ve; si no, van a sim.ultima.
// Agentes en cada esquina: con muchas esquinas solo existen en sim.agentes los cercanos al jugador (activarAgentes).
// Coordenadas: agentes y jugador en celdas. Agente: (x, z). Jugador: (px, py). Yaw 0 mira hacia +z; forward = (sin yaw, cos yaw).
import { celdaPeatonal, lineaLibre, obstaculoEn, walkable, esquinasAgentes, ladoDe } from './ciudad.js';
import { crearPlanificador, lineaCaminable, buscarRuta } from './rutas.js';
import {
  COIMA_CIEGO, RUTA_NODOS_FRAME, RUTA_UMBRAL_OBJ, RUTA_ATASCO_T, RUTA_ATASCO_D, SEP_RADIO, SEP_FUERZA, INTERCEPT_T_MAX,
} from './config.js';
import { puedeOfrecer, bajarCooldown, cooldownInicial } from './coima.js';
import {
  crearBusqueda, sumarEstrella, respuesta, stepBusqueda, asignarPerseguidores, indiceEsquinas, esquinasCerca,
  BUSQ_R_ACTIVA, BUSQ_MAX_ACTIVOS,
} from './busqueda.js';
import { ciudadCalles, calleCerca, crearPatrulla, stepPatrulla, crearHeli, stepHeli, VEH_ADELANTE } from './vehiculos.js';

// Distancias en celdas, tiempos en segundos, velocidades en celdas/s.
export const POLI_RADIO = 8, POLI_FOV = 90 * Math.PI / 180;   // campo de visión: alcance y ángulo total del cono
export const POLI_RADIO_PERS = 10;      // alcance de visión (360°) de quien ya persigue
export const POLI_VIS_DT = 0.1;         // cada cuánto se chequea la visión (incluye la línea de visión)
export const POLI_BARRIDO = 40 * Math.PI / 180, POLI_BARRIDO_VEL = 0.7;   // patrulla: amplitud del giro de cabeza (±40°) y velocidad (rad/s)
export const POLI_T_ALERTA = 1;         // detenido con "!" antes de perseguir
export const POLI_VEL_PERS = 5.5;       // persecución: entre caminar (4.5) y correr (7.5) del jugador
export const POLI_VEL_ALERTA = 4, POLI_VEL_REG = 3.5;   // ir hacia un aviso / volver a la esquina
export const POLI_T_RUTA = 0.5;         // recálculo de la ruta (A*, rutas.js) de cada perseguidor
export const POLI_BFS_FRAME = 3;        // tope de pedidos de ruta de persecución por paso (además de RUTA_NODOS_FRAME)
export const POLI_MAX_PERS = 12;        // perseguidores simultáneos máximos (el resto espera en alerta)
export const POLI_R_PROP = 12;          // sin uso en el juego (la propagación la reemplazan las estrellas); queda para el simulador
export const POLI_R_AVISO = 15;         // radio del llamado de un peatón
export const POLI_ACUDE_LLEGA = 2, POLI_ACUDE_REINTENTOS = 5;   // quien acude: distancia que cuenta como llegar y pedidos de ruta extra
export const POLI_T_AVISO = 15;         // tiempo máximo yendo a un aviso antes de volver
export const POLI_T_PERDER = 5, POLI_DIST_SAFAR = 12;   // sin ser visto T s y a más de X celdas de todos: zafó
export const POLI_CAPTURA = 0.5, POLI_PAUSA_CAPT = 0.9; // distancia de captura y pausa antes de la pantalla final
export const POLI_DIRECTO = 3;          // a menos de esto (y con vista) se lanza directo sobre el jugador
export const POLI_INTERCEPT = [{ adel: 0, lado: 0 }, { adel: 7, lado: 0 }, { adel: 4, lado: 4 }, { adel: 4, lado: -4 }];   // intercepción (celdas delante/lado del jugador) por índice
export const POLI_VEL_PAT = 1.5, POLI_PAT_R = 10, POLI_PAT_PAUSA = 3;   // patrulla por la vereda: paso, radio desde la esquina, pausa máxima
export const POLI_SIM = 40;             // los agentes en patrulla a más de esto del jugador no se simulan
export const POLI_VENTA_VENTANA = 1.5;  // s desde que un agente vio una venta: mientras dure, puede pasar a persecución
export const POLI_FASE = 2;             // patrulla por defecto: 2 = camina por la vereda; 1 = quieto en su esquina (1 solo se usa en las pruebas)

// Dificultad por ronda. Todas las esquinas tienen agente; AG_FRAC_* dice qué fracción está atenta (ve ventas y carreras).
// Los demás están distraídos (sin cono), pero acuden a un llamado y se suman a una persecución.
export const AG_FRAC_INI = 0.6, AG_FRAC_PASO = 0.05;
export const POLI_RADIO_PASO = 0.25, POLI_RADIO_TOPE = 9.5;
export const POLI_VEL_PERS_PASO = 0.05, POLI_VEL_PERS_TOPE = 6.0;
export const fraccionAtentos = r => Math.min(1, AG_FRAC_INI + AG_FRAC_PASO * (r - 1));
export const radioVista = r => Math.min(POLI_RADIO_TOPE, POLI_RADIO + POLI_RADIO_PASO * (r - 1));
export const velPersecucion = r => Math.min(POLI_VEL_PERS_TOPE, POLI_VEL_PERS + POLI_VEL_PERS_PASO * (r - 1));

export const POOL_DT = 0.5, POOL_HISTERESIS = 4;   // cada cuánto se revisa el pool y margen (celdas) antes de soltar un agente
export const RECLUTA_R = 150;           // radio máximo para activar esquinas lejanas si faltan perseguidores
export const BUSCA_R = 8, BUSCA_LLEGA = 2.5;   // al llegar a la última posición vista, revisan puntos en este radio
export const PATRULLA_APARECE = [18, 30];   // distancia (celdas) a la que entra una patrulla
export const HELI_APARECE = 14;         // distancia (celdas) a la que entra el helicóptero
export const PATRULLA_ADEL_EXTRA = 6;   // la segunda patrulla corta más adelante

export const comprometido = p => p.estado === 'persecucion' || (p.estado === 'alerta' && !p.aviso);
const esAtento = (sim, idx) => !sim.escalar || (idx * 0.6180339887) % 1 < fraccionAtentos(sim.ronda);

const TAU = Math.PI * 2;
const wrapAng = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const angDiff = (a, b) => wrapAng(a - b);
const giraAgente = (p, obj, dt, k) => { p.yaw = wrapAng(p.yaw + angDiff(obj, p.yaw) * (1 - Math.exp(-dt * k))); };
// Distancia mínima del punto (cx, cz) al segmento (ax, az)-(bx, bz): evita el "tunneling" de la captura.
export function distSegPunto(cx, cz, ax, az, bx, bz) {
  const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz;
  let t = l2 > 1e-12 ? ((cx - ax) * vx + (cz - az) * vz) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(ax + vx * t - cx, az + vz * t - cz);
}

export const AG_REFUERZO = 0.4;        // policías extra sobre el uno por esquina (40 % más)

// Agrega los refuerzos repartidos de forma pareja: cada uno en una vereda a unas celdas de su esquina. Determinista.
export function conRefuerzos(city, base, frac = AG_REFUERZO) {
  const out = base.slice(), total = Math.round(base.length * frac);
  for (let k = 0; k < total; k++) {
    const e = base[Math.floor(k * base.length / total)];
    let c = null;
    for (const [dx, dz] of [[4, 0], [0, 4], [-4, 0], [0, -4]]) {
      const q = celdaPeatonal(city, e.x + dx, e.z + dz, 2);
      if (q && Math.hypot(q.i + .5 - e.x, q.j + .5 - e.z) >= 2) { c = q; break; }
    }
    out.push(c ? { ...e, x: c.i + .5, z: c.j + .5 } : { ...e });
  }
  return out;
}

export const AG_FIJOS = 0.25;          // policías fijos extra, sobre los que patrullan (25 % más)

// Agrega los policías fijos (fijo: true, nunca patrullan): alternan entre una esquina y un lugar al azar de la vereda.
// El azar usa una semilla fija: el mapa queda igual en cada partida.
export function conFijos(city, lista, esquinas, frac = AG_FIJOS) {
  let s = 987654321;
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const n = ladoDe(city), out = lista.slice(), total = Math.round(lista.length * frac);
  for (let k = 0; k < total; k++) {
    let e = null;
    for (let t = 0; k % 2 && t < 200 && !e; t++) {
      const i = Math.floor(azar() * n), j = Math.floor(azar() * n), c = city.C[j * n + i];
      if (c.t === 'side' && !c.deco) e = { x: i + .5, z: j + .5, yaw: azar() * TAU - Math.PI };
    }
    e ??= esquinas[Math.floor(azar() * esquinas.length)];
    out.push({ ...e, fijo: true });
  }
  return out;
}

// Crea la simulación de los agentes. opts.rand: generador aleatorio (inyectable para pruebas); opts.esquinas: puntos de patrulla;
// opts.patrulla: POLI_FASE (1 esquina, 2 vereda; por defecto 2); opts.ronda: dificultad; opts.escalar: aplicar la fracción de
// atentos (por defecto sí con las esquinas de la ciudad, no con esquinas dadas); opts.pool: activar por cercanía (por defecto si
// hay más de 2 x BUSQ_MAX_ACTIVOS esquinas); opts.coima(p): lo llama main.js al capturar (p: agente o patrulla). Devuelve true
// si se acepta la coima (main.js ya descontó lo pagado); false si se rechaza o no hay nada que pagar.
export function crearSimulacion(city, opts = {}) {
  const esquinas = opts.esquinas ?? conFijos(city, conRefuerzos(city, esquinasAgentes(city)), esquinasAgentes(city));
  const sim = {
    city, rand: opts.rand ?? Math.random,
    patrulla: opts.patrulla ?? POLI_FASE,
    coima: opts.coima ?? null,
    esquinas, pool: opts.pool ?? esquinas.length > 2 * BUSQ_MAX_ACTIVOS, escalar: opts.escalar ?? !opts.esquinas,
    indice: null, tPool: 0,
    ronda: opts.ronda ?? 1,
    agentes: [],           // agentes activos (con pool, solo los cercanos al jugador y los comprometidos)
    busq: crearBusqueda(), // estrellas (busqueda.js)
    t: 0,                  // reloj de la simulación (s), para los cooldowns de estrellas
    ultima: null,          // última posición vista del jugador { x, z, heading }
    visto: false,          // algún perseguidor o el helicóptero lo ve ahora
    patrullas: [], heli: null, heliUsado: false,
    G: { capT: 0, capAg: null, bfs: 0, corria: false, coimaCd: 0, ciegoT: 0 },   // estado global; coimaCd: cooldown de coima; ciegoT: s sin ver al jugador
    perseguido: false,     // alguna vez hubo persecución en esta ronda
    escapes: 0,
    eventos: [],           // cola para main.js: { t: 'alerta'|'estrella'|'persecucion'|'patrulla'|'heli'|'heli_fin'|'zafe'|'atrapado'|'capturado'|'coima' }
    rutas: crearPlanificador(city),   // A* encolado con presupuesto de nodos por frame (rutas.js)
    calles: null, rutasCalle: null,   // red de calles y planificador de las patrullas (se arman al primer uso)
    tok: 0,                // contador de pedidos de ruta (p.pend guarda el vigente de cada agente)
    vel: { x: 0, z: 0 },   // velocidad estimada del jugador (celdas/s), para la intercepción predictiva
  };
  if (sim.pool) { sim.indice = indiceEsquinas(esquinas); prepararCalles(sim); }
  else esquinas.forEach((e, idx) => sim.agentes.push(nuevoAgente(sim, idx, e)));
  return sim;
}

function prepararCalles(sim) {
  if (sim.calles) return;
  sim.calles = ciudadCalles(sim.city);
  sim.rutasCalle = crearPlanificador(sim.calles);
}

// Activación por cercanía: existen los agentes de las esquinas a menos de BUSQ_R_ACTIVA del jugador (tope BUSQ_MAX_ACTIVOS),
// más los que estén haciendo algo cerca. Los lejanos no se crean ni cuestan nada.
export function activarAgentes(sim, pl) {
  if (!sim.pool) return;
  sim.tPool = POOL_DT;
  const cerca = esquinasCerca(sim.indice, pl.px, pl.py, BUSQ_R_ACTIVA, BUSQ_MAX_ACTIVOS), quiero = new Set(cerca), l = sim.agentes;
  const lejos = p => Math.hypot(p.x - pl.px, p.z - pl.py) > BUSQ_R_ACTIVA + POOL_HISTERESIS;
  for (let k = l.length - 1; k >= 0; k--) {
    const p = l[k];
    if (comprometido(p) || p === sim.G.capAg) continue;
    if (p.estado === 'patrulla' ? !quiero.has(p.idx) && (lejos(p) || l.length > BUSQ_MAX_ACTIVOS) : p.estado === 'regreso' && lejos(p)) { p.pend = 0; l.splice(k, 1); }
  }
  const hay = new Set(l.map(p => p.idx));
  for (const i of cerca) {
    if (l.length >= BUSQ_MAX_ACTIVOS) break;
    if (!hay.has(i)) l.push(nuevoAgente(sim, i, sim.esquinas[i]));
  }
}

function nuevoAgente(sim, idx, e) {
  return {
    idx, x: e.x, z: e.z, yaw: e.yaw,
    esquinaBase: { x: e.x, z: e.z, yaw: e.yaw },
    fijo: !!e.fijo,        // policía fijo: no patrulla, queda parado en su lugar
    estado: 'patrulla',    // 'patrulla' | 'alerta' | 'persecucion' | 'regreso'
    aviso: false, acude: false, tAlerta: 0, tAviso: 0, objetivo: null, reintentos: 0,
    ruta: null, k: 0, tRuta: 0, pend: 0, obj: null,   // pend: pedido de ruta en curso (0 = ninguno); obj: destino de la última ruta
    refX: e.x, refZ: e.z, tAtasco: 0, atascado: false, wx: e.x, wz: e.z, wt: 0, trabas: 0,
    tVis: sim.rand() * POLI_VIS_DT, ve: false, ventaT: 0,
    fuerza: 0, phase: 0, fase: sim.rand() * TAU, tPat: 0.5 + sim.rand(),
    atento: esAtento(sim, idx), buscando: false,
  };
}

// ¿El agente ve al jugador? Distancia, ángulo contra su yaw (quien persigue ve a 360°) y línea de visión.
export function agenteVe(city, p, pl, d, dx, dz, radio = POLI_RADIO) {
  const pers = p.estado === 'persecucion';
  if (d > (pers ? POLI_RADIO_PERS : radio)) return false;
  if (!pers && d > 0.01 && (Math.sin(p.yaw) * dx + Math.cos(p.yaw) * dz) / d < Math.cos(POLI_FOV / 2)) return false;
  return lineaLibre(city, p.x, p.z, pl.px, pl.py);
}

// Colisión de los agentes: además de los obstáculos, no pisan celdas que el A* no usa (p. ej. la de un árbol, fuera del
// tronco), porque desde ahí pueden quedar encajados. Si ya están en una, sí pueden moverse para salir.
function chocaAgente(city, p, x, z) {
  if (obstaculoEn(city, x, z)) return true;
  const i = Math.floor(x), j = Math.floor(z);
  return !walkable(city, i, j) && walkable(city, Math.floor(p.x), Math.floor(p.z));
}

// Avanza por p.ruta (celdas) a `vel`. Devuelve lo recorrido; al terminar deja p.k = ruta.length.
function agenteSigueRuta(city, p, vel, dt) {
  let budget = dt * vel, moved = 0;
  for (let g = 0; budget > 0 && g < 8 && p.ruta && p.k < p.ruta.length; g++) {
    const t = p.ruta[p.k], tx = t.i + .5, tz = t.j + .5, dx = tx - p.x, dz = tz - p.z, dist = Math.hypot(dx, dz);
    if (dist > 1e-4) giraAgente(p, Math.atan2(dx, dz), dt, 12);
    if (dist <= budget) { budget -= dist; moved += dist; p.x = tx; p.z = tz; p.k++; continue; }
    const mx = dx / dist * budget, mz = dz / dist * budget;
    if (!chocaAgente(city, p, p.x + mx, p.z + mz)) { p.x += mx; p.z += mz; moved += budget; }
    else if (!chocaAgente(city, p, p.x + mx, p.z)) { p.x += mx; moved += Math.abs(mx); }       // roce con una esquina: desliza
    else if (!chocaAgente(city, p, p.x, p.z + mz)) { p.z += mz; moved += Math.abs(mz); }
    budget = 0;
  }
  return moved;
}

// Pide una ruta A* (encolada, con presupuesto) desde la posición del agente hasta la celda t. Al llegar el resultado,
// fin(ruta|null) decide; si el agente cambió de pedido (p.pend) entretanto, el resultado se descarta.
// prio: 0 persecución, 1 avisos, 2 regreso y patrulla.
function pedirRuta(sim, p, t, prio, fin) {
  const o = celdaPeatonal(sim.city, p.x, p.z, 3);
  if (!o || !t) { p.pend = 0; fin(null); return; }
  const tok = p.pend = ++sim.tok;
  sim.rutas.pedir({
    a: o, b: t, prio,
    vigente: () => p.pend === tok,
    cb: ruta => { p.pend = 0; fin(ruta); },
  });
}

// Pone una ruta nueva y salta los primeros puntos de paso que ya se ven en línea caminable desde la posición actual
// (la búsqueda pudo tardar unos frames y el agente se movió).
function ponerRuta(sim, p, ruta) {
  p.ruta = ruta; p.k = 0; p.atascado = false; p.tAtasco = 0; p.refX = p.x; p.refZ = p.z;
  if (!ruta?.length) return;
  while (p.k + 1 < ruta.length && lineaCaminable(sim.city, p.x, p.z, ruta[p.k + 1].i + .5, ruta[p.k + 1].j + .5)) p.k++;
  // Si el primer tramo en línea recta roza un obstáculo, primero va al centro de su celda.
  const t = p.ruta[p.k], i = Math.floor(p.x), j = Math.floor(p.z);
  if (!lineaCaminable(sim.city, p.x, p.z, t.i + .5, t.j + .5, 0) && walkable(sim.city, i, j)) { p.ruta = [{ i, j }, ...ruta.slice(p.k)]; p.k = 0; }
}

// Movimiento directo hacia (tx, tz) con colisión (desliza por el eje libre). Devuelve lo recorrido.
function agenteVaDirecto(city, p, tx, tz, vel, dt) {
  const dx = tx - p.x, dz = tz - p.z, dist = Math.hypot(dx, dz);
  if (dist < 1e-4) return 0;
  const m = Math.min(dist, dt * vel), mx = dx / dist * m, mz = dz / dist * m;
  giraAgente(p, Math.atan2(dx, dz), dt, 12);
  if (!chocaAgente(city, p, p.x + mx, p.z + mz)) { p.x += mx; p.z += mz; return m; }
  if (mx && !chocaAgente(city, p, p.x + mx, p.z)) { p.x += mx; return Math.abs(mx); }
  if (mz && !chocaAgente(city, p, p.x, p.z + mz)) { p.z += mz; return Math.abs(mz); }
  return 0;
}

// Entra en alerta visual: se detiene, mira al jugador y muestra "!" durante POLI_T_ALERTA.
function agenteAlerta(p) {
  p.tVis = 0; p.estado = 'alerta'; p.aviso = false; p.tAlerta = POLI_T_ALERTA; p.ruta = null; p.fuerza = 0; p.pend = 0;
}

// Entra en persecución (solo lo decide el nivel de búsqueda: no se propaga a otros agentes).
function agentePersigue(sim, p) {
  p.estado = 'persecucion'; p.aviso = false; p.acude = false; p.tRuta = 0; p.ruta = null; p.k = 0; p.pend = 0; p.obj = null; p.buscando = false; p.tVis = 0;
  sim.perseguido = true;
  sim.eventos.push({ t: 'persecucion', idx: p.idx });
}

// Vuelve a su esquina por A* peatonal (encolado; si no hay camino, camina directo en el último tramo).
export function agenteRegresa(sim, p) {
  p.estado = 'regreso'; p.aviso = false; p.acude = false; p.ruta = null; p.k = 0;
  const b = p.esquinaBase;
  pedirRuta(sim, p, { i: Math.floor(b.x), j: Math.floor(b.z) }, 2, r => { if (p.estado === 'regreso') ponerRuta(sim, p, r); });
}

// Patrulla: nueva parada, una vereda libre al azar dentro de POLI_PAT_R de su esquina, con ruta peatonal.
// La ruta se pide encolada; si no hay camino, en la próxima pausa elige otra parada.
function agenteNuevaRuta(sim, p) {
  const city = sim.city, b = p.esquinaBase;
  p.ruta = null; p.k = 0;
  if (p.pend) return;
  for (let intento = 0; intento < 8; intento++) {
    const t = celdaPeatonal(city, b.x + (sim.rand() * 2 - 1) * POLI_PAT_R, b.z + (sim.rand() * 2 - 1) * POLI_PAT_R, 2);
    if (!t || (t.i === Math.floor(p.x) && t.j === Math.floor(p.z))) continue;
    pedirRuta(sim, p, t, 2, r => { if (p.estado === 'patrulla' && r && r.length) ponerRuta(sim, p, r); });
    return;
  }
}

// Termina la búsqueda (zafar, coima aceptada o captura): 0 estrellas, los agentes vuelven a su esquina y se van los vehículos.
export function limpiarBusqueda(sim) {
  sim.busq = crearBusqueda();
  sim.patrullas.length = 0; sim.heli = null; sim.heliUsado = false; sim.visto = false; sim.ultima = null;
  sim.rutasCalle?.vaciar();
  for (const p of sim.agentes) if ((p.estado === 'persecucion' || p.estado === 'alerta') && !p.acude) agenteRegresa(sim, p);   // quien acude a un llamado sigue
}

// Coima al capturar (agente o patrulla): sin cooldown y con callback, pregunta a main.js. Aceptada: no hay captura y la
// búsqueda termina para todos los perseguidores.
function intentaCoima(sim, p) {
  if (!puedeOfrecer(sim.G.coimaCd) || !sim.coima) return false;
  if (!sim.coima(p)) return false;
  sim.G.coimaCd = cooldownInicial();
  limpiarBusqueda(sim);
  sim.G.ciegoT = COIMA_CIEGO;                                        // durante este tiempo hacen de cuenta que no te ven
  for (const q of sim.agentes) { q.ve = false; q.ventaT = 0; }
  sim.eventos.push({ t: 'coima', idx: p.idx });
  return true;
}

// Captura (agente o patrulla), salvo coima aceptada.
function capturar(sim, p, pl) {
  if (intentaCoima(sim, p)) return;
  sim.G.capT = POLI_PAUSA_CAPT; sim.G.capAg = p;
  sim.eventos.push({ t: 'atrapado', idx: p.idx });
  pl.spd = 0; pl.path = []; pl.target = null;
}

// Punto de intercepción de cada perseguidor: `rango` es su orden entre los que persiguen (reparte POLI_INTERCEPT, así no
// van todos por la misma ruta). El rango 0 va a la posición actual; el resto, a la posición futura predicha (velocidad
// estimada del jugador por el tiempo que tarda en llegar, con tope INTERCEPT_T_MAX) más su desplazamiento delante/al costado.
function agenteIntercepcion(sim, p, pl, rango, d) {
  const v = POLI_INTERCEPT[rango % POLI_INTERCEPT.length], NN = ladoDe(sim.city);
  if (!v.adel && !v.lado) return celdaPeatonal(sim.city, pl.px, pl.py, 6);
  const tl = Math.min(INTERCEPT_T_MAX, d / velPersecucion(sim.ronda));
  const fx = Math.sin(pl.heading), fz = Math.cos(pl.heading);
  const cx = pl.px + sim.vel.x * tl, cz = pl.py + sim.vel.z * tl;
  const tx = Math.max(1, Math.min(NN - 2, cx + fx * v.adel - fz * v.lado)), tz = Math.max(1, Math.min(NN - 2, cz + fz * v.adel + fx * v.lado));
  return celdaPeatonal(sim.city, tx, tz, 5) || celdaPeatonal(sim.city, pl.px, pl.py, 6);
}

// Separación local: los agentes activos (no en patrulla) que quedan más cerca que SEP_RADIO se empujan suavemente,
// sin meterse en obstáculos.
function separar(sim, dt) {
  const act = sim.agentes.filter(p => p.estado !== 'patrulla');
  const k = Math.min(1, dt * SEP_FUERZA);
  for (let a = 0; a < act.length; a++) for (let b = a + 1; b < act.length; b++) {
    const p = act[a], q = act[b];
    let dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz);
    if (d >= SEP_RADIO) continue;
    if (d < 1e-4) { const ang = (p.idx * 2.399) % TAU; dx = Math.sin(ang); dz = Math.cos(ang); d = 1; }   // encimados: dirección fija por índice
    const m = (SEP_RADIO - Math.min(d, SEP_RADIO)) * 0.5 * k, ux = dx / d * m, uz = dz / d * m;
    if (!chocaAgente(sim.city, p, p.x - ux, p.z - uz)) { p.x -= ux; p.z -= uz; }
    if (!chocaAgente(sim.city, q, q.x + ux, q.z + uz)) { q.x += ux; q.z += uz; }
  }
}

// Atasco: siguiendo una ruta sin avanzar RUTA_ATASCO_D celdas en RUTA_ATASCO_T s. Devuelve true al detectarlo.
function atascado(p, dt) {
  if (!p.ruta || p.k >= p.ruta.length) { p.tAtasco = 0; p.refX = p.x; p.refZ = p.z; return false; }
  if (Math.hypot(p.x - p.refX, p.z - p.refZ) >= RUTA_ATASCO_D) { p.refX = p.x; p.refZ = p.z; p.tAtasco = 0; return false; }
  p.tAtasco += dt;
  if (p.tAtasco < RUTA_ATASCO_T) return false;
  p.tAtasco = 0; p.refX = p.x; p.refZ = p.z;
  return true;
}

// Red de seguridad: ningún agente que quiere moverse se queda trabado. Si pasa POLI_TRABA_T s sin avanzar, busca en el acto
// (sin cola ni presupuesto) un camino desde el centro de su celda; si tampoco así avanza, salta al próximo punto del camino.
export const POLI_TRABA_T = 1.5, POLI_TRABA_D = 0.4;
function destinoDe(sim, p, pl) {
  if (p.estado === 'persecucion') return sim.visto || !sim.ultima ? { x: pl.px, z: pl.py } : p.buscando ? null : sim.ultima;
  if (p.estado === 'regreso') return p.esquinaBase;
  if (p.estado === 'alerta' && p.aviso) return p.objetivo;
  if (p.estado === 'patrulla' && p.ruta && p.k < p.ruta.length) { const t = p.ruta[p.ruta.length - 1]; return { x: t.i + .5, z: t.j + .5 }; }
  return null;
}
function destrabar(sim, p, pl, dt) {
  const dest = destinoDe(sim, p, pl);
  if (!dest || Math.hypot(dest.x - p.x, dest.z - p.z) < 1 || Math.hypot(p.x - (p.wx ?? Infinity), p.z - (p.wz ?? 0)) >= POLI_TRABA_D) {
    p.wx = p.x; p.wz = p.z; p.wt = 0; p.trabas = 0; return;
  }
  p.wt += dt;
  if (p.wt < POLI_TRABA_T) return;
  p.wt = 0; p.trabas++;
  const city = sim.city, o = celdaPeatonal(city, p.x, p.z, 4), t = celdaPeatonal(city, dest.x, dest.z, 6);
  const r = o && t ? buscarRuta(city, o, t, { suave: true }) : null;
  if (!o) return;
  if (p.trabas === 1 && r) {
    p.pend = 0; p.obj = t; p.tRuta = POLI_T_RUTA * 2; p.atascado = false;
    p.ruta = [o, ...r]; p.k = 0; p.tAtasco = 0; p.refX = p.x; p.refZ = p.z;
  } else {
    const s = r?.[0] ?? o;                                           // último recurso
    p.x = s.i + .5; p.z = s.j + .5; p.ruta = null; p.k = 0; p.pend = 0; p.obj = null; p.tRuta = 0; p.trabas = 0;
    if (p.estado === 'regreso') agenteRegresa(sim, p);
  }
}

const verUltima = (sim, x, z, heading = 0) => { sim.ultima = { x, z, heading }; };

// Llamado de un peatón: siempre va al menos un agente libre hasta (x, z), el más cercano. Ese agente (acude = true) llega sí o
// sí: no se desvía ni se cancela (avistamientos, zafar, coima) hasta estar en el lugar. Sin búsqueda activa, además acuden todos los que estén a menos de POLI_R_AVISO; pasan a alerta yendo
// hacia allí (no cuentan como perseguidores) y el primero que ve al jugador suma una estrella (motivo venta).
// Con estrellas activas va solo ese agente y el llamado actualiza la última posición vista.
export function alertarAgentes(sim, x, z) {
  const city = sim.city;
  const hayBusqueda = sim.busq.nivel > 0;
  if (hayBusqueda) verUltima(sim, x, z, sim.ultima?.heading ?? 0);
  const dest = celdaPeatonal(city, x, z, 4);
  if (!dest) return;
  const dist = p => Math.hypot(p.x - x, p.z - z);
  const libre = p => !p.acude && (p.estado === 'patrulla' || p.estado === 'regreso' || (p.estado === 'alerta' && p.aviso)) && !!celdaPeatonal(city, p.x, p.z, 3);
  const libres = sim.agentes.filter(libre).sort((a, b) => dist(a) - dist(b));
  if (!libres.length && sim.pool) {                                  // ninguno activo libre: se activa la esquina libre más cercana
    const hay = new Set(sim.agentes.map(p => p.idx));
    for (const i of esquinasCerca(sim.indice, x, z, RECLUTA_R, sim.agentes.length + 1)) {
      if (hay.has(i)) continue;
      const p = nuevoAgente(sim, i, sim.esquinas[i]);
      if (!libre(p)) continue;
      sim.agentes.push(p); libres.push(p); break;
    }
  }
  libres.forEach((p, k) => {
    if (k > 0 && (hayBusqueda || dist(p) > POLI_R_AVISO)) return;
    p.estado = 'alerta'; p.aviso = true; p.acude = k === 0; p.reintentos = 0; p.objetivo = { x, z }; p.ruta = null; p.k = 0;
    p.tAviso = Math.max(POLI_T_AVISO, 2 * dist(p) / POLI_VEL_ALERTA);   // tiempo suficiente para llegar aunque esté lejos
    pedirRuta(sim, p, dest, 1, r => {                                // ruta encolada; sin camino, vuelve a su esquina
      if (!(p.estado === 'alerta' && p.aviso)) return;
      if (r) ponerRuta(sim, p, r); else if (!p.acude) agenteRegresa(sim, p);
    });
    sim.eventos.push({ t: 'alerta', idx: p.idx });
  });
}

// Agentes que ven al jugador ahora: atentos, comprometidos o respondiendo un llamado. El más cercano primero.
function testigos(sim, pl) {
  const radio = radioVista(sim.ronda), out = [];
  if (sim.G.ciegoT > 0) return out;
  for (const p of sim.agentes) {
    if (!(p.atento || comprometido(p) || (p.estado === 'alerta' && p.aviso))) continue;
    const dx = pl.px - p.x, dz = pl.py - p.z, d = Math.hypot(dx, dz);
    if (d > Math.max(radio, POLI_RADIO_PERS) || !agenteVe(sim.city, p, pl, d, dx, dz, radio)) continue;
    out.push([p, d]);
  }
  return out.sort((a, b) => a[1] - b[1]).map(e => e[0]);
}

// Director: mantiene exactamente respuesta(nivel).agentes comprometidos. Primero los preferidos (testigos), después los más
// cercanos a la última posición vista. conAlerta: los preferidos muestran el "!" antes de perseguir.
function completarRespuesta(sim, preferidos = [], conAlerta = false) {
  if (sim.busq.nivel <= 0 || !sim.ultima) return;
  let falta = respuesta(sim.busq.nivel).agentes;
  for (const p of sim.agentes) if (comprometido(p)) falta--;
  for (const p of preferidos) {
    if (falta <= 0) return;
    if (comprometido(p) || p.acude) continue;
    if (conAlerta) { agenteAlerta(p); sim.perseguido = true; } else agentePersigue(sim, p);
    falta--;
  }
  if (falta <= 0) return;
  const u = sim.ultima, libres = sim.agentes.filter(p => !comprometido(p) && !p.acude);
  if (sim.pool && libres.length < falta) {                          // faltan cerca: se activan esquinas más lejanas
    const hay = new Set(sim.agentes.map(p => p.idx));
    for (const i of esquinasCerca(sim.indice, u.x, u.z, RECLUTA_R, sim.agentes.length + falta)) {
      if (libres.length >= falta) break;
      if (hay.has(i)) continue;
      const p = nuevoAgente(sim, i, sim.esquinas[i]); sim.agentes.push(p); libres.push(p);
    }
  }
  for (const p of asignarPerseguidores(libres, u, falta)) agentePersigue(sim, p);
}

// Un testigo vio un motivo ('venta' | 'corrida'): suma estrella (con cooldown por motivo), completa la respuesta del nivel y
// cierra los llamados pendientes.
function avistamiento(sim, pl, vistos, motivo, suma = true) {
  verUltima(sim, pl.px, pl.py, pl.heading);
  if (suma && sumarEstrella(sim.busq, motivo, sim.t)) sim.eventos.push({ t: 'estrella', nivel: sim.busq.nivel, motivo });
  if (sim.busq.nivel <= 0) return;
  completarRespuesta(sim, vistos, motivo === 'corrida');
  // Con la búsqueda en marcha los llamados quedan resueltos: nadie más suma estrellas por ellos.
  for (const p of sim.agentes) if (p.estado === 'alerta' && p.aviso && !p.acude) agenteRegresa(sim, p);
}

// Venta (o insulto) a la vista: +1 estrella. Habilita ventaT en los testigos.
export function ventaVista(sim, pl) {
  if (!sim.city || !pl) return;
  const vistos = testigos(sim, pl);
  if (!vistos.length) return;
  for (const p of vistos) p.ventaT = POLI_VENTA_VENTANA;
  avistamiento(sim, pl, vistos, 'venta');
}

// Ofrecer a la vista (se concrete o no la venta): cuenta como venta vista y todo agente que lo ve queda persiguiendo.
export function ofertaVista(sim, pl) {
  if (!sim.city || !pl) return;
  const vistos = testigos(sim, pl);
  if (!vistos.length) return;
  ventaVista(sim, pl);
  let n = sim.agentes.filter(p => p.estado === 'persecucion').length;
  for (const p of vistos) if (n < POLI_MAX_PERS && p.estado !== 'persecucion' && !p.acude) { agentePersigue(sim, p); n++; }
}

// Ya alertado: persiguiendo, en "!" o acudiendo a un llamado.
const alertado = p => p.estado === 'persecucion' || p.estado === 'alerta';

// Empezar a correr a la vista de un agente (stepAgentes lo llama en el flanco de subida de pl.corre): +1 estrella solo si
// entre los que lo ven hay alguno todavía no alertado.
export function corridaVista(sim, pl) {
  if (!sim.city || !pl || !pl.corre) return;
  const vistos = testigos(sim, pl);
  if (vistos.length) avistamiento(sim, pl, vistos, 'corrida', vistos.some(p => !alertado(p)));
}

// Correr dentro del cono de un agente lo pone a perseguir en el acto (sin "!" previo y aunque el nivel ya esté cubierto).
function vioCorrer(sim, p, pl) {
  if (sim.agentes.filter(q => q.estado === 'persecucion').length >= POLI_MAX_PERS) return;
  verUltima(sim, pl.px, pl.py, pl.heading);
  if (!alertado(p) && sumarEstrella(sim.busq, 'corrida', sim.t)) sim.eventos.push({ t: 'estrella', nivel: sim.busq.nivel, motivo: 'corrida' });
  agentePersigue(sim, p);
}

// Un agente atento que no está haciendo nada (patrulla o regreso) y ve en su cono a otro que persigue, se suma.
function sumarseSiVe(sim, p, radio) {
  if (!p.atento || (p.estado !== 'patrulla' && p.estado !== 'regreso')) return;
  const pers = sim.agentes.filter(q => q.estado === 'persecucion');
  if (!pers.length || pers.length >= POLI_MAX_PERS) return;
  const ve = pers.some(q => {
    const dx = q.x - p.x, dz = q.z - p.z;
    return agenteVe(sim.city, p, { px: q.x, py: q.z }, Math.hypot(dx, dz), dx, dz, radio);
  });
  if (ve) agentePersigue(sim, p);
}

// Todos vuelven a su esquina en patrulla (nueva partida o ronda). patrulla y ronda (opcionales) para lo que empieza.
export function resetAgentes(sim, patrulla, ronda) {
  const G = sim.G;
  if (patrulla) sim.patrulla = patrulla;
  if (ronda) sim.ronda = ronda;
  limpiarBusqueda(sim);
  G.capT = 0; G.capAg = null; G.coimaCd = 0; G.ciegoT = 0; G.corria = false; sim.perseguido = false; sim.escapes = 0; sim.eventos.length = 0;
  sim.t = 0; sim.tPool = 0;
  if (sim.pool) sim.agentes.length = 0;
  for (const p of sim.agentes) {
    const b = p.esquinaBase;
    Object.assign(p, { x: b.x, z: b.z, yaw: b.yaw, estado: 'patrulla', ruta: null, k: 0, aviso: false, acude: false, ve: false, ventaT: 0, fuerza: 0, tAlerta: 0, tPat: 0.5,
      pend: 0, obj: null, refX: b.x, refZ: b.z, wx: b.x, wz: b.z, wt: 0, trabas: 0, tAtasco: 0, atascado: false, buscando: false, atento: esAtento(sim, p.idx) });
  }
  sim.rutas.vaciar(); sim.vel.x = sim.vel.z = 0;
}

// Pedido de ruta de una patrulla al A* encolado de la red de calles. Devuelve undefined: la ruta se asigna al resolverse.
function rutaPatrulla(sim, v, a, b) {
  if (v.pend) return undefined;
  const tok = v.pend = ++sim.tok, cc = sim.calles;
  sim.rutasCalle.pedir({
    a, b, prio: 0,
    vigente: () => v.pend === tok && sim.patrullas.includes(v),
    cb: r => {
      v.pend = 0;
      if (!r) { v.ruta = null; return; }
      const libre = c => lineaCaminable(cc, v.x, v.z, c.i + .5, c.j + .5);
      let k = 0;
      while (k + 1 < r.length && libre(r[k + 1])) k++;
      if (r.length && libre(r[k])) { v.ruta = r; v.k = k; }
      else if (libre(a)) { v.ruta = [a, ...r]; v.k = 0; }     // vuelve al centro de la celda de partida
      else v.tRuta = 0;                                        // se movió demasiado: pide otra
    },
  });
  return undefined;
}

function nuevaPatrulla(sim, pl) {
  prepararCalles(sim);
  const u = sim.ultima, [d0, d1] = PATRULLA_APARECE;
  let c = null;
  for (let k = 0; k < 24 && !c; k++) {
    const a = sim.rand() * TAU, d = d0 + sim.rand() * (d1 - d0);
    const q = calleCerca(sim.calles, u.x + Math.sin(a) * d, u.z + Math.cos(a) * d, 6);
    if (q && Math.hypot(q.i + .5 - pl.px, q.j + .5 - pl.py) >= d0 * 0.7) c = q;
  }
  c ??= calleCerca(sim.calles, u.x, u.z, 80);
  if (!c) return null;
  return Object.assign(crearPatrulla(sim.calles, c.i + .5, c.j + .5), { idx: -1 - sim.patrullas.length, pend: 0, ve: false, tVis: 0 });
}

// Patrullas y helicóptero del nivel actual: aparecen, se mueven y (las patrullas) capturan.
function stepVehiculos(sim, pl, dt) {
  const q = respuesta(sim.busq.nivel);
  while (sim.patrullas.length < q.patrullas) {
    const v = nuevaPatrulla(sim, pl);
    if (!v) break;
    sim.patrullas.push(v); sim.eventos.push({ t: 'patrulla' });
  }
  if (q.heli && !sim.heliUsado) {                                     // una sola llegada por búsqueda (HELI_T_ESCENA s)
    const a = sim.rand() * TAU;
    sim.heli = crearHeli(pl.px + Math.sin(a) * HELI_APARECE, pl.py + Math.cos(a) * HELI_APARECE);
    sim.heliUsado = true; sim.eventos.push({ t: 'heli' });
  }
  const u = sim.ultima;
  for (let k = 0; k < sim.patrullas.length; k++) {
    const v = sim.patrullas[k];
    if ((v.tVis -= dt) <= 0) {
      v.tVis = POLI_VIS_DT;
      v.ve = Math.hypot(pl.px - v.x, pl.py - v.z) <= POLI_RADIO_PERS && lineaLibre(sim.city, v.x, v.z, pl.px, pl.py);
    }
    const meta = { px: u.x, py: u.z, heading: u.heading, visto: sim.visto, adel: VEH_ADELANTE + k * PATRULLA_ADEL_EXTRA };
    const r = stepPatrulla(v, sim.calles, pl, dt, { meta, ruta: (c, a, b) => rutaPatrulla(sim, v, a, b) });
    if (r.captura) { capturar(sim, v, pl); if (sim.G.capT > 0 || sim.busq.nivel === 0) return; }
  }
  const h = sim.heli;
  if (h) {
    stepHeli(h, pl, dt, sim.visto ? pl : { px: u.x, py: u.z });
    if (!h.activo) { sim.heli = null; sim.eventos.push({ t: 'heli_fin' }); }
  }
}

// Un paso de simulación (agentes activos, estrellas, patrullas y helicóptero). Modifica sim y pl.heading durante la captura.
// Con patrulla 1 los agentes no caminan: quedan en su esquina barriendo la cabeza hasta que vean o alerten algo.
export function stepAgentes(sim, pl, dt) {
  const { city, G, agentes } = sim;
  if (!city || !pl) return;
  G.coimaCd = bajarCooldown(G.coimaCd, dt);
  G.ciegoT = Math.max(0, G.ciegoT - dt);
  if (G.capT > 0) {                                                  // captura: todos quietos, el jugador "se sacude" y luego fin
    G.capT -= dt;
    pl.heading = wrapAng(pl.heading + dt * 9);
    if (G.capAg) { G.capAg.fuerza = 0; G.capAg.yaw = Math.atan2(pl.px - G.capAg.x, pl.py - G.capAg.z); }
    if (G.capT <= 0) { G.capT = 0; G.capAg = null; limpiarBusqueda(sim); sim.eventos.push({ t: 'capturado' }); }
    return;
  }
  sim.t += dt;
  if (sim.pool && (sim.tPool -= dt) <= 0) activarAgentes(sim, pl);
  G.bfs = POLI_BFS_FRAME;
  if (dt > 0 && pl.prevPx !== undefined) {                          // velocidad del jugador (media móvil) para la intercepción
    const a = Math.min(1, dt * 5);
    sim.vel.x += ((pl.px - pl.prevPx) / dt - sim.vel.x) * a; sim.vel.z += ((pl.py - pl.prevPy) / dt - sim.vel.z) * a;
  }
  if (pl.corre && !G.corria) corridaVista(sim, pl);                  // "correr visto": solo al empezar a correr
  G.corria = !!pl.corre;
  // Conocimiento compartido: mientras alguien lo ve, la última posición vista es la actual.
  sim.visto = !!sim.heli?.ve || sim.patrullas.some(v => v.ve) || agentes.some(p => p.ve && comprometido(p));
  if (sim.busq.nivel === 0 && agentes.some(comprometido)) sim.busq.nivel = 1;   // quien persigue implica al menos 1 estrella
  if (sim.busq.nivel > 0) {
    if (sim.visto || !sim.ultima) verUltima(sim, pl.px, pl.py, pl.heading);
    completarRespuesta(sim);
  }
  const radio = radioVista(sim.ronda), vel = velPersecucion(sim.ronda);
  let rango = 0;
  for (const p of agentes) {
    const dx = pl.px - p.x, dz = pl.py - p.z, d2 = dx * dx + dz * dz;
    if (p.estado === 'patrulla' && d2 > POLI_SIM * POLI_SIM) continue;   // lejos y tranquilo: no se simula
    const d = Math.sqrt(d2);
    if (p.ventaT > 0) p.ventaT -= dt;
    p.tVis -= dt;
    if (p.tVis <= 0) { p.tVis = POLI_VIS_DT; p.ve = G.ciegoT <= 0 && agenteVe(city, p, pl, d, dx, dz, radio); sumarseSiVe(sim, p, radio); }
    if (pl.corre && p.ve && p.estado !== 'persecucion' && !p.acude && G.ciegoT <= 0 && (p.atento || p.estado === 'alerta')) vioCorrer(sim, p, pl);
    let moved = 0;
    switch (p.estado) {
      case 'patrulla':                                                // patrulla 2: camina por la vereda entre paradas; patrulla 1: quieto en la esquina
        if (sim.patrulla !== 1 && !p.fijo && p.ruta && p.k < p.ruta.length) {
          moved = agenteSigueRuta(city, p, POLI_VEL_PAT, dt);
          if (atascado(p, dt)) { p.ruta = null; p.tPat = 0; }        // trabado: elige otra parada
        }
        else {                                                        // barre la cabeza (en ambas patrullas)
          p.fase += dt * POLI_BARRIDO_VEL;
          giraAgente(p, p.esquinaBase.yaw + POLI_BARRIDO * Math.sin(p.fase), dt, 6);
          if (sim.patrulla !== 1 && !p.fijo) {
            p.tPat -= dt;
            if (p.tPat <= 0) { agenteNuevaRuta(sim, p); p.tPat = POLI_PAT_PAUSA * (0.3 + 0.7 * sim.rand()); }
          }
        }
        break;
      case 'alerta':
        if (p.aviso) {                                                // yendo a un llamado: todavía no persigue
          if (p.ve && !p.acude) { avistamiento(sim, pl, [p], 'venta'); if (!p.aviso) break; }
          moved = agenteSigueRuta(city, p, POLI_VEL_ALERTA, dt);
          if (!p.acude) p.tAviso -= dt;
          const o = p.objetivo, repedir = () => pedirRuta(sim, p, celdaPeatonal(city, o.x, o.z, 4), 1, r => { if (p.estado === 'alerta' && p.aviso) ponerRuta(sim, p, r); });
          if (atascado(p, dt)) repedir();
          const finRuta = !p.pend && (!p.ruta || p.k >= p.ruta.length);
          if (p.acude) {                                              // no suelta el llamado hasta llegar al lugar
            if (finRuta) {
              if (Math.hypot(o.x - p.x, o.z - p.z) > POLI_ACUDE_LLEGA && p.reintentos++ < POLI_ACUDE_REINTENTOS) repedir();
              else if (p.ve && G.ciegoT <= 0) p.acude = false;        // llegó y lo ve: en el próximo paso actúa
              else agenteRegresa(sim, p);
            }
          } else if (finRuta || p.tAviso <= 0) agenteRegresa(sim, p);
        } else {
          const u = sim.ultima ?? { x: pl.px, z: pl.py };
          giraAgente(p, Math.atan2(u.x - p.x, u.z - p.z), dt, 14);
          p.tAlerta -= dt;
          if (p.tAlerta <= 0) agentePersigue(sim, p);
        }
        break;
      case 'persecucion': {
        if (distSegPunto(p.x, p.z, pl.prevPx ?? pl.px, pl.prevPy ?? pl.py, pl.px, pl.py) < POLI_CAPTURA) {
          capturar(sim, p, pl);                                      // coima aceptada: sin captura, se termina la búsqueda
          break;
        }
        const u = sim.ultima ?? { x: pl.px, z: pl.py };
        // Destino conocido: el jugador si alguien lo ve; si no, la última posición vista.
        const gx = sim.visto ? pl.px : u.x, gz = sim.visto ? pl.py : u.z, dg = Math.hypot(gx - p.x, gz - p.z);
        if (sim.visto) p.buscando = false; else if (dg < BUSCA_LLEGA) p.buscando = true;
        if (d < POLI_DIRECTO && p.ve && lineaCaminable(city, p.x, p.z, pl.px, pl.py, 0)) moved = agenteVaDirecto(city, p, pl.px, pl.py, vel, dt);
        else {
          p.tRuta -= dt;
          if (p.tRuta <= 0 && G.bfs > 0 && !p.pend) {
            p.tRuta = POLI_T_RUTA;
            const sinRuta = !p.ruta || p.k >= p.ruta.length || p.atascado;
            let t;
            if (p.buscando) t = sinRuta ? celdaPeatonal(city, u.x + (sim.rand() * 2 - 1) * BUSCA_R, u.z + (sim.rand() * 2 - 1) * BUSCA_R, 4) : p.obj;
            else t = sim.visto && d > 6 ? agenteIntercepcion(sim, p, pl, rango, d) : celdaPeatonal(city, gx, gz, 6);
            const movio = !p.obj || !t || Math.hypot(t.i - p.obj.i, t.j - p.obj.j) > RUTA_UMBRAL_OBJ;
            if (sinRuta || movio) {                                   // recalcula solo si hace falta
              G.bfs--; p.obj = t;
              if (!t) ponerRuta(sim, p, null);
              else if (lineaCaminable(city, p.x, p.z, t.i + .5, t.j + .5)) ponerRuta(sim, p, [t]);   // atajo: recta libre, sin búsqueda
              else pedirRuta(sim, p, t, 0, r => { if (p.estado === 'persecucion') ponerRuta(sim, p, r); });
            }
          }
          moved = p.ruta ? agenteSigueRuta(city, p, vel, dt) : 0;
          if (atascado(p, dt)) { p.atascado = true; p.tRuta = 0; p.obj = null; }   // trabado contra un borde: recalcula
          if (!moved && !p.buscando && dg < 6) moved = agenteVaDirecto(city, p, gx, gz, vel, dt);   // sin ruta pero cerca: directo
        }
        rango++;
        break;
      }
      case 'regreso':
        if (p.ruta && p.k < p.ruta.length) {
          moved = agenteSigueRuta(city, p, POLI_VEL_REG, dt);
          if (atascado(p, dt)) agenteRegresa(sim, p);
        } else if (p.pend) moved = 0;                                 // esperando la ruta encolada
        else {
          const b = p.esquinaBase;                                    // último tramo: directo a la esquina
          moved = agenteVaDirecto(city, p, b.x, b.z, POLI_VEL_REG, dt);
          if (Math.hypot(b.x - p.x, b.z - p.z) < 0.05) { p.x = b.x; p.z = b.z; p.estado = 'patrulla'; p.fase = 0; p.ruta = null; p.k = 0; p.tPat = 0.5; }
        }
        break;
    }
    if (G.capT > 0) return;
    destrabar(sim, p, pl, dt);
    p.fuerza = moved > 0 ? 1 : 0;
    p.phase += moved * 10;
  }
  if (sim.busq.nivel > 0 && sim.ultima) stepVehiculos(sim, pl, dt);
  if (G.capT > 0) return;
  separar(sim, dt);
  // A* encolado: entre patrullas y agentes nunca más de RUTA_NODOS_FRAME nodos por paso
  const usados = sim.rutasCalle ? sim.rutasCalle.procesar(RUTA_NODOS_FRAME) : 0;
  sim.rutas.procesar(RUTA_NODOS_FRAME - usados);
  // Zafar (busqueda.js): nadie lo ve durante tPerder(nivel) s, todos a más de dist(nivel) y fuera del círculo del helicóptero.
  if (sim.busq.nivel > 0) {
    let visto = !!sim.heli?.ve, dMin = 1e9;
    for (const p of agentes) if (comprometido(p)) { if (p.ve) visto = true; dMin = Math.min(dMin, Math.hypot(p.x - pl.px, p.z - pl.py)); }
    for (const v of sim.patrullas) { if (v.ve) visto = true; dMin = Math.min(dMin, Math.hypot(v.x - pl.px, v.z - pl.py)); }
    const z = stepBusqueda(sim.busq, dt, { visto, dMin }, POLI_T_PERDER, POLI_DIST_SAFAR);
    if (z) {
      limpiarBusqueda(sim);
      sim.escapes++;
      sim.eventos.push({ t: 'zafe', nivel: z.nivel });
    }
  }
}
