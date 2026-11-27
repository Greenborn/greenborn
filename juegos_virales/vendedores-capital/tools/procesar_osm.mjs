// Convierte una descarga de OpenStreetMap (JSON de Overpass) en la grilla de la ciudad real de la 2D.
// Uso (desde cualquier carpeta; las rutas van como argumento, no se ejecuta nada dentro de la carpeta de la descarga):
//   node 2d/tools/procesar_osm.mjs <overpass.json> <barrios.json> <salida_sin_extension> [fecha_descarga]
//   ej.: node 2d/tools/procesar_osm.mjs /ruta/osm_crudo/overpass.json /ruta/osm_crudo/barrios.json 2d/datos/caba_recorte
// Genera <salida>.bin (planos de celdas) y <salida>.json (metadatos). Ver el formato en 2d/js/ciudad_real.js.
//
// Consulta usada (Overpass, recorte de 3 x 3 km centrado en el Obelisco, el mismo de la 3D):
//   [out:json][timeout:120][bbox:S,O,N,E];(way[building];relation[building];way[highway];
//     way[leisure~"^(park|garden|pitch|playground)$"];relation[leisure=park];way[landuse=grass];way[place=square];
//     node[natural=tree];way[natural=water];relation[natural=water];way[waterway~"^(dock|riverbank)$"];
//     relation[waterway~"^(dock|riverbank)$"];);out geom qt;
//   Barrios (en CABA son boundary=administrative admin_level=9, no 10): relation(id:...);out geom;
//
// Pasos: proyección equirrectangular local (norte arriba, j crece hacia el sur), calles rasterizadas con ancho por tipo,
// edificios y parques rellenos por scanline, vereda como anillo de 1 celda entre calle y edificio, patios encerrados que
// no se conectan a la red caminable pasan a edificio, árboles de OSM sobre veredas y parques, barrio por celda.
// Sólo se guardan tipo de celda, árbol, barrio y pisos (building:levels). No se guardan otras etiquetas de OSM.
import { readFileSync, writeFileSync } from 'node:fs';

const [, , rutaOsm, rutaBarrios, salida, fechaArg] = process.argv;
if (!rutaOsm || !rutaBarrios || !salida) {
  console.error('Uso: node procesar_osm.mjs <overpass.json> <barrios.json> <salida_sin_extension> [fecha]');
  process.exit(1);
}

// Recorte y escala (iguales a la 3D: 3000 m de lado, celdas de 5 m, Obelisco en el centro).
const LAT0 = -34.6037, LON0 = -58.3816, LADO_M = 3000, CELDA_M = 5;
const N = LADO_M / CELDA_M;                      // 600
const M_LAT = 111320, M_LON = 111320 * Math.cos(LAT0 * Math.PI / 180);
const HALF = LADO_M / 2;
const BBOX = { sur: LAT0 - HALF / M_LAT, oeste: LON0 - HALF / M_LON, norte: LAT0 + HALF / M_LAT, este: LON0 + HALF / M_LON };
const px = lon => ((lon - LON0) * M_LON + HALF) / CELDA_M;   // columna (i), en celdas, continua
const py = lat => ((LAT0 - lat) * M_LAT + HALF) / CELDA_M;   // fila (j), norte arriba

// Tipos de celda (mismos nombres que ciudad.js).
const ROAD = 0, SIDE = 1, BLD = 2, PARK = 3, WATER = 4, LIBRE = 255;
const TIPOS = ['road', 'side', 'bld', 'park', 'water'];

// Ancho de calzada por tipo de highway, en metros. Peatonales y senderos no son calzada (quedan como vereda).
const ANCHO = {
  motorway: 22, motorway_link: 9, trunk: 20, trunk_link: 9, primary: 18, primary_link: 9,
  secondary: 14, secondary_link: 8, tertiary: 11, tertiary_link: 8,
  residential: 9, unclassified: 9, living_street: 8, road: 9,
};
const PEATONAL = new Set(['pedestrian']);

