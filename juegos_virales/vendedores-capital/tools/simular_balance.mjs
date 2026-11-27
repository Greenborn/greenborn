// Simulador headless de balance de la 2D (sin DOM). No es una prueba: el runner solo corre test_*.mjs.
// Uso:
//   node 2d/tools/simular_balance.mjs                 anterior vs actual (aplicado en el juego), 40 corridas por política
//   node 2d/tools/simular_balance.mjs --corridas 100  más corridas
//   node 2d/tools/simular_balance.mjs --solo actual   (o --solo anterior, propuesta, actual_sin_ultima_vista)
//   node 2d/tools/simular_balance.mjs --set COIMA_ACEPTA=0.4 --set POLI_VEL_PERS=6   overrides sobre "actual" y "propuesta"
//   node 2d/tools/simular_balance.mjs --calibrar      solo la calibración de persecución con agentes.js real
//   node 2d/tools/simular_balance.mjs --json          resultados en JSON
// También se puede importar: simular(P, politica, semilla) y PARAMS_ACTUALES / PROPUESTA.
//
// Qué usa de verdad y qué modela:
//  - REAL: peatones.js (probsReaccion, reaccionPara, aplicarReaccion, memoria por peatón), REACCIONES de textos.js,
//    DEMANDA y PRECIOS de productos.js, JORNADA de jornada.js, valores de config.js como defaults, y agentes.js + ciudad.js
//    en la calibración de persecución (--calibrar). REACCIONES, DEMANDA y JORNADA son objetos: se ajustan en memoria
//    durante la corrida y se restauran después (los archivos no se tocan).
//  - "actual" lee las constantes del juego y usa la densidad de agentes del mapa real; los agentes que pierden de vista van a la
//    última posición vista (ULTIMA_VISTA: al llegar, el jugador se aleja de ellos a BUSCA_EF de su velocidad).
//    "anterior" son los valores previos al balance; "propuesta" es la de la etapa A (ciudad procedural, agentes omniscientes).
//  - REIMPLEMENTADO con parámetros (mismas fórmulas que economia.js, coima.js y puntaje.js, verificadas contra los módulos
//    reales al arrancar con los valores actuales): costo unitario, capacidad, caja inicial, costos de mejoras, coima, bonus.
//  - MODELADO (probabilístico, ver "Modelo" abajo): encontrar peatones en el cono, ser visto por un agente, el llamado y la
//    persecución en una dimensión (distancia a cada perseguidor), calibrada con --calibrar.
//
// Modelo (paso dt = 0.25 s):
//  - Pool local de peatones alrededor del jugador: POOL_BASE x peat del momento x PEATONES_N/40. Cada peatón se va con
//    tasa ROTACION/s y entra uno nuevo (memoria N). Si quedan menos de 3 elegibles nuevos o interesados, las políticas
//    que eligen zona se mueven REUBICAR_T s (sin vender) y el pool se renueva entero.
//  - Cada OFR_CD s se intenta ofrecer: hay objetivo en el cono con prob 1 - exp(-elegibles x K_CONO x (radio/2.25)^2).
//    La reacción la sortea peatones.js real.
//  - Venta o insulto vistos: prob 1 - exp(-agentes x área del cono x LOS_F / AREA_CAMINABLE x cautela). Correr fuera de
//    persecución: misma fórmula por segundo (corridaVista). Llamado: agentes en POLI_R_AVISO; encuentran al jugador
//    con prob LLAMADO_ENCUENTRA (la mitad si la política se va del lugar).
//  - Persecución 1D: el primero arranca a U(2, 7) celdas detrás; se suman Poisson(agentes en POLI_R_PROP) a U(6, 12),
//    la mitad por delante (cierran a v_jug + v_ag hasta 3 celdas y el jugador dobla). Los agentes avanzan a
//    POLI_VEL_PERS x EF_AG (rutas BFS). Línea de visión: se corta por s con prob esconde (política) si d > 3;
//    se recupera con prob 0.6 x (1 - d/POLI_RADIO_PERS) por s. Zafa con todos a más de POLI_DIST_SAFAR y sin vista
//    POLI_T_PERDER s. Captura a < 0.5: coima (si no hay cooldown) o fin.
//  - Dependen del tamaño del mapa (reajustar con el mapa real de CABA): N_AG, AREA_CAMINABLE, POOL_BASE, ROTACION,
//    REUBICAR_T, LLAMADO_ENCUENTRA.
import * as CFG from '../js/config.js';
import { readFile } from 'node:fs/promises';
import { cargarCiudadReal } from '../js/ciudad_real.js';
import * as AG from '../js/agentes.js';
import * as ECO from '../js/economia.js';
import * as PU from '../js/puntaje.js';
import { PRECIOS, DEMANDA, ORDEN_DESBLOQUEO } from '../js/productos.js';
import { REACCIONES } from '../js/textos.js';
import { JORNADA, momentoEn } from '../js/jornada.js';
import { memNueva, esElegible, reaccionPara, aplicarReaccion } from '../js/peatones.js';
import { generarCiudad, esquinasAgentes, N } from '../js/ciudad.js';
import * as BQ from '../js/busqueda.js';
import { VEH_VEL_RECTA, HELI_VEL, HELI_R, HELI_T_ESCENA } from '../js/vehiculos.js';

// ---------- Parámetros ----------
const clon = o => JSON.parse(JSON.stringify(o));
const pesosActuales = Object.fromEntries(REACCIONES.map(r => [r.id, r.peso]));
const jornadaActual = JORNADA.map(j => ({ id: j.id, dem: j.dem, peat: j.peat }));

