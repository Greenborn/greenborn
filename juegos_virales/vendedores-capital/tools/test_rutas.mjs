// Pruebas headless de rutas.js (A* octil, suavizado, presupuesto por frame) y mediciones de rendimiento. Sin DOM.
// Uso: node 2d/tools/test_rutas.mjs
import { generarCiudad, N as N_CIUDAD, walkable } from '../js/ciudad.js';
import { buscarRuta, suavizar, largoRuta, lineaCaminable, crearPlanificador, grillaDe } from '../js/rutas.js';
import { crearSimulacion, stepAgentes, POLI_T_RUTA, POLI_MAX_PERS } from '../js/agentes.js';
import { RUTA_NODOS_FRAME } from '../js/config.js';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre + (extra ? ' (' + extra + ')' : ''));
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}

// Ciudad sintética desde filas de texto ('#' edificio, '.' calle).
function desdeTexto(filas) {
  const N = Math.max(filas.length, filas[0].length);
  const C = new Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) C[j * N + i] = { t: (filas[j]?.[i] ?? '#') === '#' ? 'bld' : 'road', deco: null };
  return { C, N };
}
function vacia(N) { const C = new Array(N * N); for (let k = 0; k < C.length; k++) C[k] = { t: 'road', deco: null }; return { C, N }; }
// Damero: edificios de `b` x `b` separados por calles de `s`.
function damero(N, b = 16, s = 3) {
  const C = new Array(N * N), ciclo = b + s;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) C[j * N + i] = { t: (i % ciclo) < b && (j % ciclo) < b ? 'bld' : 'road', deco: null };
  return { C, N };
}
// Dijkstra de referencia (8 direcciones, sin cortar esquinas), O(N² log) simple con array.
function dijkstra(city, a, b) {
  const g = grillaDe(city), N = g.N, D = new Float64Array(N * N).fill(Infinity), hecho = new Uint8Array(N * N);
  D[a.j * N + a.i] = 0;
  const abiertos = [a.j * N + a.i];
  while (abiertos.length) {
    let mi = 0; for (let x = 1; x < abiertos.length; x++) if (D[abiertos[x]] < D[abiertos[mi]]) mi = x;
    const cur = abiertos.splice(mi, 1)[0];
    if (hecho[cur]) continue; hecho[cur] = 1;
    const ci = cur % N, cj = (cur - ci) / N;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = ci + di, nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= N || nj >= N || !g.pasa[nj * N + ni]) continue;
      if (di && dj && (!g.pasa[cj * N + ni] || !g.pasa[nj * N + ci])) continue;
      const k = nj * N + ni, nd = D[cur] + (di && dj ? Math.SQRT2 : 1);
      if (nd < D[k] - 1e-12) { D[k] = nd; abiertos.push(k); }
    }
  }
  return D[b.j * N + b.i];
}
// BFS 4 direcciones como el pedPath anterior (con N propio), para medir el "antes" en mapas de otro tamaño.
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function bfsViejo(city, a, b) {
  const N = city.N, start = a.j * N + a.i, goal = b.j * N + b.i;
  const prev = new Int32Array(N * N).fill(-1); prev[start] = start;
  const q = [start];
  for (let h = 0; h < q.length && prev[goal] === -1; h++) {
    const cur = q[h], ci = cur % N, cj = (cur - ci) / N;
    for (const [di, dj] of DIRS4) {
      const ni = ci + di, nj = cj + dj, k = nj * N + ni;
      if (ni >= 0 && nj >= 0 && ni < N && nj < N && city.C[k].t !== 'bld' && !city.C[k].deco && prev[k] === -1) { prev[k] = cur; q.push(k); }
    }
  }
  return prev[goal] !== -1;
}
const pasaCelda = (city, i, j) => grillaDe(city).pasa[j * grillaDe(city).N + i] === 1;
const sinCortes = (city, a, celdas) => {
  let p = a;
  for (const c of celdas) {
    const di = c.i - p.i, dj = c.j - p.j;
    if (Math.max(Math.abs(di), Math.abs(dj)) !== 1 || !pasaCelda(city, c.i, c.j)) return false;
    if (di && dj && (!pasaCelda(city, p.i + di, p.j) || !pasaCelda(city, p.i, p.j + dj))) return false;
    p = c;
  }
  return true;
};
// El suavizado no atraviesa obstáculos: muestreo denso de cada tramo con un pequeño margen lateral.
function tramoLibre(city, a, b) {
  const ax = a.i + .5, az = a.j + .5, bx = b.i + .5, bz = b.j + .5, l = Math.hypot(bx - ax, bz - az), n = Math.ceil(l * 50) + 1;
  for (let s = 0; s <= n; s++) {
    const x = ax + (bx - ax) * s / n, z = az + (bz - az) * s / n;
    for (const [ox, oz] of [[0, 0], [0.05, 0.05], [-0.05, 0.05], [0.05, -0.05], [-0.05, -0.05]])
      if (!pasaCelda(city, Math.floor(x + ox), Math.floor(z + oz))) return false;
  }
  return true;
}
let semilla = 987654321;
const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
const celdaLibreAzar = city => { const g = grillaDe(city); for (;;) { const i = Math.floor(azar() * g.N), j = Math.floor(azar() * g.N); if (g.pasa[j * g.N + i]) return { i, j }; } };