const osm = JSON.parse(readFileSync(rutaOsm, 'utf8'));
const brr = JSON.parse(readFileSync(rutaBarrios, 'utf8'));
const fecha = fechaArg || (osm.osm3s?.timestamp_osm_base ?? '').slice(0, 10);

const tipo = new Uint8Array(N * N).fill(LIBRE);
const arbol = new Uint8Array(N * N);
const pisos = new Uint8Array(N * N);
const zona = new Uint8Array(N * N).fill(255);

// Relleno de polígonos por scanline (par-impar sobre todos los segmentos: sirve para multipolígonos con huecos).
// anillos: lista de listas de puntos {x, y} en celdas. cb(k) por cada celda cuyo centro cae adentro.
function rellenar(anillos, cb) {
  let y0 = Infinity, y1 = -Infinity;
  const segs = [];
  for (const r of anillos) for (let k = 0; k + 1 < r.length; k++) {
    const a = r[k], b = r[k + 1];
    if (a.y === b.y) continue;
    segs.push(a.y < b.y ? [a.x, a.y, b.x, b.y] : [b.x, b.y, a.x, a.y]);
    y0 = Math.min(y0, a.y, b.y); y1 = Math.max(y1, a.y, b.y);
  }
  const jA = Math.max(0, Math.floor(y0)), jB = Math.min(N - 1, Math.ceil(y1));
  for (let j = jA; j <= jB; j++) {
    const yc = j + 0.5, xs = [];
    for (const [ax, ay, bx, by] of segs) if (yc >= ay && yc < by) xs.push(ax + (yc - ay) * (bx - ax) / (by - ay));
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const iA = Math.max(0, Math.ceil(xs[k] - 0.5)), iB = Math.min(N - 1, Math.floor(xs[k + 1] - 0.5));
      for (let i = iA; i <= iB; i++) cb(j * N + i);
    }
  }
}

// Celdas cuyo centro está a menos de r (celdas) del segmento a-b.
function trazo(a, b, r, cb) {
  const iA = Math.max(0, Math.floor(Math.min(a.x, b.x) - r)), iB = Math.min(N - 1, Math.ceil(Math.max(a.x, b.x) + r));
  const jA = Math.max(0, Math.floor(Math.min(a.y, b.y) - r)), jB = Math.min(N - 1, Math.ceil(Math.max(a.y, b.y) + r));
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1e-9;
  for (let j = jA; j <= jB; j++) for (let i = iA; i <= iB; i++) {
    const cx = i + 0.5, cy = j + 0.5;
    const t = Math.max(0, Math.min(1, ((cx - a.x) * dx + (cy - a.y) * dy) / L2));
    const ex = a.x + t * dx - cx, ey = a.y + t * dy - cy;
    if (ex * ex + ey * ey <= r * r) cb(j * N + i);
  }
}

const pts = g => g.filter(Boolean).map(p => ({ x: px(p.lon), y: py(p.lat) }));
const anillosDe = e => e.type === 'way' ? [pts(e.geometry ?? [])]
  : (e.members ?? []).filter(m => m.geometry && (m.role === 'outer' || m.role === 'inner' || m.role === '')).map(m => pts(m.geometry));
const cerrado = r => r.length > 2 && r[0].x === r[r.length - 1].x && r[0].y === r[r.length - 1].y;

const cuenta = { calles: 0, edificios: 0, parques: 0, arboles: 0 };

// 1. Parques y plazas (se pintan primero; calles y edificios los pisan).
for (const e of osm.elements) {
  const t = e.tags ?? {};
  const verde = ['park', 'garden', 'playground', 'pitch'].includes(t.leisure) || t.landuse === 'grass' || t.place === 'square';
  if (!verde || t.building) continue;
  const an = anillosDe(e).filter(r => r.length > 2);
  if (!an.length || (e.type === 'way' && !cerrado(an[0]))) continue;
  rellenar(an, k => { tipo[k] = PARK; });
  cuenta.parques++;
}