const BASE = {
  // economía
  COSTO_FRAC: CFG.COSTO_FRAC, STOCK_BASE: CFG.STOCK_BASE, STOCK_PASO: CFG.STOCK_PASO, STOCK_MAX: CFG.STOCK_MAX,
  CARRITO_BONO: CFG.CARRITO_BONO, CONOC_DESC: CFG.CONOC_DESC, CAPITAL_INI: null,   // null = ceil(STOCK_BASE x precio x COSTO_FRAC)
  MEJ_FACT: Object.fromEntries(Object.entries(ECO.MEJORAS).map(([k, m]) => [k, m.costos.map(c => c / ECO.BASE_MEJ)])),
  MEJ_BASE: null,                    // null = precio inicial x COSTO_FRAC x STOCK_MAX (BASE_MEJ)
  MEJ_INFLA: 0,                      // propuesto: los costos de mejora suben con la ronda: x (1 + MEJ_INFLA x (ronda - 1))
  GASTO_RONDA: 0, GASTO_PASO: 0,     // propuesto: gasto fijo al reponer (permiso/traslado): GASTO_RONDA + GASTO_PASO x (ronda - 1)
  PRECIOS: { ...PRECIOS }, DEMANDA: { ...DEMANDA },
  // jugador y energía
  SPEED: CFG.SPEED, RUN_SPEED: CFG.RUN_SPEED, RUN_PASO_NIVEL: CFG.RUN_PASO_NIVEL, RUN_SPEED_TOPE: CFG.RUN_SPEED_TOPE,
  CONS_CORRER: CFG.CONS_CORRER, CONS_MIN: CFG.CONS_MIN, REC_QUIETO: CFG.REC_QUIETO, REC_CAMINA: CFG.REC_CAMINA,
  UMBRAL_REINICIO: CFG.UMBRAL_REINICIO, RESIST_MULT: CFG.RESIST_MULT,
  REC_DEMORA: 0,                     // propuesto: s sin correr antes de recuperar energía (cierra el pulso de Shift)
  CONS_ARRANQUE: 0,                  // propuesto: energía que cuesta cada arranque de carrera
  OFR_RADIO: CFG.OFR_RADIO, OFR_PASO: CFG.OFR_PASO, OFR_RADIO_MAX: CFG.OFR_RADIO_MAX, OFR_CD: CFG.OFR_CD,
  // agentes (N_AG y AREA_CAMINABLE salen de la ciudad actual: reajustar con el mapa real)
  N_AG: 12, AREA_CAMINABLE: 7380,
  AG_FRAC_INI: 1, AG_FRAC_PASO: 0,   // propuesto: fracción de esquinas con agente en la ronda 1 y aumento por ronda (tope 1)
  POLI_RADIO: AG.POLI_RADIO, POLI_RADIO_PASO: 0, POLI_RADIO_TOPE: AG.POLI_RADIO, POLI_FOV: AG.POLI_FOV,
  POLI_RADIO_PERS: AG.POLI_RADIO_PERS, POLI_VEL_PERS: AG.POLI_VEL_PERS, POLI_VEL_PERS_PASO: 0, POLI_VEL_PERS_TOPE: AG.POLI_VEL_PERS,
  POLI_T_PERDER: AG.POLI_T_PERDER, POLI_DIST_SAFAR: AG.POLI_DIST_SAFAR, POLI_R_PROP: AG.POLI_R_PROP, POLI_R_AVISO: AG.POLI_R_AVISO,
  POLI_CAPTURA: AG.POLI_CAPTURA,
  // peatones
  PEATONES_N: CFG.PEATONES_N, REACCIONES: pesosActuales, JORNADA: jornadaActual,
  // coima
  COIMA_FRAC: CFG.COIMA_FRAC, COIMA_ACEPTA: CFG.COIMA_ACEPTA, COIMA_CD: CFG.COIMA_CD,
  COIMA_DECAE: 1,                    // propuesto: la aceptación se multiplica por esto con cada coima aceptada en la partida
  COIMA_MIN: 0,                      // propuesto: pago mínimo en $ (sin dinero suficiente, no hay coima)
  // puntaje
  PTS_VENTA: CFG.PTS_VENTA, PTS_ESCAPE: CFG.PTS_ESCAPE, PTS_BONUS_SIGILO: CFG.PTS_BONUS_SIGILO, PTS_BONUS_TIEMPO: CFG.PTS_BONUS_TIEMPO,
  T_BONUS_BASE: CFG.T_BONUS_BASE, T_BONUS_POR_U: CFG.T_BONUS_POR_U, SIGILO_POR_RONDA: false,
  BONUS_TIEMPO_ESCALA: 0,            // propuesto: el bonus de tiempo máximo crece con la ronda: x (1 + escala x (ronda - 1))
  MEDALLA_MIN: { ...CFG.MEDALLA_MIN },
  // modelo (no son constantes del juego; dependen del mapa)
  POOL_BASE: 8, ROTACION: 0.04, REUBICAR_T: 6, K_CONO: 0.09, LOS_F: 0.5, LLAMADO_ENCUENTRA: 0.5, EF_AG: 0.95,
  MAX_RONDAS: 12, T_MAX_RONDA: 420,
  // nivel de búsqueda (busqueda.js + vehiculos.js). Actual: sin estrellas (la persecución se propaga por POLI_R_PROP).
  ESTRELLAS: false,
  PATRULLA_EF: 0.55,                 // fracción de VEH_VEL_RECTA que rinde una patrulla en la cuadrícula (giros a VEH_VEL_GIRO)
  PATRULLA_CAPT: 0.35,               // prob. de que el jugador esté en la calzada cuando una patrulla lo alcanza (si no, sigue)
};