console.log('1. A* óptimo (longitud octil) y sin camino');
{
  const c = vacia(20);
  const r = buscarRuta(c, { i: 2, j: 2 }, { i: 12, j: 7 });
  check('campo abierto: costo octil exacto', Math.abs(largoRuta({ i: 2, j: 2 }, r) - (5 + 5 * Math.SQRT2)) < 1e-9, largoRuta({ i: 2, j: 2 }, r).toFixed(4));
  check('mismo origen y destino devuelve []', buscarRuta(c, { i: 3, j: 3 }, { i: 3, j: 3 }).length === 0);
  const lab = desdeTexto([
    '###########',
    '#.#.......#',
    '#.#.#####.#',
    '#.#.#...#.#',
    '#.#.#.#.#.#',
    '#...#.#...#',
    '#####.#####',
    '#.....#...#',
    '#.#####.#.#',
    '#.........#',
    '###########',
  ]);
  const a = { i: 1, j: 1 }, b = { i: 9, j: 7 }, rl = buscarRuta(lab, a, b);
  const ref = dijkstra(lab, a, b);
  check('laberinto: igual a Dijkstra', rl && Math.abs(largoRuta(a, rl) - ref) < 1e-9, rl ? largoRuta(a, rl).toFixed(4) + ' vs ' + ref.toFixed(4) : 'null');
  const cerrado = desdeTexto(['#######', '#..#..#', '#..#..#', '#######', '#######', '#######', '#######']);
  check('sin camino devuelve null', buscarRuta(cerrado, { i: 1, j: 1 }, { i: 5, j: 2 }) === null);
  check('destino no caminable devuelve null', buscarRuta(cerrado, { i: 1, j: 1 }, { i: 3, j: 1 }) === null);
  let ok = true, mal = '';
  for (let t = 0; t < 40; t++) {                                  // mapas al azar: A* = Dijkstra
    const n = 24, cz = vacia(n);
    for (let k = 0; k < n * n; k++) if (azar() < 0.3) cz.C[k] = { t: 'bld', deco: null };
    const p = celdaLibreAzar(cz), q = celdaLibreAzar(cz), rr = buscarRuta(cz, p, q), dd = dijkstra(cz, p, q);
    if (dd === Infinity ? rr !== null : !rr || Math.abs(largoRuta(p, rr) - dd) > 1e-9) { ok = false; mal = 't=' + t; break; }
  }
  check('40 mapas al azar (30 % obstáculos): óptimo o null igual que Dijkstra', ok, mal);
}

