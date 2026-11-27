// Pathfinding de los agentes de control: A* en grilla de 8 direcciones (heurística octil, sin cortar esquinas),
// búsqueda encolada con presupuesto de nodos por frame, suavizado por línea de visión (string pulling) y una
// línea "caminable" propia. Sin DOM: se prueba en Node (tools/test_rutas.mjs).
// Solo depende de la interfaz de la ciudad: city.C[k].t / city.C[k].deco (k = j * N + i) y city.N (si falta se deduce
// de C.length). Una ciudad puede traer su propia máscara city.pasa (Uint8Array, 1 = caminable) y se usa tal cual.
import { RUTA_MAX_NODOS, RUTA_MARGEN } from './config.js';

const SQ2 = Math.SQRT2;
const DI = [1, -1, 0, 0, 1, 1, -1, -1], DJ = [0, 0, 1, -1, 1, -1, 1, -1];
const COSTO = [1, 1, 1, 1, SQ2, SQ2, SQ2, SQ2];

// Máscara de celdas caminables por ciudad (se arma una vez y se cachea). Mismo criterio que walkable de ciudad.js
// (sin edificio ni árbol), más agua por si la ciudad real la trae.
const grillas = new WeakMap();
export function grillaDe(city) {
  let g = grillas.get(city);
  if (g) return g;
  const N = city.N ?? Math.round(Math.sqrt(city.C.length));
  let pasa = city.pasa;
  if (!(pasa instanceof Uint8Array) || pasa.length !== N * N) {
    pasa = new Uint8Array(N * N);
    for (let k = 0; k < N * N; k++) { const c = city.C[k]; pasa[k] = c && c.t !== 'bld' && c.t !== 'water' && !c.deco ? 1 : 0; }
  }
  g = { N, pasa };
  grillas.set(city, g);
  return g;
}
// Si la ciudad cambia (pruebas, obras), hay que olvidar la máscara cacheada.
export function invalidarGrilla(city) { grillas.delete(city); }

const libre = (g, i, j) => i >= 0 && j >= 0 && i < g.N && j < g.N && g.pasa[j * g.N + i] === 1;

// DDA de un solo rayo: true si todas las celdas tocadas son caminables. Si pasa justo por una esquina, exige las dos
// celdas laterales (no se cuela en diagonal entre dos obstáculos).
function rayoLibre(g, x0, z0, x1, z1) {
  let i = Math.floor(x0), j = Math.floor(z0);
  const i1 = Math.floor(x1), j1 = Math.floor(z1);
  if (!libre(g, i, j) || !libre(g, i1, j1)) return false;
  const dx = x1 - x0, dz = z1 - z0, si = dx > 0 ? 1 : -1, sj = dz > 0 ? 1 : -1;
  const tdx = dx !== 0 ? Math.abs(1 / dx) : Infinity, tdz = dz !== 0 ? Math.abs(1 / dz) : Infinity;
  let tmx = dx > 0 ? (i + 1 - x0) * tdx : dx < 0 ? (x0 - i) * tdx : Infinity;
  let tmz = dz > 0 ? (j + 1 - z0) * tdz : dz < 0 ? (z0 - j) * tdz : Infinity;
  const tope = Math.abs(i1 - i) + Math.abs(j1 - j) + 2;
  for (let s = 0; s < tope && (i !== i1 || j !== j1); s++) {
    if (Math.abs(tmx - tmz) < 1e-9) {
      if (!libre(g, i + si, j) || !libre(g, i, j + sj)) return false;
      i += si; j += sj; tmx += tdx; tmz += tdz;
    } else if (tmx < tmz) { i += si; tmx += tdx; } else { j += sj; tmz += tdz; }
    if (!libre(g, i, j)) return false;
  }
  return true;
}

// Línea caminable entre dos puntos (celdas, con decimales): el rayo central y dos paralelos a ±margen deben pasar.
// El margen deja aire contra las esquinas de los edificios. Distinta de lineaLibre (vista): acá los árboles sí bloquean.
export function lineaCaminable(city, x0, z0, x1, z1, margen = RUTA_MARGEN) {
  const g = grillaDe(city);
  if (!rayoLibre(g, x0, z0, x1, z1)) return false;
  const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz);
  if (l < 1e-9 || margen <= 0) return true;
  const nx = -dz / l * margen, nz = dx / l * margen;
  return rayoLibre(g, x0 + nx, z0 + nz, x1 + nx, z1 + nz) && rayoLibre(g, x0 - nx, z0 - nz, x1 - nx, z1 - nz);
}