// 1b. Agua (diques de Puerto Madero, espejos de agua): no caminable. Calles y puentes la pisan después.
for (const e of osm.elements) {
  const t = e.tags ?? {};
  const agua = t.natural === 'water' || t.waterway === 'dock' || t.waterway === 'riverbank';
  if (!agua || t.building) continue;
  const an = anillosDe(e).filter(r => r.length > 2);
  if (!an.length || (e.type === 'way' && !cerrado(an[0]))) continue;
  rellenar(an, k => { tipo[k] = WATER; });
  cuenta.agua = (cuenta.agua ?? 0) + 1;
}

// 2. Edificios (las etiquetas de uso no se leen: todo edificio es genérico; sólo se toma building:levels).
for (const e of osm.elements) {
  const t = e.tags ?? {};
  if (!t.building || t.building === 'roof' || t.layer?.startsWith('-')) continue;
  const an = anillosDe(e).filter(r => r.length > 2);
  if (!an.length || (e.type === 'way' && !cerrado(an[0]))) continue;
  const lv = Math.max(0, Math.min(80, parseInt(t['building:levels'], 10) || 0));
  rellenar(an, k => { tipo[k] = BLD; pisos[k] = lv; });
  cuenta.edificios++;
}

// 3. Calles: calzada con su ancho (usa lanes o width si vienen). Túneles y peatonales no son calzada.
const peat = new Uint8Array(N * N);
const r9j = /9 de julio/i;   // el nombre se usa sólo aquí para el ancho; no se guarda
for (const e of osm.elements) {
  if (e.type !== 'way') continue;
  const t = e.tags ?? {};
  if (!t.highway || t.tunnel === 'yes' || t.covered === 'yes' || t.area === 'yes') continue;
  if (PEATONAL.has(t.highway)) {   // peatonal: no es calzada, pero separa manzanas y queda como vereda
    const g = pts(e.geometry ?? []);
    for (let k = 0; k + 1 < g.length; k++) trazo(g[k], g[k + 1], 1.2, q => { peat[q] = 1; });
    continue;
  }
  let w = ANCHO[t.highway];
  if (!w) continue;
  const lanes = parseInt(t.lanes, 10), wt = parseFloat(t.width);
  if (lanes > 0) w = Math.max(w, lanes * 3.2 + 1);
  if (wt > 0 && wt < 60) w = Math.max(w, wt);
  if (r9j.test(t.name ?? '') && !/_link$/.test(t.highway)) w = Math.max(w, 20);   // calzadas centrales y laterales
  const g = pts(e.geometry ?? []), r = w / 2 / CELDA_M;
  for (let k = 0; k + 1 < g.length; k++) trazo(g[k], g[k + 1], r, q => { tipo[q] = ROAD; pisos[q] = 0; });
  cuenta.calles++;
}

// 4. Peatonales a vereda. Lo que queda libre se resuelve por manzana: OSM no tiene todos los edificios mapeados, y en
//    el centro las manzanas están edificadas de punta a punta. Manzana = región de celdas que no son calzada ni peatonal
//    (4 vecinos). En manzanas de tamaño normal (hasta MANZANA_MAX celdas) el interior libre que no es parque pasa a
//    edificio; el anillo de 1 celda pegado a calle o peatonal queda como vereda (paso 5). Las regiones grandes (playas
//    ferroviarias, diques, parques) se dejan como vinieron: lo libre es vereda.
const MANZANA_MAX = 3000;   // celdas (75 000 m²): una manzana del centro tiene ~400
for (let q = 0; q < N * N; q++) if (peat[q] && tipo[q] !== ROAD) { tipo[q] = SIDE; pisos[q] = 0; }
const sep = q => tipo[q] === ROAD || peat[q];
let manzanasLlenas = 0;
{
  const vista = new Uint8Array(N * N), cola = new Int32Array(N * N);
  for (let s = 0; s < N * N; s++) {
    if (vista[s] || sep(s)) continue;
    let h = 0, t = 0; cola[t++] = s; vista[s] = 1;
    while (h < t) {
      const c = cola[h++], i = c % N, j = (c - i) / N;
      for (const k of [i > 0 ? c - 1 : -1, i < N - 1 ? c + 1 : -1, j > 0 ? c - N : -1, j < N - 1 ? c + N : -1])
        if (k >= 0 && !vista[k] && !sep(k)) { vista[k] = 1; cola[t++] = k; }
    }
    if (t > MANZANA_MAX) continue;
    manzanasLlenas++;
    for (let h2 = 0; h2 < t; h2++) if (tipo[cola[h2]] === LIBRE) tipo[cola[h2]] = BLD;
  }
}
for (let q = 0; q < N * N; q++) if (tipo[q] === LIBRE) tipo[q] = SIDE;

