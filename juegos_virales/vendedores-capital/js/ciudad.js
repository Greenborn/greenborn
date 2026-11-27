// Grilla de la ciudad 2D: generación propia con semilla fija. Sin DOM, para poder probarla en Node.
// Cada celda es { t, deco, rCol }:
//   t: 'road' (calle, 2 celdas), 'side' (vereda, anillo de 1 celda de cada manzana), 'bld' (edificio), 'park' (plaza verde)
//   deco: 'tree' o null. rCol: radio del tronco (celdas) si es árbol.
// city.zona (Uint8Array por celda, índice j * N + i) indica el barrio de cada celda (barrios.js, zonaDe). Es una
// regla fija sobre la grilla: no usa el generador aleatorio, así que la semilla sigue dando la misma ciudad.
import { zonaDe } from './barrios.js';
import { esquinasDeCruces } from './busqueda.js';

export const N = 132;            // celdas por lado (6 ciclos de 22)
export const MANZANA = 20;       // lado de la manzana (vereda incluida)
export const CALLE = 2;          // ancho de la calle entre manzanas
export const CICLO = MANZANA + CALLE;
export const SEMILLA = 20260417;

// Generador pseudoaleatorio determinista (LCG): la misma semilla da siempre la misma ciudad.
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function generarCiudad(seed = SEMILLA) {
  const rand = rng(seed);
  const nb = N / CICLO;                       // manzanas por lado
  const parque = new Uint8Array(nb * nb);
  for (let k = 0; k < parque.length; k++) parque[k] = rand() < 0.12 ? 1 : 0;
  const C = new Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const ti = i % CICLO, tj = j % CICLO;
    let c;
    if (ti >= MANZANA || tj >= MANZANA) {
      c = { t: 'road', deco: null };
    } else {
      const borde = ti === 0 || tj === 0 || ti === MANZANA - 1 || tj === MANZANA - 1;
      const bi = Math.floor(i / CICLO), bj = Math.floor(j / CICLO);
      const esParque = parque[bj * nb + bi] === 1;
      if (borde) c = { t: 'side', deco: null };
      else c = { t: esParque ? 'park' : 'bld', deco: null };
      // Árboles: en veredas (sin esquinas de la manzana) y en parques. Nunca en los dos primeros tramos de vereda de la esquina.
      const esquina = (ti === 0 || ti === MANZANA - 1) && (tj === 0 || tj === MANZANA - 1);
      if (!esquina && (c.t === 'side' && rand() < 0.05 || c.t === 'park' && rand() < 0.3)) {
        c.deco = 'tree'; c.rCol = 0.25 + rand() * 0.1;
      }
    }
    C[j * N + i] = c;
  }
  // Bordes del recorte: calles exteriores ya son 'road'; el obstáculo de borde lo maneja obstaculoEn.
  // Barrio por celda: regla fija de la grilla 3 x 3 (no consume números aleatorios).
  const zona = new Uint8Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) zona[j * N + i] = zonaDe(i, j, N);
  return { C, N, seed, zona };
}

// Las funciones de abajo sirven para la ciudad procedural (N = 132) y para la real (ciudad_real.js, N = 600): usan
// city.N (o la constante N si falta) y city.pasa (máscara de celdas caminables) si existe. 'water' no es caminable.
const nDe = city => city.N ?? N;
// Celdas por lado de cualquier ciudad (procedural, real o sintética de prueba).
export const ladoDe = nDe;

// Barrio de la celda (i, j).
export function zonaEn(city, i, j) {
  return city.zona[j * nDe(city) + i];
}

// Celda caminable para jugador y peatones: todo menos edificios, agua y árboles.
export function walkable(city, i, j) {
  const n = nDe(city);
  if (i < 0 || j < 0 || i >= n || j >= n) return false;
  if (city.pasa) return city.pasa[j * n + i] === 1;
  const c = city.C[j * n + i];
  return c.t !== 'bld' && c.t !== 'water' && !c.deco;
}

// Celda caminable más cercana a (x, z) buscando en anillos hasta rMax. null si no hay.
export function celdaPeatonal(city, x, z, rMax) {
  const ci = Math.floor(x), cj = Math.floor(z);
  for (let r = 0; r <= rMax; r++)
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      if (walkable(city, ci + di, cj + dj)) return { i: ci + di, j: cj + dj };
    }
  return null;
}

// Celda caminable más cercana (distancia euclídea al centro de la celda) a (x, z) dentro de un cuadrado de radio rMax.
// Usada para ubicar al jugador al elegir barrio. null si no hay ninguna.
export function celdaCaminableMasCerca(city, x, z, rMax) {
  const ci = Math.floor(x), cj = Math.floor(z);
  let mejor = null, mejorD = Infinity;
  for (let dj = -rMax; dj <= rMax; dj++) for (let di = -rMax; di <= rMax; di++) {
    const i = ci + di, j = cj + dj;
    if (!walkable(city, i, j)) continue;
    const d = (i + .5 - x) ** 2 + (j + .5 - z) ** 2;
    if (d < mejorD) { mejorD = d; mejor = { i, j }; }
  }
  return mejor;
}