console.log('2. No corta esquinas');
{
  const c = desdeTexto(['.....', '.#...', '..#..', '.....', '.....']);   // diagonal entre (1,1) y (2,2) bloqueada: pasar de (2,1) a (1,2) corta
  const r = buscarRuta(c, { i: 2, j: 1 }, { i: 1, j: 2 });
  const dd = dijkstra(c, { i: 2, j: 1 }, { i: 1, j: 2 });
  check('no pasa en diagonal entre dos obstáculos (rodea)', r && r.length > 1 && sinCortes(c, { i: 2, j: 1 }, r) && Math.abs(largoRuta({ i: 2, j: 1 }, r) - dd) < 1e-9, r ? r.length + ' pasos' : 'null');
  let ok = true;
  for (let t = 0; t < 40 && ok; t++) {
    const n = 30, cz = vacia(n);
    for (let k = 0; k < n * n; k++) if (azar() < 0.35) cz.C[k] = { t: 'bld', deco: null };
    const p = celdaLibreAzar(cz), q = celdaLibreAzar(cz), rr = buscarRuta(cz, p, q);
    if (rr && !sinCortes(cz, p, rr)) ok = false;
  }
  check('40 mapas al azar: todas las rutas sin cortes de esquina', ok);
}

console.log('3. Suavizado');
{
  let atraviesa = 0, alarga = 0, total = 0, puntos = 0, celdas = 0;
  const mapas = [generarCiudad()];
  for (let t = 0; t < 6; t++) { const cz = vacia(60); for (let k = 0; k < 3600; k++) if (azar() < 0.25) cz.C[k] = { t: 'bld', deco: null }; mapas.push(cz); }
  for (const m of mapas) for (let t = 0; t < 30; t++) {
    const a = celdaLibreAzar(m), b = celdaLibreAzar(m), r = buscarRuta(m, a, b);
    if (!r || !r.length) continue;
    const s = suavizar(m, [a, ...r]);
    total++; puntos += s.length; celdas += r.length;
    let prev = a; for (const w of s) { if (!tramoLibre(m, prev, w)) atraviesa++; prev = w; }
    if (largoRuta(a, s) > largoRuta(a, r) + 1e-9) alarga++;
    if (s[s.length - 1].i !== b.i || s[s.length - 1].j !== b.j) alarga++;
  }
  check('ningún tramo suavizado atraviesa obstáculos', atraviesa === 0, 'rutas=' + total + ', tramos malos=' + atraviesa);
  check('el suavizado nunca alarga la ruta y termina en el destino', alarga === 0);
  check('el suavizado reduce los puntos de paso', puntos < celdas * 0.5, puntos + ' puntos vs ' + celdas + ' celdas');
  const c = vacia(20);
  const s = buscarRuta(c, { i: 1, j: 1 }, { i: 15, j: 6 }, { suave: true });
  check('campo abierto: una sola recta', s.length === 1, JSON.stringify(s));
  check('lineaCaminable bloquea esquina diagonal', !lineaCaminable(desdeTexto(['....', '.#..', '..#.', '....']), 2.5, 1.5, 1.5, 2.5));
}

