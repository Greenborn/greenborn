// Vehículos de la búsqueda (busqueda.js): patrullas por calles y helicóptero. Sin DOM: lógica pura (tools/test_busqueda.mjs).
// Vehículos genéricos y ficticios, sin logos ni colores de fuerzas reales (LEGAL.md). Los conecta agentes.js (nivel de búsqueda).
//
// Patrulla: circula solo por celdas 'road' (no entra a veredas ni parques). Más rápida que un agente a pie en recta
// (VEH_VEL_RECTA) y más lenta al girar (VEH_VEL_GIRO durante VEH_T_GIRO s tras cada cambio de dirección). Va a cortar el paso:
// apunta a la calle más cercana a un punto VEH_ADELANTE celdas delante del jugador. Captura solo si el jugador está en la calle
// a menos de VEH_CAPTURA. En el juego la ruta sale del A* de rutas.js (planificador con presupuesto) que agentes.js
// pasa en opts.ruta; por defecto usa rutaCalle (BFS por calles). opts.meta: lo que la patrulla sabe del jugador (última posición vista).
//
// Helicóptero: ignora obstáculos y sigue al jugador desde arriba a HELI_VEL (menor que correr, mayor que caminar), con un
// círculo de visión HELI_R en el suelo. No captura: mientras te ve, marca tu posición (los perseguidores no te pierden y el
// contador para zafar no avanza). Corriendo se puede salir del círculo, y se retira a los HELI_T_ESCENA s (si no, a 5
// estrellas caminando nunca se podría zafar: el helicóptero va más rápido que caminar).

export const VEH_VEL_RECTA = 8.5, VEH_VEL_GIRO = 2.5, VEH_T_GIRO = 0.6;
export const VEH_ADELANTE = 6, VEH_CAPTURA = 0.7, VEH_T_RUTA = 0.8;
export const HELI_VEL = 6.2, HELI_R = 7, HELI_ALTURA = 6;
export const HELI_T_ESCENA = 30;   // s que el helicóptero queda en escena por cada llegada (después se retira aunque siga el nivel 5)

const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const esCalle = (city, i, j) => {
  const n = city.N ?? Math.sqrt(city.C.length);
  return i >= 0 && j >= 0 && i < n && j < n && city.C[j * n + i].t === 'road';
};

// Calle más cercana (anillos) a (x, z), o null.
export function calleCerca(city, x, z, rMax = 8) {
  const ci = Math.floor(x), cj = Math.floor(z);
  for (let r = 0; r <= rMax; r++)
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      if (esCalle(city, ci + di, cj + dj)) return { i: ci + di, j: cj + dj };
    }
  return null;
}

// BFS 4-direcciones solo por calles. Pasos sin el origen; [] si ya está; null si no hay camino.
export function rutaCalle(city, a, b) {
  const n = city.N ?? Math.sqrt(city.C.length);
  const s = a.j * n + a.i, g = b.j * n + b.i;
  if (s === g) return [];
  const prev = new Int32Array(n * n).fill(-1); prev[s] = s;
  const q = [s];
  for (let h = 0; h < q.length && prev[g] === -1; h++) {
    const c = q[h], ci = c % n, cj = (c - ci) / n;
    for (const [di, dj] of DIRS4) {
      const ni = ci + di, nj = cj + dj;
      if (!esCalle(city, ni, nj)) continue;
      const k = nj * n + ni;
      if (prev[k] === -1) { prev[k] = c; q.push(k); }
    }
  }
  if (prev[g] === -1) return null;
  const out = [];
  for (let k = g; k !== s; k = prev[k]) out.push({ i: k % n, j: (k - k % n) / n });
  return out.reverse();
}

// Vista de la ciudad con solo la red de calles principal (componente conexa más grande, 4 direcciones): las patrullas
// nunca quedan en un tramo aislado. Misma forma que city ({ N, C, pasa }), así sirve para rutas.js. Se arma una vez por ciudad.
const cacheCalles = new WeakMap();
export function ciudadCalles(city) {
  let cc = cacheCalles.get(city);
  if (cc) return cc;
  const n = city.N ?? Math.sqrt(city.C.length), comp = new Int32Array(n * n), cola = new Int32Array(n * n);
  let mejor = 0, mejorN = 0, id = 0;
  for (let s = 0; s < n * n; s++) {
    if (comp[s] || city.C[s].t !== 'road') continue;
    comp[s] = ++id; cola[0] = s;
    let t = 1;
    for (let h = 0; h < t; h++) {
      const c = cola[h], ci = c % n, cj = (c - ci) / n;
      for (const [di, dj] of DIRS4) {
        const ni = ci + di, nj = cj + dj, k = nj * n + ni;
        if (esCalle(city, ni, nj) && !comp[k]) { comp[k] = id; cola[t++] = k; }
      }
    }
    if (t > mejorN) { mejorN = t; mejor = id; }
  }
  const fuera = { t: 'side', deco: null }, C = new Array(n * n), pasa = new Uint8Array(n * n);
  for (let k = 0; k < n * n; k++) { const ok = mejor > 0 && comp[k] === mejor; C[k] = ok ? city.C[k] : fuera; pasa[k] = ok ? 1 : 0; }
  cc = { N: n, C, pasa };
  cacheCalles.set(city, cc);
  return cc;
}

