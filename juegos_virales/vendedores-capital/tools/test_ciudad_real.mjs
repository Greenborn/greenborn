// Pruebas headless de la ciudad real (OpenStreetMap). Uso: node 2d/tools/test_ciudad_real.mjs
import { readFile } from 'node:fs/promises';
import {
  cargarCiudadReal, walkable, pedPath, lineaLibre, obstaculoEn, esquinasReales, esquinasAgentes,
  puntosPeatones, celdaCaminableMasCerca, zonaEn, nombreBarrio, celdaDe,
} from '../js/ciudad_real.js';
import { planearCamino, iniciarCamino, pasoCamino, crearCamino } from '../js/caminar.js';
import { crearPeaton, stepPeatones } from '../js/peatones.js';
import { crearSimulacion, stepAgentes } from '../js/agentes.js';
import { SPEED } from '../js/config.js';

let fallos = 0;
function check(nombre, cond, extra = '') {
  if (cond) console.log('  ok   - ' + nombre + (extra ? ' (' + extra + ')' : ''));
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}

const city = await cargarCiudadReal({
  leerJson: async u => JSON.parse(await readFile(u, 'utf8')),
  leerBin: async u => readFile(u),
});
const { N, C, meta } = city, NN = N * N;

console.log('1. Forma de los datos');
check('N coincide con lado/celda', N === meta.ladoM / meta.celdaM, `N=${N}, celda=${meta.celdaM} m`);
check('C, zona y pasa tienen N*N', C.length === NN && city.zona.length === NN && city.pasa.length === NN);
check('cada celda tiene t válido', C.every(c => ['road', 'side', 'bld', 'park', 'water'].includes(c.t)));
check('árboles con rCol', C.every(c => !c.deco || (c.deco === 'tree' && c.rCol > 0)));
check('atribución y licencia', /OpenStreetMap/.test(meta.atribucion) && /ODbL/.test(meta.licencia));
check('barrios con nombre', meta.barrios.length > 0 && meta.barrios.every(b => b.nombre), meta.barrios.map(b => b.nombre).join(', '));
check('toda zona apunta a un barrio', city.zona.every(z => city.barrios[z]));

console.log('2. Recorte');
const r = meta.recorte, ladoN = (r.norte - r.sur) * 111320, ladoE = (r.este - r.oeste) * 111320 * Math.cos(meta.centro.lat * Math.PI / 180);
check('recorte de ~3 km por lado', Math.abs(ladoN - meta.ladoM) < 5 && Math.abs(ladoE - meta.ladoM) < 5, `${ladoN.toFixed(0)} x ${ladoE.toFixed(0)} m`);
const ob = celdaDe(city, meta.centro.lat, meta.centro.lon);
check('Obelisco en el centro', Math.abs(ob.x - N / 2) < 1e-6 && Math.abs(ob.z - N / 2) < 1e-6);
const so = celdaDe(city, r.sur, r.oeste);
check('esquina sudoeste en (0, N)', Math.abs(so.x) < 0.5 && Math.abs(so.z - N) < 0.5);

console.log('3. Proporciones');
const cnt = { road: 0, side: 0, bld: 0, park: 0, water: 0 }; let arboles = 0;
for (const c of C) { cnt[c.t]++; if (c.deco) arboles++; }
const pct = k => 100 * cnt[k] / NN;
console.log(`     road ${pct('road').toFixed(1)} %, side ${pct('side').toFixed(1)} %, bld ${pct('bld').toFixed(1)} %, park ${pct('park').toFixed(1)} %, agua ${pct('water').toFixed(1)} %, árboles ${arboles}`);
check('edificios 30-75 %', pct('bld') > 30 && pct('bld') < 75);
check('calles 8-35 %', pct('road') > 8 && pct('road') < 35);
check('veredas 5-40 %', pct('side') > 5 && pct('side') < 40);
check('parques 1-20 %', pct('park') > 1 && pct('park') < 20);
check('agua 0,5-10 %', pct('water') > 0.5 && pct('water') < 10);
check('el agua no es caminable', C.every((c, q) => c.t !== 'water' || (city.pasa[q] === 0 && !walkable(city, q % N, (q / N) | 0))));
const qa = C.findIndex(c => c.t === 'water');
check('obstaculoEn bloquea agua', obstaculoEn(city, qa % N + .5, Math.floor(qa / N) + .5));

console.log('4. Conectividad');
const comp = new Int32Array(NN).fill(-1), cola = new Int32Array(NN); let mayor = 0, total = 0;
for (let s = 0; s < NN; s++) {
  if (!city.pasa[s] || comp[s] !== -1) continue;
  let h = 0, t = 0; cola[t++] = s; comp[s] = s;
  while (h < t) {
    const c = cola[h++], i = c % N;
    for (const k of [i > 0 ? c - 1 : -1, i < N - 1 ? c + 1 : -1, c - N, c + N < NN ? c + N : -1])
      if (k >= 0 && city.pasa[k] && comp[k] === -1) { comp[k] = s; cola[t++] = k; }
  }
  total += t; mayor = Math.max(mayor, t);
}
check('componente mayor > 95 % de lo caminable', mayor / total > 0.95, `${(100 * mayor / total).toFixed(2)} % de ${total}`);

console.log('5. Caminos');
const a = celdaCaminableMasCerca(city, 20, 20, 15), b = celdaCaminableMasCerca(city, N - 20, N - 20, 15);
const t0 = performance.now(), p = pedPath(city, a, b), ms = performance.now() - t0;
check('BFS esquina a esquina encuentra camino', p && p.length > N, p ? `${p.length} pasos, ${ms.toFixed(1)} ms` : 'sin camino');
check('camino sólo por celdas caminables y contiguo', p && p.every((c, k) => walkable(city, c.i, c.j) &&
  Math.abs(c.i - (k ? p[k - 1].i : a.i)) + Math.abs(c.j - (k ? p[k - 1].j : a.j)) === 1));
