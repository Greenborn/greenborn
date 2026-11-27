// Ciudad real de la 2D: recorte de 3 x 3 km de CABA centrado en el Obelisco, desde OpenStreetMap. Sin DOM.
// Datos: 2d/datos/caba_recorte.json (metadatos) + caba_recorte.bin (3 planos de N*N bytes), generados por
// 2d/tools/procesar_osm.mjs. Plano 0: tipo (0 road, 1 side, 2 bld, 3 park) | árbol en el bit 4. Plano 1: barrio
// (índice en meta.barrios). Plano 2: pisos (building:levels, 0 = sin dato).
// Atribución obligatoria: "© colaboradores de OpenStreetMap, ODbL" (meta.atribucion).
//
// El objeto city tiene la misma forma que el de ciudad.js ({ C, N, seed, zona } con C[k] = { t, deco, rCol }) y además
// meta, barrios (de los metadatos), perfiles (perfil visual por zona, con el nombre real), zonaCentro, esquinas (patrulla),
// puntosPeaton, pisos y pasa (máscara de celdas caminables, la usan ciudad.js y rutas.js). Tipos de celda: los de ciudad.js más 'water'.

export const URL_META = new URL('../datos/caba_recorte.json', import.meta.url);
import { zonaEn, walkable, celdaPeatonal, celdaCaminableMasCerca, pedPath, lineaLibre, obstaculoEn, R_JUG, esquinasAgentes } from './ciudad.js';
import { perfilesReales } from './barrios.js';

// Las funciones de ciudad.js usan city.N y city.pasa, así que sirven tal cual para la ciudad real.
export { zonaEn, walkable, celdaPeatonal, celdaCaminableMasCerca, pedPath, lineaLibre, obstaculoEn, R_JUG, esquinasAgentes };

export const TIPOS = ['road', 'side', 'bld', 'park', 'water'];

// Carga en el navegador (fetch) o con lectores inyectados (Node: leerJson / leerBin con fs).
export async function cargarCiudadReal({ leerJson, leerBin } = {}) {
  const urlMeta = URL_META;
  const meta = leerJson ? await leerJson(urlMeta) : await (await fetch(urlMeta)).json();
  const urlBin = new URL(meta.binario, urlMeta);
  const buf = leerBin ? await leerBin(urlBin) : await (await fetch(urlBin)).arrayBuffer();
  return construirCiudadReal(meta, new Uint8Array(buf.buffer ?? buf, buf.byteOffset ?? 0, buf.byteLength));
}

// Hash entero determinista por celda (radio de tronco sin generador aleatorio).
const hash = k => { let x = (k * 2654435761) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; return (x ^ (x >>> 13)) >>> 0; };

export function construirCiudadReal(meta, bin) {
  const N = meta.N, NN = N * N;
  if (bin.length !== NN * 3) throw new Error(`caba_recorte.bin: se esperaban ${NN * 3} bytes y hay ${bin.length}`);
  const C = new Array(NN), zona = new Uint8Array(NN), pisos = new Uint8Array(NN), pasa = new Uint8Array(NN);
  for (let q = 0; q < NN; q++) {
    const v = bin[q], t = TIPOS[v & 15] ?? 'side';
    const c = { t, deco: null };
    if (v & 16) { c.deco = 'tree'; c.rCol = 0.25 + (hash(q) % 1000) / 10000; }
    C[q] = c;
    zona[q] = bin[NN + q];
    pisos[q] = bin[2 * NN + q];
    pasa[q] = t !== 'bld' && t !== 'water' && !c.deco ? 1 : 0;
  }
  const barrios = new Array(Math.max(0, ...meta.barrios.map(b => b.id)) + 1).fill(null);
  for (const b of meta.barrios) barrios[b.id] = b;
  // perfiles[z]: perfil visual (barrios.js) con el nombre real; zonaCentro: barrio del Obelisco.
  const perfiles = perfilesReales(barrios.map((b, k) => b?.nombre ?? 'Barrio ' + k));
  const city = { C, N, seed: 'osm', zona, pisos, pasa, meta, barrios, perfiles, real: true };
  city.zonaCentro = zona[(N >> 1) * N + (N >> 1)];
  city.esquinas = esquinasReales(city);   // un agente en cada esquina (agentes.js activa solo los cercanos)
  city.puntosPeaton = puntosPeatones(city);
  return city;
}

export const nombreBarrio = (city, i, j) => city.perfiles[zonaEn(city, i, j)]?.nombre ?? '';

// Esquinas de manzana: vereda caminable con calzada al costado (eje x) y arriba/abajo (eje z) y edificio en la
// diagonal opuesta. Se deja una por celda de una rejilla de paso `paso` (celdas) y se toma 1 de cada `cada`.
// yaw apunta hacia la calle (convención del juego: dirección (sin yaw, cos yaw) en (x, z)).
export function esquinasReales(city) {
  const N = city.N, C = city.C, out = [], usado = new Set();
  const t = (i, j) => (i < 0 || j < 0 || i >= N || j >= N) ? null : C[j * N + i].t;
  for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) {
    if (t(i, j) !== 'side' || C[j * N + i].deco) continue;
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      if (t(i + dx, j) === 'road' && t(i, j + dz) === 'road' && t(i - dx, j - dz) === 'bld') {
        const celda = Math.floor(i / 22) + ',' + Math.floor(j / 22);
        if (usado.has(celda)) break;
        usado.add(celda);
        out.push({ x: i + .5, z: j + .5, yaw: Math.atan2(dx, dz), barrio: city.zona[j * N + i] });
        break;
      }
    }
  }
  return out;
}

// Puntos de aparición de peatones: celdas de vereda sin árbol, una por rejilla de `paso` celdas.
export function puntosPeatones(city, paso = 10) {
  const N = city.N, out = [];
  for (let j0 = 0; j0 < N; j0 += paso) for (let i0 = 0; i0 < N; i0 += paso) {
    let p = null;
    for (let j = j0; j < Math.min(N, j0 + paso) && !p; j++) for (let i = i0; i < Math.min(N, i0 + paso); i++) {
      const c = city.C[j * N + i];
      if (c.t === 'side' && !c.deco) { p = { i, j }; break; }
    }
    if (p) out.push(p);
  }
  return out;
}

// Celda del Obelisco (centro del recorte) y conversión lat/lon -> celda, por si hace falta ubicar hitos.
export function celdaDe(city, lat, lon) {
  const m = city.meta, mLon = 111320 * Math.cos(m.centro.lat * Math.PI / 180);
  return { x: ((lon - m.centro.lon) * mLon + m.ladoM / 2) / m.celdaM, z: ((m.centro.lat - lat) * 111320 + m.ladoM / 2) / m.celdaM };
}