// Suavizado (string pulling). celdas[0] es el origen; devuelve los puntos de paso sin el origen (subconjunto de celdas,
// con el último siempre incluido). Primero quita los puntos colineales, luego une esquinas con línea caminable.
// Como cada atajo es una recta entre puntos de la poligonal, la ruta nunca se alarga.
export function suavizar(city, celdas, margen = RUTA_MARGEN) {
  const n = celdas.length;
  if (n <= 2) return celdas.slice(1);
  const esq = [celdas[0]];
  for (let k = 1; k < n - 1; k++) {
    const a = celdas[k - 1], b = celdas[k], c = celdas[k + 1];
    if (b.i - a.i !== c.i - b.i || b.j - a.j !== c.j - b.j) esq.push(b);
  }
  esq.push(celdas[n - 1]);
  const out = [];
  let ancla = esq[0];
  for (let k = 2; k < esq.length; k++) {
    const p = esq[k];
    if (!lineaCaminable(city, ancla.i + .5, ancla.j + .5, p.i + .5, p.j + .5, margen)) { ancla = esq[k - 1]; out.push(ancla); }
  }
  out.push(esq[esq.length - 1]);
  return out;
}

// Longitud de una ruta (origen + puntos de paso) en celdas.
export function largoRuta(origen, pasos) {
  let l = 0, a = origen;
  for (const b of pasos) { l += Math.hypot(b.i - a.i, b.j - a.j); a = b; }
  return l;
}

// Estado de búsqueda A* reutilizable: arrays tipados del tamaño de la grilla, heap binario indexado (con decrease-key)
// y marca por generación (est[k] = 2·gen si está abierto, 2·gen + 1 si está cerrado; cualquier otro valor = sin visitar).
function crearBuscador(N) {
  const M = N * N;
  return {
    N, g: new Float64Array(M), f: new Float64Array(M), padre: new Int32Array(M), est: new Uint32Array(M),
    heap: new Int32Array(M), pos: new Int32Array(M), n: 0, gen: 0,
    start: -1, goal: -1, gi: 0, gj: 0, expand: 0, maxNodos: 0, activo: false,
  };
}
const menor = (B, a, b) => B.f[a] < B.f[b] || (B.f[a] === B.f[b] && B.g[a] > B.g[b]);   // empate: el más avanzado
function subir(B, x) {
  const H = B.heap; let i = B.pos[x];
  while (i > 0) { const p = (i - 1) >> 1, y = H[p]; if (!menor(B, x, y)) break; H[i] = y; B.pos[y] = i; i = p; }
  H[i] = x; B.pos[x] = i;
}
function sacar(B) {
  const H = B.heap, top = H[0], x = H[--B.n];
  if (B.n > 0) {
    let i = 0;
    for (;;) {
      let c = 2 * i + 1; if (c >= B.n) break;
      if (c + 1 < B.n && menor(B, H[c + 1], H[c])) c++;
      if (!menor(B, H[c], x)) break;
      H[i] = H[c]; B.pos[H[i]] = i; i = c;
    }
    H[i] = x; B.pos[x] = i;
  }
  return top;
}
const octil = (B, i, j) => { const dx = Math.abs(i - B.gi), dz = Math.abs(j - B.gj); return dx + dz + (SQ2 - 2) * Math.min(dx, dz); };

function iniciar(B, pasa, a, b, maxNodos) {
  const N = B.N;
  B.gen++; B.n = 0; B.expand = 0; B.maxNodos = maxNodos; B.activo = true;
  B.start = a.j * N + a.i; B.goal = b.j * N + b.i; B.gi = b.i; B.gj = b.j;
  const s = B.start, o = B.gen * 2;
  B.est[s] = o; B.g[s] = 0; B.f[s] = octil(B, a.i, a.j); B.padre[s] = s;
  B.heap[0] = s; B.pos[s] = 0; B.n = 1;
  if (!pasa[B.goal]) B.n = 0;                                   // destino no caminable: sin camino
}