// Valores previos al balance (congelados).
export const PARAMS_ANTERIORES = {
  ...clon(BASE),
  COSTO_FRAC: 0.4, REC_CAMINA: 10, COIMA_FRAC: 0.5, COIMA_ACEPTA: 0.6, COIMA_CD: 3, T_BONUS_POR_U: 10,
  MEDALLA_MIN: { bronce: 500, plata: 1000, oro: 1500 },
  MEJ_FACT: { carrito: [0.9, 1.5], alcance: [0.5, 1.0], velocidad: [0.75, 0.75], resistencia: [0.5, 0.5, 0.5], proveedores: [0.25, 0.5] },
};
// Densidad del mapa real: un agente por esquina sobre las celdas caminables.
const real = await cargarCiudadReal({ leerJson: async u => JSON.parse(await readFile(u, 'utf8')), leerBin: async u => readFile(u) });
export const PARAMS_ACTUALES = {
  ...clon(BASE),
  MEJ_INFLA: CFG.MEJ_INFLA, GASTO_RONDA: CFG.GASTO_RONDA, GASTO_PASO: CFG.GASTO_PASO,
  REC_DEMORA: CFG.REC_DEMORA, CONS_ARRANQUE: CFG.CONS_ARRANQUE,
  AG_FRAC_INI: AG.AG_FRAC_INI, AG_FRAC_PASO: AG.AG_FRAC_PASO, POLI_RADIO_PASO: AG.POLI_RADIO_PASO, POLI_RADIO_TOPE: AG.POLI_RADIO_TOPE,
  POLI_VEL_PERS_PASO: AG.POLI_VEL_PERS_PASO, POLI_VEL_PERS_TOPE: AG.POLI_VEL_PERS_TOPE,
  COIMA_DECAE: CFG.COIMA_DECAE, COIMA_MIN: CFG.COIMA_MIN, SIGILO_POR_RONDA: true, BONUS_TIEMPO_ESCALA: CFG.BONUS_TIEMPO_ESCALA,
  ESTRELLAS: true, N_AG: real.esquinas.length, AREA_CAMINABLE: real.pasa.reduce((a, b) => a + b, 0), ULTIMA_VISTA: true,
};

// Propuesta (ver balance_propuesta.json para motivos y efecto medido).
export const PROPUESTA = {
  ...clon(BASE),
  COSTO_FRAC: 0.5,
  MEJ_FACT: { carrito: [1.5, 3], alcance: [1, 2], velocidad: [1.2, 2.2], resistencia: [0.8, 1.4, 2], proveedores: [0.6, 1.4] },
  MEJ_INFLA: 0.15,
  GASTO_RONDA: 600, GASTO_PASO: 300,
  REC_CAMINA: 8, REC_DEMORA: 1, CONS_ARRANQUE: 4,
  AG_FRAC_INI: 0.6, AG_FRAC_PASO: 0.05,
  POLI_RADIO_PASO: 0.25, POLI_RADIO_TOPE: 9.5,
  POLI_VEL_PERS_PASO: 0.05, POLI_VEL_PERS_TOPE: 6.0,
  REACCIONES: { ignorar: 30, comprar1: 20, comprar2: 8, insultar: 14, cortes: 20, llamado: 8 },
  COIMA_ACEPTA: 0.55, COIMA_FRAC: 0.6, COIMA_CD: 8, COIMA_DECAE: 0.6, COIMA_MIN: 500,
  T_BONUS_POR_U: 6, SIGILO_POR_RONDA: true, BONUS_TIEMPO_ESCALA: 0.25,
  MEDALLA_MIN: { bronce: 8000, plata: 20000, oro: 40000 },
  ESTRELLAS: true, N_AG: 25,         // un agente por cruce de calles (25 en la ciudad actual; cientos en el mapa real)
};

const BUSCA_EF = 0.7;   // fracción de la velocidad del jugador a la que se aleja de quien ya llegó a la última posición vista

// ---------- Utilidades ----------
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const poisson = (l, r) => { let k = 0, p = Math.exp(-l), s = p, u = r(); while (u > s && k < 20) { k++; p *= l / k; s += p; } return k; };
const U = (a, b, r) => a + (b - a) * r();
const media = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

// Aplica pesos de REACCIONES, DEMANDA y JORNADA del juego de parámetros (en memoria) y devuelve cómo restaurarlos.
function aplicarObjetos(P) {
  const bkR = REACCIONES.map(r => r.peso), bkD = { ...DEMANDA }, bkJ = JORNADA.map(j => ({ dem: j.dem, peat: j.peat }));
  for (const r of REACCIONES) if (P.REACCIONES[r.id] != null) r.peso = P.REACCIONES[r.id];
  Object.assign(DEMANDA, P.DEMANDA);
  JORNADA.forEach((j, i) => { const o = P.JORNADA.find(x => x.id === j.id); if (o) { j.dem = o.dem; j.peat = o.peat; } });
  return () => { REACCIONES.forEach((r, i) => { r.peso = bkR[i]; }); Object.assign(DEMANDA, bkD); JORNADA.forEach((j, i) => Object.assign(j, bkJ[i])); };
}

// ---------- Economía parametrizada (mismas fórmulas que economia.js) ----------
function econ(P) {
  const ini = ORDEN_DESBLOQUEO[0];
  const capIni = P.CAPITAL_INI ?? Math.ceil(P.STOCK_BASE * P.PRECIOS[ini] * P.COSTO_FRAC);
  const base = P.MEJ_BASE ?? Math.round(P.PRECIOS[ini] * P.COSTO_FRAC * P.STOCK_MAX);
  const costos = Object.fromEntries(Object.entries(P.MEJ_FACT).map(([k, f]) => [k, f.map(x => Math.round(x * base))]));
  const capMax = P.STOCK_MAX + P.CARRITO_BONO[P.CARRITO_BONO.length - 1];
  return {
    capIni, costos,
    costoMejora: (k, n, ronda) => Math.round(costos[k][n] * (1 + P.MEJ_INFLA * (ronda - 1))),
    stockTope: r => Math.min(P.STOCK_MAX, P.STOCK_BASE + P.STOCK_PASO * (r - 1)),
    capacidad: (r, m) => Math.min(capMax, Math.min(P.STOCK_MAX, P.STOCK_BASE + P.STOCK_PASO * (r - 1)) + P.CARRITO_BONO[m.carrito]),
    costoUnit: (p, m) => Math.round(P.PRECIOS[p] * P.COSTO_FRAC * (1 - P.CONOC_DESC[m.proveedores])),
    gasto: r => P.GASTO_RONDA + P.GASTO_PASO * (r - 1),
  };
}