// 5. Vereda como anillo: todo edificio o parque pegado a la calzada (8 vecinos) pasa a vereda.
{
  const nuevo = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const q = j * N + i;
    if (tipo[q] !== BLD && tipo[q] !== PARK) continue;
    let pega = false;
    for (let dj = -1; dj <= 1 && !pega; dj++) for (let di = -1; di <= 1; di++) {
      const a = i + di, b = j + dj;
      if (a >= 0 && b >= 0 && a < N && b < N && sep(b * N + a)) { pega = true; break; }
    }
    if (pega && tipo[q] === BLD) nuevo.push(q);
  }
  for (const q of nuevo) { tipo[q] = SIDE; pisos[q] = 0; }
}

// 6. Patios: componentes caminables (4 vecinos) que no son la mayor y no tocan una calle pasan a edificio.
const bloq = q => tipo[q] === BLD || tipo[q] === WATER;
function componentes() {
  const comp = new Int32Array(N * N).fill(-1), tam = [];
  const cola = new Int32Array(N * N);
  for (let s = 0; s < N * N; s++) {
    if (bloq(s) || comp[s] !== -1) continue;
    const id = tam.length; let h = 0, t = 0; cola[t++] = s; comp[s] = id;
    while (h < t) {
      const c = cola[h++], i = c % N, j = (c - i) / N;
      if (i > 0 && !bloq(c - 1) && comp[c - 1] === -1) { comp[c - 1] = id; cola[t++] = c - 1; }
      if (i < N - 1 && !bloq(c + 1) && comp[c + 1] === -1) { comp[c + 1] = id; cola[t++] = c + 1; }
      if (j > 0 && !bloq(c - N) && comp[c - N] === -1) { comp[c - N] = id; cola[t++] = c - N; }
      if (j < N - 1 && !bloq(c + N) && comp[c + N] === -1) { comp[c + N] = id; cola[t++] = c + N; }
    }
    tam.push(t);
  }
  return { comp, tam };
}
let patios = 0;
{
  const { comp, tam } = componentes();
  let mayor = 0;
  for (let k = 1; k < tam.length; k++) if (tam[k] > tam[mayor]) mayor = k;
  for (let q = 0; q < N * N; q++) if (comp[q] !== -1 && comp[q] !== mayor) {
    const i = q % N, j = (q - i) / N, borde = i === 0 || j === 0 || i === N - 1 || j === N - 1;
    // Islas sueltas en el borde del recorte (cortadas por el recorte) también se cierran: no se puede llegar.
    if (tipo[q] === PARK && tam[comp[q]] > 400 && !borde) continue;   // parque grande encerrado: se deja
    tipo[q] = BLD; patios++;
  }
}

// 7. Árboles de OSM: sólo en vereda o parque que no sea anillo de 1 celda pegado a calle y edificio a la vez.
for (const e of osm.elements) {
  if (e.type !== 'node' || e.tags?.natural !== 'tree') continue;
  const i = Math.floor(px(e.lon)), j = Math.floor(py(e.lat));
  if (i < 1 || j < 1 || i >= N - 1 || j >= N - 1) continue;
  const q = j * N + i;
  if (tipo[q] !== SIDE && tipo[q] !== PARK) continue;
  arbol[q] = 1; cuenta.arboles++;
}

