// Peatones de la 2D: movimiento por veredas, memoria por ronda, reacciones al ofrecer, contagio por insulto y reciclado.
// Sin DOM. Origen: 3D (`../index.html`, REACCIONES y memProbs) y PLAN_MEJORAS.md, "Memoria de peatones e insistencia".
//
// Memoria (p.mem, vive en el peatón): se reinicia al empezar cada ronda (reiniciarMemoria) y se pierde al reciclar el peatón.
//  - N neutral: nunca ofrecido. Usa los pesos de REACCIONES; la compra se multiplica por DEMANDA y por el momento del día.
//  - I interesado: ofrecido sin compra y sin molestia (ignoró o cortés). La compra baja con cada ofrecimiento; el insulto sube.
//  - C compró: la compra extra baja y el insulto sube con cada ofrecimiento tras la compra.
//  - M molesto: insultó (o contagiado). Vuelve a I tras MEM_T_OLVIDO s sin contacto.
//  - P ya ofrecido, no insistir: no es elegible (tope de ofrecimientos o de compras).
//  - A alerta: llamó a los agentes. No es elegible.
import { celdaPeatonal, lineaLibre, ladoDe } from './ciudad.js';
import { buscarRuta } from './rutas.js';
import {
  PEAT_VEL, PEAT_LEJOS, PEAT_SPAWN_MIN, PEAT_SPAWN_MAX,
  MEM_COMPRA_BASE, MEM_COMPRA_DECAY, MEM_COMPRA_MIN, MEM_INSULTO_BASE, MEM_INSULTO_PASO, MEM_INSULTO_MAX,
  MEM_LLAMADO_DESDE, MEM_LLAMADO_PASO, MEM_LLAMADO_MAX, MEM_CORTES,
  MEM_C_COMPRA_BASE, MEM_C_COMPRA_DECAY, MEM_C_COMPRA_MIN, MEM_C_MAX_COMPRAS, MEM_C_MAX_OFERTAS,
  MEM_M_INSULTO, MEM_M_LLAMADO, MEM_M_COMPRA, MEM_M_MAX_OFERTAS, MEM_K_MAX, MEM_T_OLVIDO,
  PEAT_CONTAGIO_R, PEAT_CONTAGIO_BONO, PEAT_CONTAGIO_T,
} from './config.js';
import { REACCIONES } from './textos.js';
import { DEMANDA } from './productos.js';

export const COLORES_PEAT = ['#f4d35e', '#ee964b', '#f95738', '#83c5be', '#b8c0ff', '#ffffff', '#e0fbfc'];   // ropa de los transeúntes (render.js)

const PEAT_RUTA_MAX_NODOS = 2000;   // tope del A* de un paseo (destinos a ~14 celdas)

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------- Memoria ----------

export const memNueva = () => ({ est: 'N', k: 0, kc: 0, km: 0, compras: 0, tUlt: -Infinity, contagio: -Infinity });

// Reinicio al empezar cada ronda: todos los peatones vivos vuelven a N.
export function reiniciarMemoria(peds) {
  for (const p of peds) p.mem = memNueva();
}

// Elegible para ofrecer: no está en P ni en A y no está en la pausa del ofrecimiento anterior.
export const esElegible = p => p.pausa <= 0 && p.mem.est !== 'P' && p.mem.est !== 'A';

// Objetivo de ofrecer (G8, G23): el peatón elegible más cercano dentro del cono del jugador (radio y semiángulo), con línea de
// visión libre (un edificio entre los dos lo bloquea). Sin DOM: lo usan main.js (ofrecer) y render.js (flecha amarilla).
export function buscarObjetivoOfrecer(peds, city, pl, radio, medAng) {
  const cosA = Math.cos(medAng), fx = Math.sin(pl.heading), fz = Math.cos(pl.heading);
  let best = null, bestD = Infinity;
  for (const q of peds) {
    if (!esElegible(q)) continue;
    const dx = q.x - pl.px, dz = q.z - pl.py, d = Math.hypot(dx, dz);
    if (d > radio || d < 1e-4 || d >= bestD) continue;
    if ((fx * dx + fz * dz) / d < cosA) continue;
    if (!lineaLibre(city, pl.px, pl.py, q.x, q.z)) continue;
    best = q; bestD = d;
  }
  return best;
}

// M vuelve a I (y k baja 1) si pasaron MEM_T_OLVIDO s desde el último contacto.
export function decaer(p, tiempo) {
  const m = p.mem;
  if (m.est === 'M' && tiempo - m.tUlt >= MEM_T_OLVIDO) {
    m.est = 'I'; m.k = Math.max(1, m.k - 1); m.km = 0;
  }
}