// Camino más corto (BFS 4-direcciones sobre celdas caminables). Devuelve pasos sin el origen, [] si ya está, o null.
// Búferes reutilizados con marca por generación (no se reserva memoria por llamada). Orden de vecinos fijo: +x, -x, +z, -z.
let bfsPrev = null, bfsMarca = null, bfsCola = null, bfsGen = 0;
export function pedPath(city, a, b) {
  const n = nDe(city), NN = n * n, start = a.j * n + a.i, goal = b.j * n + b.i;
  if (start === goal) return [];
  if (!walkable(city, b.i, b.j)) return null;
  if (!bfsPrev || bfsPrev.length !== NN) { bfsPrev = new Int32Array(NN); bfsMarca = new Uint32Array(NN); bfsCola = new Int32Array(NN); bfsGen = 0; }
  const g = ++bfsGen;
  bfsMarca[start] = g; bfsPrev[start] = start;
  let h = 0, t = 0; bfsCola[t++] = start;
  while (h < t && bfsMarca[goal] !== g) {
    const cur = bfsCola[h++], ci = cur % n, cj = (cur - ci) / n;
    for (let d = 0; d < 4; d++) {
      const ni = ci + (d === 0 ? 1 : d === 1 ? -1 : 0), nj = cj + (d === 2 ? 1 : d === 3 ? -1 : 0), k = nj * n + ni;
      if (walkable(city, ni, nj) && bfsMarca[k] !== g) { bfsMarca[k] = g; bfsPrev[k] = cur; bfsCola[t++] = k; }
    }
  }
  if (bfsMarca[goal] !== g) return null;
  const path = [];
  for (let k = goal; k !== start; k = bfsPrev[k]) path.push({ i: k % n, j: (k - k % n) / n });
  return path.reverse();
}

// Línea de visión por DDA (Amanatides-Woo): bloquea cualquier edificio entre los dos puntos. Árboles y agua no bloquean la vista.
export function lineaLibre(city, x0, z0, x1, z1) {
  const n = nDe(city);
  let i = Math.floor(x0), j = Math.floor(z0);
  const i1 = Math.floor(x1), j1 = Math.floor(z1), dx = x1 - x0, dz = z1 - z0;
  const si = dx > 0 ? 1 : -1, sj = dz > 0 ? 1 : -1;
  const tdx = dx !== 0 ? Math.abs(1 / dx) : Infinity, tdz = dz !== 0 ? Math.abs(1 / dz) : Infinity;
  let tmx = dx > 0 ? (i + 1 - x0) * tdx : dx < 0 ? (x0 - i) * tdx : Infinity;
  let tmz = dz > 0 ? (j + 1 - z0) * tdz : dz < 0 ? (z0 - j) * tdz : Infinity;
  for (let g = 0; g < 4 * n && (i !== i1 || j !== j1); g++) {
    if (tmx < tmz) { i += si; tmx += tdx; } else { j += sj; tmz += tdz; }
    if (i < 0 || j < 0 || i >= n || j >= n) return false;
    if (city.C[j * n + i].t === 'bld') return false;
  }
  return true;
}

// Colisión física: ¿el punto (x, y), en celdas, queda dentro de un obstáculo ensanchado por R_JUG?
// Árbol: círculo de su tronco. Edificio y agua: la celda entera. Borde del recorte: bloqueado.
export const R_JUG = 0.05;
export function obstaculoEn(city, x, y) {
  const n = nDe(city);
  if (x < R_JUG || y < R_JUG || x > n - R_JUG || y > n - R_JUG) return true;
  const i0 = Math.floor(x), j0 = Math.floor(y);
  for (let j = j0 - 1; j <= j0 + 1; j++) for (let i = i0 - 1; i <= i0 + 1; i++) {
    if (i < 0 || j < 0 || i >= n || j >= n) continue;
    const c = city.C[j * n + i];
    if (c.deco === 'tree') {
      const dx = x - (i + .5), dy = y - (j + .5), r = (c.rCol ?? 0.05) + R_JUG;
      if (dx * dx + dy * dy < r * r) return true;
    } else if (c.t === 'bld' || c.t === 'water') {
      if (x + R_JUG > i && x - R_JUG < i + 1 && y + R_JUG > j && y - R_JUG < j + 1) return true;
    }
  }
  return false;
}

// Puntos de patrulla de los agentes: uno en cada esquina. La ciudad real trae las suyas (city.esquinas, de ciudad_real.js);
// la procedural pone una por cruce de calles, sobre la vereda.
export function esquinasAgentes(city) {
  if (city.esquinas) return city.esquinas.map(e => ({ ...e }));
  return esquinasDeCruces(city, CICLO, MANZANA, walkable);
}