// 8. Barrios (admin_level=9 en CABA): nombre real y relleno de su multipolígono.
const barrios = [];
for (const e of brr.elements) {
  if (e.type !== 'relation') continue;
  const nombre = e.tags?.name;
  if (!nombre) continue;
  const an = (e.members ?? []).filter(m => m.type === 'way' && m.geometry && m.role !== 'subarea').map(m => pts(m.geometry));
  const idx = barrios.length;
  let celdas = 0;
  rellenar(an, k => { if (zona[k] === 255) { zona[k] = idx; celdas++; } });
  barrios.push({ id: idx, nombre, celdas });
}
// Celdas sin barrio (bordes, río): toman el barrio de la celda con barrio más cercana (BFS multi-fuente).
{
  const cola = [];
  for (let q = 0; q < N * N; q++) if (zona[q] !== 255) cola.push(q);
  for (let h = 0; h < cola.length; h++) {
    const c = cola[h], i = c % N, j = (c - i) / N;
    for (const [a, b] of [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]]) {
      if (a < 0 || b < 0 || a >= N || b >= N) continue;
      const k = b * N + a;
      if (zona[k] === 255) { zona[k] = zona[c]; cola.push(k); }
    }
  }
  if (!cola.length) zona.fill(0);
}
for (const b of barrios) b.celdas = 0;
const sumI = barrios.map(() => 0), sumJ = barrios.map(() => 0);
for (let q = 0; q < N * N; q++) { const z = zona[q], b = barrios[z]; if (b) { b.celdas++; sumI[z] += q % N; sumJ[z] += Math.floor(q / N); } }
for (const b of barrios) if (b.celdas) { b.centro = { i: Math.round(sumI[b.id] / b.celdas), j: Math.round(sumJ[b.id] / b.celdas) }; }
const barriosUsados = barrios.filter(b => b.celdas > 0);

// Salida: planos de N*N bytes en orden: tipo | arbol<<4 (byte 0), zona, pisos.
const bin = new Uint8Array(N * N * 3);
for (let q = 0; q < N * N; q++) { bin[q] = tipo[q] | (arbol[q] << 4); bin[N * N + q] = zona[q]; bin[2 * N * N + q] = pisos[q]; }
writeFileSync(salida + '.bin', bin);

const pct = {};
for (let q = 0; q < N * N; q++) pct[TIPOS[tipo[q]]] = (pct[TIPOS[tipo[q]]] ?? 0) + 1;
for (const k in pct) pct[k] = +(100 * pct[k] / (N * N)).toFixed(2);

const meta = {
  formato: 'vendedores-capital-2d-ciudad-real/1',
  binario: 'caba_recorte.bin',
  planos: ['tipo (bits 0-3: 0 road, 1 side, 2 bld, 3 park, 4 water) | arbol (bit 4)', 'zona (índice en barrios)', 'pisos (building:levels, 0 = sin dato)'],
  tipos: TIPOS,
  N, celdaM: CELDA_M, ladoM: LADO_M,
  centro: { lat: LAT0, lon: LON0, nota: 'Obelisco, centro del recorte (celda N/2, N/2)' },
  recorte: { sur: +BBOX.sur.toFixed(6), oeste: +BBOX.oeste.toFixed(6), norte: +BBOX.norte.toFixed(6), este: +BBOX.este.toFixed(6) },
  proyeccion: 'equirrectangular local centrada en el recorte; i crece al este, j crece al sur (norte arriba)',
  fechaDescarga: fecha,
  fuente: 'OpenStreetMap (Overpass API)',
  licencia: 'ODbL 1.0',
  atribucion: '© colaboradores de OpenStreetMap, ODbL',
  barrios: barriosUsados.map(b => ({ id: b.id, nombre: b.nombre, celdas: b.celdas, centro: b.centro })),
  porcentajes: pct,
  conteo: { ...cuenta, patiosCerrados: patios, manzanasRellenas: manzanasLlenas },
};
writeFileSync(salida + '.json', JSON.stringify(meta, null, 1) + '\n');
console.log(JSON.stringify({ N, porcentajes: pct, conteo: meta.conteo, barrios: meta.barrios.map(b => b.nombre + ' ' + b.celdas) }, null, 1));