console.log('4. Presupuesto por frame');
{
  const c = damero(600);
  const pl = crearPlanificador(c);
  for (let k = 0; k < 30; k++) pl.pedir({ a: celdaLibreAzar(c), b: celdaLibreAzar(c), prio: k % 3, cb: () => {} });
  let maxF = 0, frames = 0;
  while (pl.pendientes() && frames < 100000) { maxF = Math.max(maxF, pl.procesar(RUTA_NODOS_FRAME)); frames++; }
  check('nunca expande más de RUTA_NODOS_FRAME por frame', maxF <= RUTA_NODOS_FRAME, 'max=' + maxF + ', frames=' + frames);
  check('termina todos los pedidos', pl.pendientes() === 0 && pl.stats.resueltos + pl.stats.sinCamino === 30, JSON.stringify(pl.stats));
  // Una búsqueda partida en muchos frames da la misma ruta que la síncrona.
  const a = { i: 16, j: 16 }, b = { i: 16 + 19 * 30, j: 17 + 19 * 27 };   // dos celdas de calle en esquinas opuestas
  let res = null; const p2 = crearPlanificador(c);
  p2.pedir({ a, b, cb: r => { res = r; } });
  let f2 = 0; while (p2.pendientes()) { p2.procesar(500); f2++; }
  const sync = buscarRuta(c, a, b, { suave: true });
  check('búsqueda incremental = síncrona', res && sync && f2 > 1 && largoRuta(a, res) === largoRuta(a, sync), f2 + ' frames de 500 nodos');
  // Prioridad y descarte de pedidos vencidos.
  const orden = [], p3 = crearPlanificador(vacia(20));
  p3.pedir({ a: { i: 0, j: 0 }, b: { i: 5, j: 5 }, prio: 2, cb: () => orden.push('patrulla') });
  p3.pedir({ a: { i: 0, j: 0 }, b: { i: 5, j: 5 }, prio: 0, cb: () => orden.push('persecucion') });
  p3.pedir({ a: { i: 0, j: 0 }, b: { i: 5, j: 5 }, prio: 0, vigente: () => false, cb: () => orden.push('vencido') });
  p3.procesar(1e6);
  check('persecución antes que patrulla y los vencidos se descartan', orden.join(',') === 'persecucion,patrulla', orden.join(','));
}