// Comprobación: con los valores actuales, las fórmulas coinciden con economia.js.
function verificarFormulas() {
  const E = econ(PARAMS_ACTUALES), r4 = { ...ECO.economiaInicial(), ronda: 4 }, m0 = ECO.economiaInicial().mejoras;
  const ok = E.capIni === ECO.CAPITAL_INI
    && Object.keys(ECO.MEJORAS).every(k => ECO.MEJORAS[k].costos.every((c, n) => c === E.costoMejora(k, n, 1)))
    && [1, 3, 8].every(r => E.capacidad(r, m0) === ECO.capacidad({ ...ECO.economiaInicial(), ronda: r }))
    && ORDEN_DESBLOQUEO.every(p => E.costoUnit(p, m0) === ECO.costoUnit(ECO.economiaInicial(), p))
    && E.gasto(4) === ECO.gastoRonda(r4) && E.costoMejora('alcance', 0, 4) === ECO.siguienteCosto(r4, 'alcance')
    && PU.tiempoBonus(30) === PARAMS_ACTUALES.T_BONUS_BASE + PARAMS_ACTUALES.T_BONUS_POR_U * 30;
  if (!ok) { console.error('Las fórmulas del simulador no coinciden con economia.js / puntaje.js: revisar.'); process.exitCode = 1; }
  return ok;
}

// ---------- Políticas ----------
// cautela: factor sobre la prob. de ser visto (mira antes de vender) y costo en tiempo; corre: 'mantiene' | 'pulso' | 'administra' | 'no';
// esconde: prob/s de cortar la línea de visión; zona: se reubica cuando se agotan los peatones; mejoras: 'prudente' | 'asap' | 'nunca'.
export const POLITICAS = {
  prudente: { cautela: 0.5, costoCautela: 0.25, corre: 'administra', esconde: 0.35, zona: true, mejoras: 'prudente', correVendiendo: false },
  agresivo: { cautela: 1.0, costoCautela: 0, corre: 'mantiene', esconde: 0.15, zona: true, mejoras: 'prudente', correVendiendo: true },
  coimero: { cautela: 1.3, costoCautela: 0, corre: 'no', esconde: 0.05, zona: false, mejoras: 'prudente', correVendiendo: false },
  mejoras_asap: { cautela: 0.5, costoCautela: 0.25, corre: 'administra', esconde: 0.35, zona: true, mejoras: 'asap', correVendiendo: false },
  pulsador: { cautela: 0.5, costoCautela: 0.25, corre: 'pulso', esconde: 0.35, zona: true, mejoras: 'prudente', correVendiendo: false },
};
const PRIORIDAD_MEJ = ['carrito', 'proveedores', 'alcance', 'resistencia', 'velocidad'];

// Reposición: llena la capacidad con los productos de mejor margen x demanda (hasta tiposMax tipos) con la caja disponible.
function elegirCompra(P, E, st) {
  const desb = ORDEN_DESBLOQUEO.slice(0, Math.min(5, st.ronda));
  const orden = desb.map(p => ({ p, u: E.costoUnit(p, st.mej), v: (P.PRECIOS[p] - E.costoUnit(p, st.mej)) * P.DEMANDA[p] })).sort((a, b) => b.v - a.v);
  const tipos = 1 + st.mej.carrito;
  let cap = E.capacidad(st.ronda, st.mej), caja = st.caja - E.gasto(st.ronda);
  const lotes = {}; let costo = 0;
  // Varios tipos: reparte la capacidad en partes iguales entre los mejores.
  const elegidos = orden.slice(0, tipos);
  for (let k = 0; k < elegidos.length; k++) {
    const { p, u } = elegidos[k];
    const quiero = k === elegidos.length - 1 ? cap : Math.ceil(cap / (elegidos.length - k));
    const q = Math.max(0, Math.min(quiero, Math.floor(caja / u)));
    if (q > 0) { lotes[p] = q; costo += q * u; caja -= q * u; cap -= q; }
  }
  return { lotes, costo };
}
const costoCompraLlena = (P, E, st) => { const c = elegirCompra(P, E, { ...st, caja: 1e12 }); return c.costo + E.gasto(st.ronda); };

function comprarMejoras(P, E, st, pol) {
  if (pol.mejoras === 'nunca') return;
  for (let vuelta = 0; vuelta < 10; vuelta++) {
    let compro = false;
    for (const k of PRIORIDAD_MEJ) {
      const n = st.mej[k]; if (n >= P.MEJ_FACT[k].length) continue;
      const c = E.costoMejora(k, n, st.ronda);
      const reserva = costoCompraLlena(P, E, st) * (pol.mejoras === 'asap' ? 0.5 : 1);
      if (st.caja - c >= reserva) { st.caja -= c; st.mej[k]++; st.gastoMej += c; compro = true; }
    }
    if (!compro) break;
  }
}

// ---------- Ronda ----------
function agentesRonda(P, r) { return Math.max(1, Math.round(P.N_AG * Math.min(1, P.AG_FRAC_INI + P.AG_FRAC_PASO * (r - 1)))); }
const radioVis = (P, r) => Math.min(P.POLI_RADIO_TOPE, P.POLI_RADIO + P.POLI_RADIO_PASO * (r - 1));
const velAg = (P, r) => Math.min(P.POLI_VEL_PERS_TOPE, P.POLI_VEL_PERS + P.POLI_VEL_PERS_PASO * (r - 1));
const pVisto = (P, r, nAg, f) => 1 - Math.exp(-nAg * (radioVis(P, r) ** 2 * P.POLI_FOV / 2) * P.LOS_F / P.AREA_CAMINABLE * f);