check('pedPath a un edificio da null', (() => { const q = C.findIndex(c => c.t === 'bld'); return pedPath(city, a, { i: q % N, j: (q / N) | 0 }) === null; })());

console.log('6. Colisión y visión');
const qb = C.findIndex((c, k) => c.t === 'bld' && k > NN / 2);
check('obstaculoEn bloquea edificio', obstaculoEn(city, qb % N + .5, Math.floor(qb / N) + .5));
check('obstaculoEn bloquea borde', obstaculoEn(city, 0.01, 10) && obstaculoEn(city, N - 0.01, 10));
check('obstaculoEn libre en calle', (() => { const q = C.findIndex((c, k) => c.t === 'road' && k > NN / 2); return !obstaculoEn(city, q % N + .5, Math.floor(q / N) + .5); })());
check('lineaLibre ve a lo largo de una calle', lineaLibre(city, a.i + .5, a.j + .5, a.i + .5, a.j + .5));

console.log('7. Esquinas y peatones');
const esq = esquinasReales(city), ag = esquinasAgentes(city), pp = puntosPeatones(city);
check('al menos 20 esquinas para agentes', ag.length >= 20, `${esq.length} esquinas, ${ag.length} de patrulla`);
check('esquinas sobre vereda caminable', esq.every(e => walkable(city, Math.floor(e.x), Math.floor(e.z))));
check('puntos de peatones caminables', pp.length > 100 && pp.every(q => walkable(city, q.i, q.j)), `${pp.length}`);
check('nombre de barrio en el Obelisco', nombreBarrio(city, N / 2, N / 2).length > 0, nombreBarrio(city, N / 2, N / 2));
check('zonaEn en rango', zonaEn(city, 0, 0) < city.barrios.length);

console.log('8. A*, jugador, peatones y selección de barrio');
const mapaComp = new Map();
for (let q = 0; q < NN; q++) if (comp[q] >= 0) mapaComp.set(comp[q], (mapaComp.get(comp[q]) ?? 0) + 1);
const principal = [...mapaComp].sort((x, y) => y[1] - x[1])[0][0];
for (const [z, br] of city.barrios.entries()) {
  const s = celdaCaminableMasCerca(city, br.centro.i, br.centro.j, 60);
  check(`aparición en ${br.nombre}: en la red principal y dentro del barrio`,
    s && comp[s.j * N + s.i] === principal && zonaEn(city, s.i, s.j) === z, s ? `${s.i},${s.j}` : 'sin celda');
}
check('perfiles con nombres reales', city.perfiles.every((p, z) => p.nombre === city.barrios[z].nombre && p.perfil !== 'Parque'));
const ini = celdaCaminableMasCerca(city, N / 2, N / 2, 30);
const dest = celdaCaminableMasCerca(city, N / 2 + 25, N / 2 + 18, 15);
const t1 = performance.now(), plan = planearCamino(city, { x: ini.i + .5, y: ini.j + .5 }, { x: dest.i + .5, y: dest.j + .5 }), ms1 = performance.now() - t1;
check('el clic para caminar encuentra camino en la ciudad real', plan && plan.pasos.length > 0, `${ms1.toFixed(1)} ms`);
if (plan) {
  const camino = crearCamino(); iniciarCamino(camino, plan);
  const pos = { x: ini.i + .5, y: ini.j + .5 };
  for (let k = 0; k < 3600 && camino.activo; k++) {
    const m = pasoCamino(camino, pos, { dx: 0, dy: 0 }, 1 / 60), v = SPEED / 60;
    if (!obstaculoEn(city, pos.x + m.dx * v, pos.y)) pos.x += m.dx * v;
    if (!obstaculoEn(city, pos.x, pos.y + m.dy * v)) pos.y += m.dy * v;
  }
  check('el recorrido con colisiones llega', Math.floor(pos.x) === dest.i && Math.floor(pos.y) === dest.j, `${pos.x.toFixed(1)},${pos.y.toFixed(1)}`);
}
let semilla = 7; const rnd = () => (semilla = (semilla * 1664525 + 1013904223) >>> 0) / 4294967296;
const cerca = { x: ini.i + .5, z: ini.j + .5 };
const peds = Array.from({ length: 30 }, () => crearPeaton(city, { cerca, rnd }));
let enObstaculo = 0;
for (let k = 0; k < 600; k++) { stepPeatones(peds, city, 0.05, rnd); for (const p of peds) if (!walkable(city, Math.floor(p.x), Math.floor(p.z))) enObstaculo++; }
check('peatones caminan sólo por celdas caminables', enObstaculo === 0, String(enObstaculo));
check('peatón sin referencia nace en un punto caminable', (() => { const p = crearPeaton(city, { rnd }); return walkable(city, Math.floor(p.x), Math.floor(p.z)); })());
const sim = crearSimulacion(city, { rand: rnd }), pl = { px: cerca.x, py: cerca.z, prevPx: cerca.x, prevPy: cerca.z, heading: 0, corre: false, spd: 0 };
const t2 = performance.now(); for (let k = 0; k < 600; k++) stepAgentes(sim, pl, 1 / 60);
check('600 pasos de agentes sin salir de lo caminable', sim.agentes.every(p => walkable(city, Math.floor(p.x), Math.floor(p.z))),
  `${sim.agentes.length} agentes, ${((performance.now() - t2) / 600).toFixed(2)} ms por paso`);

console.log(fallos ? `\n${fallos} falla(s)` : '\nTodo ok');
process.exit(fallos ? 1 : 0);