console.log('5. Rendimiento (Node ' + process.version + ')');
const ms = f => { const t0 = process.hrtime.bigint(); f(); return Number(process.hrtime.bigint() - t0) / 1e6; };
function medir(nombre, city, minDist) {
  const pares = [];
  while (pares.length < 100) { const a = celdaLibreAzar(city), b = celdaLibreAzar(city); if (Math.hypot(a.i - b.i, a.j - b.j) >= minDist) pares.push([a, b]); }
  buscarRuta(city, pares[0][0], pares[0][1]); bfsViejo(city, pares[0][0], pares[0][1]);   // calentamiento
  let exp = 0, maxA = 0, maxB = 0;
  const st = {};
  const tA = ms(() => { for (const [a, b] of pares) { const t = ms(() => buscarRuta(city, a, b, { suave: true, stats: st })); exp += st.expandidos; maxA = Math.max(maxA, t); } });
  const tB = ms(() => { for (const [a, b] of pares) maxB = Math.max(maxB, ms(() => bfsViejo(city, a, b))); });
  console.log(`  ${nombre}: 100 búsquedas largas (>= ${minDist} celdas)`);
  console.log(`    antes (BFS 4 dir, alocando): total ${tB.toFixed(1)} ms, media ${(tB / 100).toFixed(2)} ms, peor ${maxB.toFixed(2)} ms`);
  console.log(`    ahora (A* octil + suavizado): total ${tA.toFixed(1)} ms, media ${(tA / 100).toFixed(2)} ms, peor ${maxA.toFixed(2)} ms, ${Math.round(exp / 100)} nodos/búsqueda, ${(tA * 1e6 / exp).toFixed(0)} ns/nodo`);
  return tA * 1e6 / exp;
}
const nsNodo = medir('damero 600 x 600 (16 + 3)', damero(600), 300);
medir('ciudad actual ' + N_CIUDAD + ' x ' + N_CIUDAD, generarCiudad(), 60);
{
  // 12 perseguidores en el damero 600: cada uno pide ruta cada POLI_T_RUTA (escalonados) hacia un jugador que se mueve.
  const c = damero(600), pl = crearPlanificador(c), dt = 1 / 60;
  const ags = []; for (let k = 0; k < POLI_MAX_PERS; k++) ags.push({ t: k * POLI_T_RUTA / POLI_MAX_PERS, c: null });
  let jx = 300, jz = 300, maxMs = 0, maxNod = 0, sumMs = 0, frames = 0, sinRuta = 0;
  for (let f = 0; f < 600; f++) {
    jx = 300 + 60 * Math.sin(f / 90); jz = 300 + 60 * Math.cos(f / 70);
    const j = { i: Math.floor(jx), j: Math.floor(jz) }; while (!grillaDe(c).pasa[j.j * 600 + j.i]) j.i++;
    const t = ms(() => {
      for (const [n, a] of ags.entries()) {
        if ((a.t -= dt) > 0) continue;
        a.t = POLI_T_RUTA;
        const ang = n * 2.399, d = 25 + (n % 4) * 8;   // a 25-50 celdas del jugador
        let o = { i: Math.floor(jx + Math.sin(ang) * d), j: Math.floor(jz + Math.cos(ang) * d) };
        while (!grillaDe(c).pasa[o.j * 600 + o.i]) o.i++;
        pl.pedir({ a: o, b: j, prio: 0, cb: r => { if (!r) sinRuta++; } });
      }
      maxNod = Math.max(maxNod, pl.procesar(RUTA_NODOS_FRAME));
    });
    if (f > 30) { maxMs = Math.max(maxMs, t); sumMs += t; frames++; }
  }
  console.log(`  12 perseguidores, damero 600, 10 s a 60 fps: media ${(sumMs / frames).toFixed(3)} ms/frame, peor ${maxMs.toFixed(3)} ms/frame, max ${maxNod} nodos/frame, pendientes al final ${pl.pendientes()}`);
  check('12 perseguidores en 600 x 600: peor frame < 4 ms', maxMs < 4, maxMs.toFixed(3) + ' ms');
  check('presupuesto respetado en la simulación', maxNod <= RUTA_NODOS_FRAME, String(maxNod));
  check('sin pedidos atrasados: la cola se vacía', pl.pendientes() <= POLI_MAX_PERS, String(pl.pendientes()));
}
{
  // Simulación completa de agentes en la ciudad actual: 12 persiguiendo al jugador que corre en círculo.
  const city = generarCiudad();
  const esq = []; for (let k = 0; k < 12; k++) { const c = celdaLibreAzar(city); esq.push({ x: c.i + .5, z: c.j + .5, yaw: 0 }); }
  const sim = crearSimulacion(city, { esquinas: esq, rand: azar });
  for (const p of sim.agentes) { p.estado = 'persecucion'; p.tRuta = azar() * POLI_T_RUTA; }
  let cx = 66, cz = 66; { const c = celdaLibreAzar(city); cx = c.i; cz = c.j; }
  const pl = { px: cx + .5, py: cz + .5, heading: 0, corre: true, spd: 0, path: [], target: null, prevPx: cx + .5, prevPy: cz + .5 };
  let maxMs = 0, sumMs = 0, fuera = 0, nf = 0;
  for (let f = 0; f < 600; f++) {
    pl.prevPx = pl.px; pl.prevPy = pl.py;
    const t = ms(() => stepAgentes(sim, pl, 1 / 60));
    sim.G.capT = 0; sim.G.capAg = null;                           // la prueba mide costo: ignora capturas
    for (const p of sim.agentes) { if (p.estado !== 'persecucion') { p.estado = 'persecucion'; p.tRuta = 0; } if (!walkable(city, Math.floor(p.x), Math.floor(p.z))) fuera++; }
    if (f > 30) { maxMs = Math.max(maxMs, t); sumMs += t; nf++; }
  }
  console.log(`  stepAgentes, 12 perseguidores, ciudad actual: media ${(sumMs / nf).toFixed(3)} ms/frame, peor ${maxMs.toFixed(3)} ms/frame, max ${sim.rutas.stats.maxFrame} nodos/frame`);
  check('perseguidores nunca pisan celdas no caminables', fuera === 0, 'fuera=' + fuera);
  check('stepAgentes respeta el presupuesto', sim.rutas.stats.maxFrame <= RUTA_NODOS_FRAME, String(sim.rutas.stats.maxFrame));
  console.log(`  presupuesto ${RUTA_NODOS_FRAME} nodos/frame ≈ ${(RUTA_NODOS_FRAME * nsNodo / 1e6).toFixed(2)} ms al costo medido por nodo`);
}

console.log('');
console.log(fallos === 0 ? `TODAS LAS PRUEBAS OK (${pasos})` : `FALLARON ${fallos} de ${pasos}`);
process.exit(fallos === 0 ? 0 : 1);