function jugarRonda(P, E, st, pol, rnd, lotes) {
  const dt = 0.25, ronda = st.ronda, nAg = agentesRonda(P, ronda);
  const vRun = Math.min(P.RUN_SPEED_TOPE, P.RUN_SPEED + P.RUN_PASO_NIVEL * st.mej.velocidad);
  const cons = Math.max(P.CONS_MIN, P.CONS_CORRER * P.RESIST_MULT[st.mej.resistencia]);
  const radio = Math.min(P.OFR_RADIO_MAX, P.OFR_RADIO + P.OFR_PASO * st.mej.alcance);
  const R = { nivelMax: 0, ptsEscape: 0, unidades: 0, ingreso: 0, pers: 0, escapes: 0, energia: 0, t: 0, capturado: false, coimas: 0, coimaRech: 0, reubica: 0 };
  let stock = Object.values(lotes).reduce((a, b) => a + b, 0), ing = 0;
  const orden = ORDEN_DESBLOQUEO.filter(p => lotes[p] > 0);
  const tamPool = () => Math.max(2, Math.round(P.POOL_BASE * momentoEn(t).peat * P.PEATONES_N / 40));
  const nuevo = () => ({ mem: memNueva(), pausa: 0 });
  let t = 0, cdOfr = 0, reubicar = 0, energia = 100, agotado = false, sinCorrer = 99, corriaAntes = false;
  let pool = Array.from({ length: tamPool() }, nuevo);
  let chase = null, toggle = false;
  const valorStock = () => orden.reduce((a, p) => a + lotes[p] * P.PRECIOS[p], 0);

  const busq = BQ.crearBusqueda();
  const sumarPorNivel = () => {        // completa la respuesta del nivel actual (busqueda.js)
    const q = BQ.respuesta(busq.nivel);
    const aPie = chase.ags.filter(a => !a.veh).length, veh = chase.ags.filter(a => a.veh).length;
    for (let k = aPie; k < q.agentes; k++) chase.ags.push({ d: U(6, 12, rnd), frente: rnd() < 0.5 });
    for (let k = veh; k < q.patrullas; k++) chase.ags.push({ d: U(10, 20, rnd), frente: true, veh: true });
    if (q.heli && chase.heli == null) { chase.heli = U(10, 16, rnd); chase.heliT = HELI_T_ESCENA; }
    R.nivelMax = Math.max(R.nivelMax, busq.nivel);
  };
  const empezarChase = (d0, motivo = 'venta') => {
    R.pers++; st.perseguidoPartida = true; st.perseguidoRonda = true;
    if (P.ESTRELLAS) {
      BQ.sumarEstrella(busq, motivo, t);
      chase = { ags: [{ d: d0, frente: false }], visto: true, sinVista: 0, heli: null };
      sumarPorNivel();
      return;
    }
    const ags = [{ d: d0, frente: false }];
    const extra = poisson((nAg - 1) * Math.PI * P.POLI_R_PROP ** 2 / P.AREA_CAMINABLE, rnd);
    for (let k = 0; k < extra; k++) ags.push({ d: U(6, 12, rnd), frente: rnd() < 0.5 });
    chase = { ags, visto: true, sinVista: 0 };
  };

  while (stock > 0 && t < P.T_MAX_RONDA) {
    t += dt; sinCorrer += dt;
    for (const q of pool) if (q.pausa > 0) q.pausa -= dt;
    let corre = false, mueve = false;
    if (chase) {
      // Política de carrera en la persecución
      const dMin = Math.min(...chase.ags.map(a => a.d));
      if (pol.corre === 'mantiene') corre = true;
      else if (pol.corre === 'pulso') { toggle = !toggle; corre = toggle; }
      else if (pol.corre === 'administra') corre = dMin < (P.ESTRELLAS ? BQ.safarParams(busq.nivel, P.POLI_T_PERDER, P.POLI_DIST_SAFAR).dist : P.POLI_DIST_SAFAR) + 6 || chase.visto;
      mueve = pol.corre !== 'no' || true;
    } else if (reubicar > 0) {
      reubicar -= dt; mueve = true; corre = pol.correVendiendo;
      if (reubicar <= 0) pool = Array.from({ length: tamPool() }, nuevo);
    } else {
      mueve = pol.correVendiendo && rnd() < 0.3;
      corre = mueve;
    }
    // Energía (main.js moverJugador, con REC_DEMORA y CONS_ARRANQUE propuestos)
    if (energia <= 0) { energia = 0; agotado = true; }
    if (agotado && energia >= P.UMBRAL_REINICIO) agotado = false;
    corre = corre && !agotado;
    if (corre) {
      const g = cons * dt + (!corriaAntes ? P.CONS_ARRANQUE : 0);
      energia -= g; R.energia += g; sinCorrer = 0;
    } else if (sinCorrer >= P.REC_DEMORA) energia += (mueve ? P.REC_CAMINA : P.REC_QUIETO) * dt;
    energia = Math.max(0, Math.min(100, energia));
    const corriaPrev = corriaAntes; corriaAntes = corre;
    const vJug = corre ? vRun : P.SPEED;

    if (chase) {
      const va = velAg(P, ronda) * P.EF_AG, vj = pol.corre === 'no' ? P.SPEED * 0.6 : vJug;
      let visto = false;
      for (const a of chase.ags) {
        if (P.ULTIMA_VISTA) {                       // sin vista van a donde lo vieron; al llegar ya no saben para dónde fue
          if (chase.visto) a.resto = a.d;
          else if ((a.resto = (a.resto ?? a.d) - (a.veh ? VEH_VEL_RECTA * P.PATRULLA_EF : va) * dt) <= 0) { a.frente = false; a.d += vj * BUSCA_EF * dt; continue; }
        }
        if (a.veh) { const vv = VEH_VEL_RECTA * P.PATRULLA_EF; a.d += (a.frente ? -(vj + vv) : (vj - vv)) * dt; if (a.frente && a.d <= 3) { a.frente = false; a.d = 3; } continue; }
        if (a.frente) { a.d -= (vj + va) * dt; if (a.d <= 3) { a.frente = false; a.d = 3; } }
        else a.d += (vj - va) * dt;
      }
      // Línea de visión
      const dMin = Math.min(...chase.ags.map(a => a.d));
      if (chase.visto) { if (dMin > 3 && rnd() < pol.esconde * dt) chase.visto = false; }
      else if (dMin < P.POLI_RADIO_PERS && rnd() < 0.6 * (1 - dMin / P.POLI_RADIO_PERS) * dt) chase.visto = true;
      visto = chase.visto && dMin <= P.POLI_RADIO_PERS;
      let heliVe = false;
      if (P.ESTRELLAS) {
        if (chase.heli != null && (chase.heliT -= dt) > 0) { chase.heli = Math.max(0, chase.heli + (vj - HELI_VEL) * dt); heliVe = chase.heli <= HELI_R; }
        if (heliVe) chase.visto = true;
        // Correr a la vista de otro agente de esquina suma una estrella (corridaVista)
        if (corre && !corriaPrev && rnd() < pVisto(P, ronda, nAg, 1)) { if (BQ.sumarEstrella(busq, 'corrida', t)) sumarPorNivel(); }
      }
      // Captura
      let cerca = chase.ags.findIndex(a => !a.frente && a.d < P.POLI_CAPTURA);
      if (cerca >= 0 && chase.ags[cerca].veh && rnd() > P.PATRULLA_CAPT) { Object.assign(chase.ags[cerca], { d: U(8, 15, rnd), frente: true }); cerca = -1; }   // estaba en la vereda: la patrulla tiene que dar la vuelta a la manzana
      if (cerca >= 0) {
        const monto = Math.min(ing, Math.round(P.COIMA_FRAC * valorStock()));
        if (st.coimaCd <= 0 && monto >= Math.max(1, P.COIMA_MIN)) {
          if (rnd() < P.COIMA_ACEPTA * P.COIMA_DECAE ** st.coimasPartida) {
            ing -= monto; st.coimaPagado += monto; st.coimasPartida++; R.coimas++; st.coimaCd = P.COIMA_CD;
            chase.ags.splice(cerca, 1);
            if (!chase.ags.length || P.ESTRELLAS) { chase = null; BQ.perderEstrellas(busq); }
            continue;
          }
          R.coimaRech++;
        }
        R.capturado = true; break;
      }
      // Zafar
      if (P.ESTRELLAS) {
        const z = BQ.stepBusqueda(busq, dt, { visto, dMin, heliVe }, P.POLI_T_PERDER, P.POLI_DIST_SAFAR);
        if (z) { chase = null; R.escapes++; R.ptsEscape += P.PTS_ESCAPE * BQ.ptsEscapeMult(z.nivel); reubicar = P.REUBICAR_T * 0.5; }
        st.coimaCd = Math.max(0, st.coimaCd - dt);
        continue;
      }
      if (visto || dMin <= P.POLI_DIST_SAFAR) chase.sinVista = visto ? 0 : chase.sinVista;
      else chase.sinVista += dt;
      if (chase.sinVista >= P.POLI_T_PERDER) { chase = null; R.escapes++; R.ptsEscape += P.PTS_ESCAPE; reubicar = P.REUBICAR_T * 0.5; }
      st.coimaCd = Math.max(0, st.coimaCd - dt);
      continue;
    }
    st.coimaCd = Math.max(0, st.coimaCd - dt);
    if (reubicar > 0) continue;
    // Correr fuera de persecución (corridaVista)
    if (corre && rnd() < pVisto(P, ronda, nAg, 0.5) * dt) { empezarChase(U(4, 8, rnd), 'corrida'); continue; }
    // Rotación del pool
    for (let k = 0; k < pool.length; k++) if (rnd() < P.ROTACION * dt * (mueve ? 3 : 1)) pool[k] = nuevo();
    while (pool.length < tamPool()) pool.push(nuevo());
    if (pool.length > tamPool()) pool.length = tamPool();
    // Zona agotada: reubicarse
    const frescos = pool.filter(q => q.mem.est === 'N' || (q.mem.est === 'I' && q.mem.k < 3)).length;
    if (pol.zona && frescos < 3) { reubicar = P.REUBICAR_T; R.reubica++; continue; }
    // Ofrecer
    cdOfr -= dt;
    if (cdOfr > 0) continue;
    cdOfr = P.OFR_CD * (1 + pol.costoCautela);
    const eleg = pool.filter(esElegible);
    if (!eleg.length || rnd() > 1 - Math.exp(-eleg.length * P.K_CONO * (radio / 2.25) ** 2)) continue;
    const q = eleg[Math.floor(rnd() * eleg.length)];
    const p = orden.find(x => lotes[x] > 0);
    const id = reaccionPara(q, { producto: p, dem: momentoEn(t).dem, tiempo: t, rnd });
    q.pausa = CFG.OFR_PAUSA;
    let u = 0;
    if (id === 'comprar1' || id === 'comprar2') {
      u = Math.min(lotes[p], REACCIONES.find(r => r.id === id).n);
      lotes[p] -= u; stock -= u; ing += u * P.PRECIOS[p]; R.unidades += u;
    }
    aplicarReaccion(q, id, t, u);
    if ((u > 0 || id === 'insultar') && rnd() < pVisto(P, ronda, nAg, pol.cautela)) empezarChase(U(2, 7, rnd));
    else if (id === 'llamado') {
      const llegan = poisson(nAg * Math.PI * P.POLI_R_AVISO ** 2 / P.AREA_CAMINABLE, rnd);
      const pEnc = P.LLAMADO_ENCUENTRA * (pol.zona ? 0.5 : 1);
      if (llegan > 0 && rnd() < 1 - (1 - pEnc) ** llegan) empezarChase(U(4, 8, rnd));
      else if (pol.zona) { reubicar = P.REUBICAR_T * 0.5; R.reubica++; }
    }
  }
  R.t = t; R.ingreso = ing; R.atascado = stock > 0 && !R.capturado;
  return R;
}