// Expande hasta `presu` nodos. Devuelve { usados, fin } con fin = 'ok' | 'sin' | null (sigue pendiente).
function avanzar(B, pasa, presu) {
  const N = B.N, abierto = B.gen * 2, cerrado = abierto + 1, est = B.est, g = B.g;
  let usados = 0;
  while (usados < presu) {
    if (B.n === 0 || B.expand >= B.maxNodos) { B.activo = false; return { usados, fin: 'sin' }; }
    const cur = sacar(B);
    est[cur] = cerrado; usados++; B.expand++;
    if (cur === B.goal) { B.activo = false; return { usados, fin: 'ok' }; }
    const ci = cur % N, cj = (cur - ci) / N, gc = g[cur];
    for (let d = 0; d < 8; d++) {
      const ni = ci + DI[d], nj = cj + DJ[d];
      if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
      const k = nj * N + ni;
      if (!pasa[k] || est[k] === cerrado) continue;
      if (d >= 4 && (!pasa[cj * N + ni] || !pasa[nj * N + ci])) continue;   // no cortar esquinas
      const ng = gc + COSTO[d];
      if (est[k] !== abierto) {
        est[k] = abierto; g[k] = ng; B.f[k] = ng + octil(B, ni, nj); B.padre[k] = cur;
        B.pos[k] = B.n; B.heap[B.n++] = k; subir(B, k);
      } else if (ng < g[k] - 1e-9) {
        g[k] = ng; B.f[k] = ng + octil(B, ni, nj); B.padre[k] = cur; subir(B, k);
      }
    }
  }
  return { usados, fin: null };
}

function reconstruir(B) {
  const N = B.N, out = [];
  for (let k = B.goal; k !== B.start; k = B.padre[k]) out.push({ i: k % N, j: (k - k % N) / N });
  out.push({ i: B.start % N, j: (B.start - B.start % N) / N });
  return out.reverse();                                           // incluye el origen
}

// Búsqueda síncrona (pruebas, mediciones). Devuelve celdas sin el origen ([] si ya está, null si no hay camino).
// opts.suave: true devuelve los puntos de paso suavizados. opts.maxNodos: tope de expansiones.
const buscadoresSync = new WeakMap();
export function buscarRuta(city, a, b, opts = {}) {
  const grid = grillaDe(city);
  let B = buscadoresSync.get(grid);
  if (!B) { B = crearBuscador(grid.N); buscadoresSync.set(grid, B); }
  if (a.i === b.i && a.j === b.j) return [];
  iniciar(B, grid.pasa, a, b, opts.maxNodos ?? RUTA_MAX_NODOS);
  const r = avanzar(B, grid.pasa, Infinity);
  if (opts.stats) opts.stats.expandidos = r.usados;
  if (r.fin !== 'ok') return null;
  const celdas = reconstruir(B);
  return opts.suave ? suavizar(city, celdas) : celdas.slice(1);
}

// Planificador encolado con presupuesto: los pedidos se atienden de a uno (prioridad menor primero, FIFO dentro de la
// misma prioridad) y una búsqueda larga puede seguir en el frame siguiente. procesar(presu) nunca expande más de presu.
// pedido: { a, b, prio, cb(ruta|null), vigente?() }. La ruta entregada ya está suavizada (sin el origen).
export function crearPlanificador(city, opts = {}) {
  let grid = null, B = null, actual = null;
  const cola = [];
  const maxNodos = opts.maxNodos ?? RUTA_MAX_NODOS;
  const stats = { pedidos: 0, resueltos: 0, sinCamino: 0, descartados: 0, maxFrame: 0, ultimoFrame: 0 };
  const listo = () => { if (!grid) { grid = grillaDe(city); B = crearBuscador(grid.N); } };
  function pedir(p) {
    stats.pedidos++;
    let k = cola.length;
    while (k > 0 && (cola[k - 1].prio ?? 0) > (p.prio ?? 0)) k--;
    cola.splice(k, 0, p);
  }
  function entregar(p, ruta) { if (ruta) stats.resueltos++; else stats.sinCamino++; p.cb(ruta); }
  function procesar(presu) {
    listo();
    let usados = 0;
    while (usados < presu) {
      if (actual && actual.vigente && !actual.vigente()) { stats.descartados++; actual = null; B.activo = false; }
      if (!actual) {
        if (!cola.length) break;
        const p = cola.shift();
        if (p.vigente && !p.vigente()) { stats.descartados++; continue; }
        if (p.a.i === p.b.i && p.a.j === p.b.j) { entregar(p, []); continue; }
        actual = p; iniciar(B, grid.pasa, p.a, p.b, p.maxNodos ?? maxNodos);
      }
      const r = avanzar(B, grid.pasa, presu - usados);
      usados += r.usados;
      if (r.fin) { const p = actual; actual = null; entregar(p, r.fin === 'ok' ? suavizar(city, reconstruir(B)) : null); }
    }
    stats.ultimoFrame = usados; if (usados > stats.maxFrame) stats.maxFrame = usados;
    return usados;
  }
  const pendientes = () => cola.length + (actual ? 1 : 0);
  function vaciar() { cola.length = 0; actual = null; if (B) B.activo = false; }
  return { pedir, procesar, pendientes, vaciar, stats };
}