// Actualiza la memoria según la reacción. `unidades` = lo que compró de verdad (puede ser menos que n si quedó poco stock).
export function aplicarReaccion(p, id, tiempo, unidades = 0) {
  const m = p.mem;
  m.tUlt = tiempo;
  if (id === 'comprar1' || id === 'comprar2') {
    m.est = 'C'; m.compras += unidades; m.kc = 0; m.k = 0; m.km = 0;
    if (m.compras >= MEM_C_MAX_COMPRAS) m.est = 'P';
    return;
  }
  if (id === 'insultar') { m.est = 'M'; m.km = 0; return; }
  if (id === 'llamado') { m.est = 'A'; return; }
  // ignorar o cortés
  if (m.est === 'N') { m.est = 'I'; m.k = 1; }
  else if (m.est === 'I') { m.k++; if (m.k >= MEM_K_MAX) m.est = 'P'; }
  else if (m.est === 'C') { m.kc++; if (m.kc >= MEM_C_MAX_OFERTAS) m.est = 'P'; }
  else if (m.est === 'M') { m.km++; if (m.km > MEM_M_MAX_OFERTAS) m.est = 'P'; }
}

// ---------- Reacciones ----------

// Multiplicador de la compra: DEMANDA del producto por el peso de demanda del momento del día (jornada.js).
export const multDemanda = (producto, dem = 1) => (DEMANDA[producto] ?? 1) * dem;

// Probabilidades [id, p] de cada reacción según la memoria (suman 1). Sin producto, el resultado es siempre 'ignorar'.
export function probsReaccion(p, { producto = null, dem = 1, tiempo = 0 } = {}) {
  if (!producto) return [['ignorar', 1]];
  const m = p.mem, mult = multDemanda(producto, dem);
  let pr;
  if (m.est === 'N') {
    pr = REACCIONES.map(r => [r.id, r.demanda ? r.peso * mult : r.peso]);
  } else if (m.est === 'I') {
    const k = Math.max(1, m.k);
    pr = [
      ['comprar1', clamp(MEM_COMPRA_BASE * MEM_COMPRA_DECAY ** (k - 1), MEM_COMPRA_MIN, MEM_COMPRA_BASE) * mult],
      ['insultar', Math.min(MEM_INSULTO_MAX, MEM_INSULTO_BASE + MEM_INSULTO_PASO * (k - 1))],
      ['llamado', k < MEM_LLAMADO_DESDE ? 0 : Math.min(MEM_LLAMADO_MAX, MEM_LLAMADO_PASO * (k - 2))],
      ['cortes', MEM_CORTES],
    ];
  } else if (m.est === 'C') {
    const kc = m.kc + 1;   // número de este ofrecimiento desde la última compra
    pr = [
      ['comprar1', Math.max(MEM_C_COMPRA_MIN, MEM_C_COMPRA_BASE * MEM_C_COMPRA_DECAY ** (kc - 1)) * mult],
      ['insultar', kc === 1 ? 0 : kc === 2 ? 0.2 : 0.4],
    ];
  } else if (m.est === 'M') {
    pr = [['insultar', MEM_M_INSULTO], ['llamado', MEM_M_LLAMADO], ['comprar1', MEM_M_COMPRA * mult]];
  } else {
    return [['ignorar', 1]];   // P y A: no son elegibles
  }
  // En N, 'ignorar' ya viene de REACCIONES; en I, C y M es el resto hasta 1. Si el total supera 1 se normaliza.
  if (m.est !== 'N') pr.push(['ignorar', Math.max(0, 1 - pr.reduce((s, e) => s + e[1], 0))]);
  const tot = pr.reduce((s, e) => s + e[1], 0) || 1;
  pr = pr.map(([id, w]) => [id, w / tot]);
  // Contagio por insulto cercano: sube el insulto y baja el ignorar en el mismo bono (no aplica a M, P ni A).
  if (['N', 'I', 'C'].includes(m.est) && tiempo - m.contagio < PEAT_CONTAGIO_T) {
    const ins = pr.find(e => e[0] === 'insultar'), ign = pr.find(e => e[0] === 'ignorar');
    if (ins && ign) {
      const baja = Math.min(PEAT_CONTAGIO_BONO, ign[1]);
      ins[1] += baja; ign[1] -= baja;
    }
  }
  return pr;
}

export function elegirReaccion(pr, rnd = Math.random) {
  let x = rnd();
  for (const [id, p] of pr) { x -= p; if (x < 0) return id; }
  return pr[pr.length - 1][0];
}

// Elige la reacción de un peatón al ofrecer (decae M, calcula probabilidades y sortea). No cambia la memoria: eso lo hace aplicarReaccion.
export function reaccionPara(p, { producto = null, dem = 1, tiempo = 0, rnd = Math.random } = {}) {
  if (!producto) return 'ignorar';
  decaer(p, tiempo);
  return elegirReaccion(probsReaccion(p, { producto, dem, tiempo }), rnd);
}