// ---------- Partida ----------
export function simular(P, nombrePol, semilla) {
  const pol = POLITICAS[nombrePol], rnd = mulberry32(semilla), E = econ(P);
  const restaurar = aplicarObjetos(P);
  const st = { ronda: 1, caja: E.capIni, mej: { carrito: 0, alcance: 0, velocidad: 0, resistencia: 0, proveedores: 0 },
    coimaCd: 0, coimasPartida: 0, coimaPagado: 0, perseguidoPartida: false, gastoMej: 0 };
  const res = { rondas: 0, cajas: [], fin: 'tope', rondaMejoras: null, unidades: 0, tiempo: 0, pers: 0, escapes: 0, energia: 0,
    capturaRonda: [], coimas: 0, coimaRech: 0, pts: { venta: 0, escape: 0, sigilo: 0, tiempo: 0 }, bonusTiempoRonda: [], tRonda: [], nivelMax: 0, nivelesRonda: [], reubica: 0, atascos: 0 };
  const total = Object.values(P.MEJ_FACT).reduce((a, f) => a + f.length, 0);
  try {
    while (st.ronda <= P.MAX_RONDAS) {
      comprarMejoras(P, E, st, pol);
      const nMej = Object.values(st.mej).reduce((a, b) => a + b, 0);
      if (nMej === total && res.rondaMejoras === null) res.rondaMejoras = st.ronda;
      const compra = elegirCompra(P, E, st);
      if (Object.keys(compra.lotes).length === 0) { res.fin = 'sin_fondos'; break; }
      st.caja -= compra.costo + E.gasto(st.ronda);
      const uRonda = Object.values(compra.lotes).reduce((a, b) => a + b, 0);
      st.perseguidoRonda = false;
      const R = jugarRonda(P, E, st, pol, rnd, { ...compra.lotes });
      res.unidades += R.unidades; res.tiempo += R.t; res.pers += R.pers; res.escapes += R.escapes; res.energia += R.energia;
      res.coimas += R.coimas; res.coimaRech += R.coimaRech; res.reubica += R.reubica;
      res.pts.venta += R.unidades * P.PTS_VENTA; res.pts.escape += R.ptsEscape; res.nivelMax = Math.max(res.nivelMax, R.nivelMax); res.nivelesRonda.push(R.nivelMax);
      res.capturaRonda.push(R.capturado ? 1 : 0);
      if (R.capturado) { res.fin = 'capturado'; res.rondas = st.ronda; break; }
      if (R.atascado) res.atascos++;
      // Cierre: bonus (puntaje.js) y caja (economia.js cerrarRonda)
      const sig = P.SIGILO_POR_RONDA ? (st.perseguidoRonda ? 0 : P.PTS_BONUS_SIGILO) : (st.perseguidoPartida ? 0 : P.PTS_BONUS_SIGILO);
      const tb = P.T_BONUS_BASE + P.T_BONUS_POR_U * uRonda;
      const bt = Math.round(P.PTS_BONUS_TIEMPO * (1 + P.BONUS_TIEMPO_ESCALA * (st.ronda - 1)) * (1 - Math.min(1, R.t / tb)));
      res.pts.sigilo += sig; res.pts.tiempo += bt; res.bonusTiempoRonda.push(bt); res.tRonda.push(R.t);
      st.caja += R.ingreso;
      res.cajas.push(Math.round(st.caja));
      res.rondas = st.ronda;
      st.ronda++;
    }
  } finally { restaurar(); }
  if (res.rondaMejoras === null && Object.values(st.mej).reduce((a, b) => a + b, 0) === total) res.rondaMejoras = st.ronda;
  res.puntos = res.pts.venta + res.pts.escape + res.pts.sigilo + res.pts.tiempo;
  const M = P.MEDALLA_MIN;
  res.medalla = res.puntos >= M.oro ? 'oro' : res.puntos >= M.plata ? 'plata' : res.puntos >= M.bronce ? 'bronce' : 'ninguna';
  res.mejoras = { ...st.mej }; res.coimaPagado = st.coimaPagado;
  return res;
}