export function crearPatrulla(city, x, z) {
  const c = calleCerca(city, x, z, 12) ?? { i: 0, j: 0 };
  return { tipo: 'patrulla', x: c.i + .5, z: c.j + .5, yaw: 0, dir: null, tGiro: 0, ruta: null, k: 0, tRuta: 0 };
}

// Punto de corte: calle más cercana a VEH_ADELANTE celdas delante del jugador (pl: { px, py, heading }).
// Ya cerca (menos de VEH_ADELANTE + 2), va directo a la calle del jugador.
export function objetivoCorte(city, pl, v = null, adel = VEH_ADELANTE) {
  if (v && Math.hypot(pl.px - v.x, pl.py - v.z) < adel + 2) return calleCerca(city, pl.px, pl.py, 10);
  const x = pl.px + Math.sin(pl.heading) * adel, z = pl.py + Math.cos(pl.heading) * adel;
  return calleCerca(city, x, z, 8) ?? calleCerca(city, pl.px, pl.py, 10);
}

// Un paso de la patrulla. opts.ruta(city, a, b, v): buscador de rutas (por defecto rutaCalle); si devuelve undefined, la ruta
// llegará después (planificador encolado: la asigna quien la pidió) y mientras sigue la anterior. opts.presupuesto: { bfs }
// compartido por frame (si llega a 0 no recalcula). opts.meta: { px, py, heading, visto, adel } lo que la patrulla sabe del
// jugador: viéndolo va a cortarle el paso; sin verlo va a la última posición vista. Sin meta, usa pl. Devuelve { captura } (true si alcanzó al jugador parado en la calle).
export function stepPatrulla(v, city, pl, dt, opts = {}) {
  const ruta = opts.ruta ?? rutaCalle, pres = opts.presupuesto ?? { bfs: Infinity };
  v.tRuta -= dt;
  if ((v.tRuta <= 0 || !v.ruta || v.k >= v.ruta.length) && pres.bfs > 0) {
    pres.bfs--; v.tRuta = VEH_T_RUTA;
    const m = opts.meta, o = calleCerca(city, v.x, v.z, 2);
    const t = !m ? objetivoCorte(city, pl, v) : m.visto ? objetivoCorte(city, m, v, m.adel ?? VEH_ADELANTE) : calleCerca(city, m.px, m.py, 10);
    const r = o && t ? ruta(city, o, t, v) : null;
    if (r !== undefined) { v.ruta = r; v.k = 0; }
  }
  if (v.tGiro > 0) v.tGiro -= dt;
  let budget = dt * (v.tGiro > 0 ? VEH_VEL_GIRO : VEH_VEL_RECTA);
  for (let g = 0; budget > 0 && g < 8 && v.ruta && v.k < v.ruta.length; g++) {
    const t = v.ruta[v.k], tx = t.i + .5, tz = t.j + .5, dx = tx - v.x, dz = tz - v.z, d = Math.hypot(dx, dz);
    if (d > 1e-4) {
      const dir = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'E' : 'O') : (dz > 0 ? 'S' : 'N');
      if (v.dir && dir !== v.dir) { v.tGiro = VEH_T_GIRO; budget = Math.min(budget, dt * VEH_VEL_GIRO); }
      v.dir = dir; v.yaw = Math.atan2(dx, dz);
    }
    const paso = Math.min(d, budget), nx = d <= budget ? tx : v.x + dx / d * paso, nz = d <= budget ? tz : v.z + dz / d * paso;
    if (!esCalle(city, Math.floor(nx), Math.floor(nz))) { v.ruta = null; v.tRuta = 0; break; }   // nunca sale de la calle
    v.x = nx; v.z = nz; budget -= paso;
    if (d <= paso) v.k++;
  }
  const enCalle = esCalle(city, Math.floor(pl.px), Math.floor(pl.py));
  return { captura: enCalle && Math.hypot(pl.px - v.x, pl.py - v.z) < VEH_CAPTURA };
}

export const crearHeli = (x, z) => ({ tipo: 'heli', x, z, ve: false, t: HELI_T_ESCENA, activo: true });

// Vuela en línea recta (sin obstáculos) hacia meta ({ px, py }, por defecto el jugador; agentes.js pasa la última posición
// vista cuando no lo ve). Devuelve true si el jugador está dentro del círculo de visión.
export function stepHeli(h, pl, dt, meta = pl) {
  if (h.activo) { h.t -= dt; if (h.t <= 0) h.activo = false; }
  if (!h.activo) { h.ve = false; return false; }
  const dx = meta.px - h.x, dz = meta.py - h.z, d = Math.hypot(dx, dz);
  if (d > 1e-4) { const m = Math.min(d, HELI_VEL * dt); h.x += dx / d * m; h.z += dz / d * m; }
  h.ve = Math.hypot(pl.px - h.x, pl.py - h.z) <= HELI_R;
  return h.ve;
}