// Insulto: los peatones cercanos (radio en celdas) quedan contagiados hasta tiempo + PEAT_CONTAGIO_T. Devuelve cuántos.
export function contagiarInsulto(peds, objetivo, tiempo, radio = PEAT_CONTAGIO_R) {
  let n = 0;
  for (const q of peds) {
    if (q === objetivo) continue;
    if (Math.hypot(q.x - objetivo.x, q.z - objetivo.z) > radio) continue;
    q.mem.contagio = tiempo; n++;
  }
  return n;
}

// ---------- Creación, reciclado y movimiento ----------

const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];

// Crea un peatón en una vereda. Con `cerca` (jugador) aparece a PEAT_SPAWN_MIN..MAX celdas de él; si no, en cualquier vereda.
export function crearPeaton(city, { cerca = null, rnd = Math.random } = {}) {
  let c = null;
  if (cerca) {
    const a = rnd() * Math.PI * 2, d = PEAT_SPAWN_MIN + rnd() * (PEAT_SPAWN_MAX - PEAT_SPAWN_MIN);
    c = celdaPeatonal(city, cerca.x + Math.cos(a) * d, cerca.z + Math.sin(a) * d, 4);
  }
  // La ciudad real trae puntos de vereda ya calculados (ciudad_real.js, puntosPeatones).
  if (!c && city.puntosPeaton?.length) c = pick(city.puntosPeaton, rnd);
  for (let intento = 0; intento < 200 && !c; intento++) {
    const n = ladoDe(city), i = Math.floor(rnd() * n), j = Math.floor(rnd() * n);
    if (city.C[j * n + i].t === 'side' && !city.C[j * n + i].deco) c = { i, j };
  }
  c = c ?? { i: 1, j: 1 };
  return { x: c.i + .5, z: c.j + .5, ruta: null, k: 0, pausa: 0, color: pick(COLORES_PEAT, rnd), tRuta: rnd() * 2, mem: memNueva() };
}

// Ajusta la cantidad de peatones (jornada). Los que quedaron lejos del jugador se reciclan (la memoria se pierde);
// si sobran, salen los más lejanos; si faltan, aparecen cerca del jugador. Devuelve cuántos se reciclaron.
export function ajustarPeatones(peds, city, cantidad, jugador, rnd = Math.random) {
  let reciclados = 0;
  for (let k = 0; k < peds.length; k++) {
    if (Math.hypot(peds[k].x - jugador.x, peds[k].z - jugador.z) > PEAT_LEJOS) {
      peds[k] = crearPeaton(city, { cerca: jugador, rnd }); reciclados++;
    }
  }
  const dist = p => Math.hypot(p.x - jugador.x, p.z - jugador.z);
  while (peds.length > cantidad) {
    let far = 0;
    for (let k = 1; k < peds.length; k++) if (dist(peds[k]) > dist(peds[far])) far = k;
    peds.splice(far, 1);
  }
  while (peds.length < cantidad) peds.push(crearPeaton(city, { cerca: jugador, rnd }));
  return reciclados;
}

// Caminan a un destino peatonal al azar; cada tanto se detienen (pausa) y reanudan. Máximo 2 rutas nuevas por paso.
export function stepPeatones(peds, city, dt, rnd = Math.random) {
  let bfs = 0;
  for (const p of peds) {
    if (p.pausa > 0) { p.pausa -= dt; continue; }
    if (p.ruta && p.k < p.ruta.length) {
      let budget = dt * PEAT_VEL;
      for (let g = 0; budget > 0 && g < 4 && p.k < p.ruta.length; g++) {
        const t = p.ruta[p.k], tx = t.i + .5, tz = t.j + .5, dx = tx - p.x, dz = tz - p.z, dist = Math.hypot(dx, dz);
        if (dist <= budget) { budget -= dist; p.x = tx; p.z = tz; p.k++; }
        else { p.x += dx / dist * budget; p.z += dz / dist * budget; budget = 0; }
      }
      continue;
    }
    p.tRuta -= dt;
    if (p.tRuta <= 0 && bfs < 2) {
      bfs++;
      p.tRuta = 3 + rnd() * 4;
      const dest = celdaPeatonal(city, p.x + (rnd() * 2 - 1) * 14, p.z + (rnd() * 2 - 1) * 14, 3);
      const o = celdaPeatonal(city, p.x, p.z, 2);
      p.ruta = o && dest ? buscarRuta(city, o, dest, { maxNodos: PEAT_RUTA_MAX_NODOS }) : null;
      p.k = 0;
    }
  }
}