// ---------- Resumen ----------
export function resumir(P, nombrePol, corridas, semilla0 = 1000) {
  const rs = []; for (let k = 0; k < corridas; k++) rs.push(simular(P, nombrePol, semilla0 + k));
  const porRonda = (f, r) => media(rs.filter(x => x.cajas.length >= r).map(x => f(x, r)));
  const capt = []; for (let r = 1; r <= 8; r++) { const vivos = rs.filter(x => x.capturaRonda.length >= r); capt.push(vivos.length ? +(media(vivos.map(x => x.capturaRonda[r - 1])) * 100).toFixed(0) : null); }
  const cajas = []; for (let r = 1; r <= 8; r++) { const v = porRonda((x, rr) => x.cajas[rr - 1], r); cajas.push(v ? Math.round(v) : null); }
  const bt = []; for (let r = 1; r <= 6; r++) { const v = rs.filter(x => x.bonusTiempoRonda.length >= r); bt.push(v.length ? Math.round(media(v.map(x => x.bonusTiempoRonda[r - 1]))) : null); }
  const tr = []; for (let r = 1; r <= 6; r++) { const v = rs.filter(x => x.tRonda.length >= r); tr.push(v.length ? Math.round(media(v.map(x => x.tRonda[r - 1]))) : null); }
  const conMej = rs.filter(x => x.rondaMejoras !== null);
  const med = { oro: 0, plata: 0, bronce: 0, ninguna: 0 }; for (const x of rs) med[x.medalla]++;
  const fin = {}; for (const x of rs) fin[x.fin] = (fin[x.fin] || 0) + 1;
  return {
    politica: nombrePol, corridas,
    rondasMedia: +media(rs.map(x => x.rondas)).toFixed(2),
    fin,
    cajaPorRonda: cajas,
    rondaTodasMejoras: conMej.length ? +media(conMej.map(x => x.rondaMejoras)).toFixed(1) : null,
    pctCompletaMejoras: Math.round(conMej.length / rs.length * 100),
    unidadesPorMin: +(media(rs.map(x => x.unidades / Math.max(1, x.tiempo) * 60))).toFixed(1),
    tRondaSeg: tr,
    capturaPorRondaPct: capt,
    persecucionesPorPartida: +media(rs.map(x => x.pers)).toFixed(2),
    escapesPorPartida: +media(rs.map(x => x.escapes)).toFixed(2),
    pctEscape: (() => { const p = rs.reduce((a, x) => a + x.pers, 0); return p ? Math.round(rs.reduce((a, x) => a + x.escapes, 0) / p * 100) : null; })(),
    coimasAceptadas: +media(rs.map(x => x.coimas)).toFixed(2), coimasRechazadas: +media(rs.map(x => x.coimaRech)).toFixed(2),
    energiaPorRonda: Math.round(media(rs.map(x => x.energia / Math.max(1, x.rondas)))),
    bonusTiempoPorRonda: bt,
    puntosMedia: Math.round(media(rs.map(x => x.puntos))),
    puntosP25P75: (() => { const s = rs.map(x => x.puntos).sort((a, b) => a - b); return [s[Math.floor(s.length * 0.25)], s[Math.floor(s.length * 0.75)]]; })(),
    medallas: med,
    estrellasMaxMedia: +media(rs.map(x => x.nivelMax)).toFixed(2),
    estrellasMaxDist: [0, 1, 2, 3, 4, 5].map(n => rs.filter(x => x.nivelMax === n).length),
    atascos: rs.reduce((a, x) => a + x.atascos, 0),
  };
}

// ---------- Calibración de la persecución con agentes.js real ----------
// Un agente persigue al jugador, que corre en línea recta por la calle x = 21 de la ciudad actual con un perfil de velocidad.
// Mide la velocidad efectiva del agente (EF_AG), y si zafa o lo capturan y en cuánto tiempo. Usa los valores actuales de agentes.js.
export function calibrar() {
  const city = generarCiudad();
  const perfiles = { corre_7_5: () => 7.5, pulso_6_0: (t) => (Math.floor(t / 0.25) % 2 ? 4.5 : 7.5), camina_4_5: () => 4.5 };
  const out = [];
  for (const [nombre, vel] of Object.entries(perfiles)) for (const d0 of [3, 5]) {
    const sim = AG.crearSimulacion(city, { esquinas: [{ x: 21.5, z: 20.5 - d0, yaw: 0 }], rand: mulberry32(7) });
    const pl = { px: 21.5, py: 20.5, heading: 0, corre: true, spd: 0, path: [], target: null, prevPx: 21.5, prevPy: 20.5 };
    AG.ventaVista(sim, pl);
    const a = sim.agentes[0]; let t = 0, res = 'sigue', dIni = d0, tEsc = null;
    for (; t < 30 && pl.py < N - 3; t += 1 / 60) {
      pl.prevPx = pl.px; pl.prevPy = pl.py; pl.py += vel(t) / 60;
      sim.ultima = { x: pl.px, z: pl.py, heading: 0 };   // mide solo velocidad y zafar: el agente conoce la posición
      AG.stepAgentes(sim, pl, 1 / 60);
      if (sim.eventos.some(e => e.t === 'atrapado')) { res = 'captura'; break; }
      if (sim.eventos.some(e => e.t === 'zafe')) { res = 'zafa'; tEsc = t; break; }
    }
    const recorrido = Math.hypot(a.x - 21.5, a.z - (20.5 - d0));
    out.push({ perfil: nombre, d0, resultado: res, t: +t.toFixed(1), velAgenteEfectiva: +(recorrido / Math.max(t, 1e-3)).toFixed(2), efAg: +(recorrido / Math.max(t, 1e-3) / AG.POLI_VEL_PERS).toFixed(2) });
  }
  return { nAgentesCiudad: esquinasAgentes(city).length, perfiles: out };
}

// ---------- CLI ----------
const esMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('simular_balance.mjs');
if (esMain) {
  const args = process.argv.slice(2);
  const val = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const corridas = Number(val('--corridas')) || 40;
  const json = args.includes('--json');
  const t0 = Date.now();
  verificarFormulas();
  const cal = calibrar();
  if (args.includes('--calibrar')) { console.log(JSON.stringify(cal, null, 2)); process.exit(0); }
  const prop = clon(PROPUESTA);
  args.forEach((a, i) => {
    if (a !== '--set') return;
    const [k, v] = args[i + 1].split('=');
    prop[k] = v.startsWith('{') || v.startsWith('[') ? JSON.parse(v) : Number.isNaN(Number(v)) ? v : Number(v);
  });
  const actual = clon(PARAMS_ACTUALES);
  args.forEach((a, i) => { if (a === '--set') { const k = args[i + 1].split('=')[0]; actual[k] = prop[k]; } });
  const juegos = { anterior: PARAMS_ANTERIORES, propuesta: prop, actual_sin_ultima_vista: { ...actual, ULTIMA_VISTA: false }, actual };
  const solo = val('--solo');
  const salida = { calibracion: cal, resultados: {} };
  for (const [nom, P] of Object.entries(juegos)) {
    if (solo && solo !== nom) continue;
    salida.resultados[nom] = Object.keys(POLITICAS).map(pol => resumir(P, pol, corridas));
  }
  if (json) console.log(JSON.stringify(salida, null, 1));
  else {
    console.log('Calibración (agentes.js real, 1 agente detrás, calle recta):');
    for (const c of cal.perfiles) console.log(`  ${c.perfil.padEnd(11)} d0=${c.d0}: ${c.resultado} a los ${c.t}s, vel. agente ${c.velAgenteEfectiva} (EF_AG ${c.efAg})`);
    for (const [nom, lista] of Object.entries(salida.resultados)) {
      console.log(`\n===== ${nom.toUpperCase()} (${corridas} corridas por política) =====`);
      for (const r of lista) {
        console.log(`\n[${r.politica}] rondas ${r.rondasMedia} · fin ${JSON.stringify(r.fin)} · atascos ${r.atascos}`);
        console.log(`  caja por ronda: ${r.cajaPorRonda.join(' / ')}`);
        console.log(`  todas las mejoras: ronda ${r.rondaTodasMejoras ?? '-'} (${r.pctCompletaMejoras}% de partidas) · u/min ${r.unidadesPorMin} · t ronda ${r.tRondaSeg.join('/')}s`);
        console.log(`  captura por ronda %: ${r.capturaPorRondaPct.join(' / ')} · persecuciones ${r.persecucionesPorPartida} · zafadas ${r.escapesPorPartida} (${r.pctEscape ?? '-'}%)`);
        console.log(`  coimas aceptadas ${r.coimasAceptadas} / rechazadas ${r.coimasRechazadas} · energía gastada por ronda ${r.energiaPorRonda}`);
        console.log(`  bonus tiempo por ronda: ${r.bonusTiempoPorRonda.join(' / ')} · puntos ${r.puntosMedia} (p25-p75 ${r.puntosP25P75.join('-')}) · medallas ${JSON.stringify(r.medallas)}`);
        if (r.estrellasMaxMedia) console.log(`  estrellas máx. por partida: media ${r.estrellasMaxMedia} · partidas por máximo 0..5: ${r.estrellasMaxDist.join('/')}`);
      }
    }
    console.log(`\nTiempo: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
}
