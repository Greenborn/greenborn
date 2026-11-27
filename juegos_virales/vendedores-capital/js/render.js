// Render 2D en canvas: mapa horneado por mosaicos (suelo con textura, edificios con techo, borde y sombra, árboles con copa
// y sombra, color por barrio) y encima, en cada cuadro: conos, sombras, sprites pixelart (jugador, peatones y agentes) ordenados
// por profundidad, marcas, burbujas, partículas de venta, luz de la jornada y viñeta de persecución.
// Rendimiento: el mapa se hornea por mosaicos perezosos con caché LRU (crearMapa) y se dibuja con un drawImage por mosaico visible; los sprites se rasterizan una vez por variante (sprites.js) y se dibujan
// con drawImage; los degradados de pantalla completa se cachean por tamaño y color. Sin librerías ni imágenes externas.
import { aPantalla, visible, dirPantalla } from './camara.js';
import { POLI_RADIO_PERS, POLI_FOV, radioVista } from './agentes.js';
import { HELI_R } from './vehiculos.js';
import { BARRIOS, perfilesDe } from './barrios.js';
import { AG_COL, MEM_COL, OBJ_OFR_COL, VEH_COL, VEH_LUZ, HELI_COL } from './config.js';
import { spriteJugador, completarPersonaje, ANCHO_SPRITE, ALTO_SPRITE } from './personaje.js';
import { crearCacheSprites, spriteAgente, personajePeaton, varianteDe, claveJugador, fabricaCanvas } from './sprites.js';

export const CELDA_MAPA_PX = 8;                       // resolución del mapa rasterizado (px por celda)
// Colores de agentes (config.js, AG_COL): amarillo / naranja / rojo, igual que la 3D. Las claves son los estados de agentes.js.
const COL_AG = AG_COL;
export const COL = { road: '#3b3d46', side: '#a7a093', bld: '#5b5f6b', park: '#5f8f4e', tree: '#2d5a2a', roof: '#737787', water: '#2e5d78' };
const TINTE_BARRIO = 0.14;   // fuerza del color de barrio sobre el suelo (0 = sin tinte)

// Paletas de techo por estilo de barrio (perfil del barrio, .pal). Sin paleta: techos grises y ocres.
const TECHOS = {
  base: ['#6b6f7c', '#7a7466', '#5f6673', '#80786c', '#6d7280', '#76706a'],
  francesa: ['#5d6878', '#6f7a8a', '#8a8f99', '#4f5866', '#7c8594'],
  vidrio: ['#5c7a92', '#4a667f', '#7896ab', '#3e5468', '#8aa4b6', '#6a8aa0'],
  walls: ['#8a6f5a', '#7a6a5f', '#9a8573', '#6d6f78', '#86776a'],
  caminito: ['#b8483a', '#3d7cc0', '#d8b23a', '#3f9a5e', '#d27a35', '#8a5aa8'],
  colonial: ['#a65a3a', '#b86b45', '#8f4e33', '#c27a52', '#9b5f44'],
  chapa: ['#8a8f95', '#9b8a78', '#7c8086', '#a07050', '#6f757c'],
};
const TECHO_ESTILO = { recova: ['#8c7f6a', '#9a8c74', '#7d735f', '#a3967f'] };

// Mezcla un color de terreno con el color del barrio (hex) en proporción t. Devuelve "#rrggbb".
export function mezclar(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
  const ch = k => Math.round(((a >> k) & 255) * (1 - t) + ((b >> k) & 255) * t);
  return '#' + [16, 8, 0].map(k => ch(k).toString(16).padStart(2, '0')).join('');
}
const aclarar = (hex, t) => mezclar(hex, '#ffffff', t);
const oscurecer = (hex, t) => mezclar(hex, '#000000', t);

// Ruido estable por celda (0..1): mismo (i, j, k), mismo valor.
function ruido(i, j, k = 0) {
  let h = (i * 374761393 + j * 668265263 + k * 2147483647) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Largo de la sombra de los edificios (px del mapa) según los pisos del barrio: barrios altos, sombras largas.
function sombraBarrio(b) {
  const pisos = b.pisos ? (b.pisos[0] + b.pisos[1]) / 2 : 3;
  return Math.max(2, Math.min(6, Math.round(1 + pisos / 3)));
}
function paletaTecho(b) {
  for (const e of b.estilo ?? []) if (TECHO_ESTILO[e]) return TECHO_ESTILO[e];
  return TECHOS[b.pal] ?? TECHOS.base;
}

// Pinta las celdas [i0, i1) x [j0, j1) de la ciudad en el contexto g, con la celda (i0, j0) en el píxel (0, 0), a
// CELDA_MAPA_PX px por celda. Recorre además un borde de 1 celda alrededor para que las sombras y las copas de árboles
// de las celdas vecinas entren en la región (el canvas recorta lo que cae afuera): dos regiones vecinas empalman sin costura.
// Capas: suelo por tipo (tinte del barrio), textura (baldosas, cordón, asfalto con carriles y sendas, adoquines, césped,
// agua), sombras de edificios (hacia abajo a la derecha, unión sin doble oscurecido), techos por lote con borde, y árboles.
function pintarRegion(g, city, i0, j0, i1, j1) {
  const P = CELDA_MAPA_PX, N = city.N, PERF = perfilesDe(city);
  const a0 = Math.max(0, i0 - 1), b0 = Math.max(0, j0 - 1), a1 = Math.min(N, i1 + 1), b1 = Math.min(N, j1 + 1);
  const ox = -i0 * P, oy = -j0 * P;
  const cel = (i, j) => (i < 0 || j < 0 || i >= N || j >= N) ? null : city.C[j * N + i];
  const tipo = (i, j) => cel(i, j)?.t ?? 'side';
  const esCalle = (i, j) => tipo(i, j) === 'road';
  const colores = new Map();   // "tipo|barrio" -> colores ya mezclados
  const coloresDe = (t, z) => {
    const k = t + '|' + z;
    let v = colores.get(k);
    if (!v) {
      const b = PERF[z] ?? BARRIOS[0];
      let base = t === 'road' ? mezclar(b.calle ?? COL.road, COL.road, 0.5) : t === 'side' ? (b.vereda ?? COL.side) : t === 'park' ? COL.park : t === 'water' ? COL.water : COL.side;
      if (t !== 'water') base = mezclar(base, b.col, TINTE_BARRIO);
      v = { base, claro: aclarar(base, 0.1), osc: oscurecer(base, 0.12), muyOsc: oscurecer(base, 0.25) };
      colores.set(k, v);
    }
    return v;
  };

  // 1. Suelo y textura por celda.
  for (let j = b0; j < b1; j++) for (let i = a0; i < a1; i++) {
    const ce = city.C[j * N + i], z = city.zona[j * N + i], b = PERF[z] ?? BARRIOS[0];
    const t = ce.t === 'bld' ? 'side' : ce.t;
    const k = coloresDe(t, z), x = i * P + ox, y = j * P + oy;
    g.fillStyle = k.base; g.fillRect(x, y, P, P);
    if (t === 'side') {
      g.fillStyle = k.osc;                                         // juntas de baldosas cada 4 px
      g.fillRect(x, y + 3, P, 1); g.fillRect(x, y + 7, P, 1);
      g.fillRect(x + 3, y, 1, P); g.fillRect(x + 7, y, 1, P);
      if (ruido(i, j, 1) < 0.18) { g.fillStyle = k.claro; g.fillRect(x + (ruido(i, j, 2) < .5 ? 0 : 4), y + (ruido(i, j, 3) < .5 ? 0 : 4), 3, 3); }
      g.fillStyle = k.muyOsc;                                      // cordón donde la vereda toca la calle
      if (esCalle(i, j - 1)) g.fillRect(x, y, P, 1);
      if (esCalle(i, j + 1)) g.fillRect(x, y + P - 1, P, 1);
      if (esCalle(i - 1, j)) g.fillRect(x, y, 1, P);
      if (esCalle(i + 1, j)) g.fillRect(x + P - 1, y, 1, P);
    } else if (t === 'road') {
      if (b.adoq) {                                                // adoquines: hileras desfasadas
        g.fillStyle = k.osc;
        for (let r = 0; r < P; r += 2) {
          g.fillRect(x, y + r, P, 1);
          for (let q = (r / 2 % 2) * 2; q < P; q += 4) g.fillRect(x + q, y + r + 1, 1, 1);
        }
      } else {
        for (let q = 0; q < 3; q++) {                              // grano del asfalto
          g.fillStyle = ruido(i, j, q + 10) < .5 ? k.claro : k.osc;
          g.fillRect(x + Math.floor(ruido(i, j, q + 20) * P), y + Math.floor(ruido(i, j, q + 30) * P), 1, 1);
        }
      }
      const hz = esCalle(i - 1, j) && esCalle(i + 1, j), vt = esCalle(i, j - 1) && esCalle(i, j + 1);
      if (hz && vt) continue;                                      // cruce: asfalto liso
      const cruceH = hz && (esCruce(i - 1, j) || esCruce(i + 1, j));
      const cruceV = vt && (esCruce(i, j - 1) || esCruce(i, j + 1));
      g.fillStyle = 'rgba(240, 240, 232, 0.78)';
      if (cruceH) { for (let r = 0; r < P; r += 2) g.fillRect(x + 1, y + r, P - 2, 1); continue; }   // senda peatonal
      if (cruceV) { for (let q = 0; q < P; q += 2) g.fillRect(x + q, y + 1, 1, P - 2); continue; }
      g.fillStyle = 'rgba(245, 214, 90, 0.7)';                     // línea de carril discontinua entre las dos manos
      if (hz && esCalle(i, j - 1) && i % 2 === 0) g.fillRect(x + 1, y, P - 2, 1);
      if (vt && esCalle(i - 1, j) && j % 2 === 0) g.fillRect(x, y + 1, 1, P - 2);
    } else if (t === 'park') {
      for (let q = 0; q < 5; q++) {                                // césped con matas claras y oscuras
        g.fillStyle = ruido(i, j, q + 40) < .5 ? k.claro : k.osc;
        g.fillRect(x + Math.floor(ruido(i, j, q + 50) * (P - 1)), y + Math.floor(ruido(i, j, q + 60) * (P - 1)), 2, 1);
      }
      if (ruido(i, j, 70) < 0.03) { g.fillStyle = ruido(i, j, 71) < .5 ? '#f4e285' : '#f2a6c4'; g.fillRect(x + 3, y + 3, 1, 1); }
    } else if (t === 'water') {
      g.fillStyle = k.claro;                                       // ondas: trazos cortos claros, alternados por fila
      const d = (j % 2) * 3 + Math.floor(ruido(i, j, 110) * 2);
      g.fillRect(x + d, y + 2, 3, 1); g.fillRect(x + ((d + 4) % P), y + 6, 2, 1);
      g.fillStyle = k.muyOsc;                                      // borde del agua (muelle) contra tierra
      if (cel(i, j - 1) && tipo(i, j - 1) !== 'water') g.fillRect(x, y, P, 2);
      if (cel(i - 1, j) && tipo(i - 1, j) !== 'water') g.fillRect(x, y, 2, P);
    }
  }
  function esCruce(i, j) { return esCalle(i, j) && esCalle(i - 1, j) && esCalle(i + 1, j) && esCalle(i, j - 1) && esCalle(i, j + 1); }

  // 2. Sombras de edificios: un solo path con todos los rectángulos desplazados (la unión no se oscurece dos veces).
  g.fillStyle = 'rgba(8, 10, 20, 0.34)';
  g.beginPath();
  for (let j = b0; j < b1; j++) for (let i = a0; i < a1; i++) {
    if (city.C[j * N + i].t !== 'bld') continue;
    const s = sombraBarrio(PERF[city.zona[j * N + i]] ?? BARRIOS[0]);
    g.rect(i * P + s + ox, j * P + s + oy, P, P);
  }
  g.fill();

  // 3. Techos: lotes de 3 x 3 celdas con color propio de la paleta del barrio, borde claro arriba/izquierda y oscuro abajo/derecha.
  const lote = (i, j) => Math.floor(i / 3) * 1000 + Math.floor(j / 3);
  const esBld = (i, j) => tipo(i, j) === 'bld';
  for (let j = b0; j < b1; j++) for (let i = a0; i < a1; i++) {
    if (!esBld(i, j)) continue;
    const z = city.zona[j * N + i], bz = PERF[z] ?? BARRIOS[0], pal = paletaTecho(bz);
    const L = lote(i, j), r = ruido(Math.floor(i / 3), Math.floor(j / 3), 80);
    const techo = mezclar(pal[Math.floor(r * pal.length)], bz.col, 0.08);
    const x = i * P + ox, y = j * P + oy;
    g.fillStyle = techo; g.fillRect(x, y, P, P);
    const mismo = (a, b2) => esBld(a, b2) && lote(a, b2) === L;
    g.fillStyle = aclarar(techo, 0.22);
    if (!mismo(i, j - 1)) g.fillRect(x, y, P, 1);
    if (!mismo(i - 1, j)) g.fillRect(x, y, 1, P);
    g.fillStyle = oscurecer(techo, 0.3);
    if (!mismo(i, j + 1)) g.fillRect(x, y + P - 1, P, 1);
    if (!mismo(i + 1, j)) g.fillRect(x + P - 1, y, 1, P);
    if (!esBld(i, j + 1)) { g.fillStyle = oscurecer(techo, 0.45); g.fillRect(x, y + P - 2, P, 2); }   // fachada sur, más oscura
    const d = ruido(i, j, 90);                                     // detalles: equipos y tanques de agua
    if (d < 0.1) { g.fillStyle = oscurecer(techo, 0.25); g.fillRect(x + 2, y + 2, 3, 2); g.fillStyle = aclarar(techo, 0.3); g.fillRect(x + 2, y + 2, 3, 1); }
    else if (d < 0.15) { g.fillStyle = '#c9ccd2'; g.beginPath(); g.arc(x + P / 2, y + P / 2, 2, 0, Math.PI * 2); g.fill(); }
  }

  // 4. Árboles: sombra (unión) y copa con dos tonos y un brillo.
  const arboles = [];
  for (let j = b0; j < b1; j++) for (let i = a0; i < a1; i++) {
    const ce = city.C[j * N + i];
    if (ce.deco === 'tree') arboles.push([i, j, Math.max(2.2, (ce.rCol ?? 0.3) * P * 1.45)]);
  }
  g.fillStyle = 'rgba(8, 14, 8, 0.32)';
  g.beginPath();
  for (const [i, j, r] of arboles) { const cx = i * P + P / 2 + 2 + ox, cy = j * P + P / 2 + 2 + oy; g.moveTo(cx + r, cy); g.arc(cx, cy, r, 0, Math.PI * 2); }
  g.fill();
  for (const [i, j, r] of arboles) {
    const cx = i * P + P / 2 + ox, cy = j * P + P / 2 + oy, v = ruido(i, j, 100);
    const base = mezclar(COL.tree, v < .33 ? '#3f7a2e' : v < .66 ? '#24502a' : '#4c6b22', 0.5);
    g.fillStyle = oscurecer(base, 0.15); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = aclarar(base, 0.12); g.beginPath(); g.arc(cx - r * 0.25, cy - r * 0.25, r * 0.62, 0, Math.PI * 2); g.fill();
    g.fillStyle = aclarar(base, 0.35); g.fillRect(Math.round(cx - r * 0.45), Math.round(cy - r * 0.5), 1, 1);
  }
}

// Ciudad completa en un único canvas (N x N celdas a CELDA_MAPA_PX px). Sirve para ciudades chicas (la procedural de
// 132 x 132 = 1056 px) y pruebas; para la real (600 x 600 = 4800 px) usar crearMapa, que hornea por mosaicos.
export function rasterizarMapa(city, fabrica = crearCanvasDoc) {
  const c = fabrica(city.N * CELDA_MAPA_PX, city.N * CELDA_MAPA_PX);
  pintarRegion(c.getContext('2d'), city, 0, 0, city.N, city.N);
  return c;
}

// ---------- Mapa por mosaicos perezosos ----------
// El mapa se hornea en mosaicos de MOSAICO x MOSAICO celdas (más 1 celda de solape a la derecha y abajo, para que al
// dibujarlos rotados no aparezcan costuras), sólo cuando entran en pantalla. Caché LRU con tope de mosaicos (memoria
// acotada: un mosaico de 65 x 65 celdas a 8 px son 520 x 520 px, ~1,1 MB). Como máximo MOSAICOS_POR_CUADRO mosaicos
// nuevos por cuadro; mientras falta uno se ve la vista general (1 px por celda, colores planos) debajo.
export const MOSAICO = 64;
export const TOPE_MOSAICOS = 40;              // ~43 MB de mosaicos como máximo
export const MOSAICOS_POR_CUADRO = 4;

export function crearMapa(city, { fabrica = fabricaCanvas, tope = TOPE_MOSAICOS, porCuadro = MOSAICOS_POR_CUADRO } = {}) {
  const N = city.N, P = CELDA_MAPA_PX, T = MOSAICO, nt = Math.ceil(N / T);
  const cache = new Map();                    // clave ti * nt + tj -> canvas (orden de inserción = LRU)
  let horneados = 0, msTotal = 0, msMax = 0, general = null;
  const mapa = {
    city, N, nt, tope, porCuadro,
    // Mosaico (ti, tj): lo hornea si falta y hay presupuesto (forzar = siempre). null si no se horneó.
    mosaico(ti, tj, forzar = true) {
      const k = ti * nt + tj;
      let c = cache.get(k);
      if (c) { cache.delete(k); cache.set(k, c); return c; }
      if (!forzar && mapa.presupuesto <= 0) return null;
      mapa.presupuesto--;
      const t0 = ahora();
      const w = Math.min(T + 1, N - ti * T), h = Math.min(T + 1, N - tj * T);
      c = fabrica(w * P, h * P);
      pintarRegion(c.getContext('2d'), city, ti * T, tj * T, ti * T + w, tj * T + h);
      const ms = ahora() - t0; msTotal += ms; msMax = Math.max(msMax, ms); horneados++;
      cache.set(k, c);
      while (cache.size > Math.max(mapa.tope, mapa.minimo ?? 0)) cache.delete(cache.keys().next().value);
      return c;
    },
    // Vista general: 1 px por celda con el color base de cada tipo (sin textura). Se arma una vez.
    general() {
      if (general !== null) return general;
      general = fabrica(N, N) ?? false;
      if (general) {
        const g = general.getContext('2d'), PERF = perfilesDe(city);
        for (let j = 0; j < N; j++) {
          let i = 0;
          while (i < N) {                     // tramos del mismo color en la fila: un fillRect por tramo
            const col = colorPlano(city, PERF, j * N + i);
            let f = i + 1;
            while (f < N && colorPlano(city, PERF, j * N + f) === col) f++;
            g.fillStyle = col; g.fillRect(i, j, f - i, 1);
            i = f;
          }
        }
      }
      return general;
    },
    presupuesto: porCuadro,
    stats: () => ({ enCache: cache.size, horneados, msMedio: horneados ? msTotal / horneados : 0, msMax, bytes: [...cache.values()].reduce((s, c) => s + c.width * c.height * 4, 0) }),
    vaciar() { cache.clear(); },
  };
  return mapa;
}
const ahora = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
function colorPlano(city, PERF, q) {
  const c = city.C[q];
  if (c.deco === 'tree') return COL.tree;
  if (c.t === 'bld') return COL.roof;
  if (c.t === 'water') return COL.water;
  return mezclar(COL[c.t] ?? COL.side, (PERF[city.zona[q]] ?? BARRIOS[0]).col, TINTE_BARRIO);
}

// Rango de mosaicos visibles: rectángulo de celdas que contiene las cuatro esquinas de la pantalla (con la rotación).
export function mosaicosVisibles(cam, N) {
  const c = Math.cos(cam.rot), s = Math.sin(cam.rot), hw = cam.w / 2 / cam.zoom, hh = cam.h / 2 / cam.zoom;
  const ex = Math.abs(hw * c) + Math.abs(hh * s) + 1, ey = Math.abs(hw * s) + Math.abs(hh * c) + 1;
  const nt = Math.ceil(N / MOSAICO), cl = v => Math.max(0, Math.min(nt - 1, v));
  return { ti0: cl(Math.floor((cam.x - ex) / MOSAICO)), ti1: cl(Math.floor((cam.x + ex) / MOSAICO)),
    tj0: cl(Math.floor((cam.y - ey) / MOSAICO)), tj1: cl(Math.floor((cam.y + ey) / MOSAICO)) };
}

// Dibuja el mapa (canvas completo o mapa por mosaicos) con la transformada de la vista ya aplicada (1 unidad = 1 celda).
function dibujarSuelo(ctx, cam, mapa) {
  if (!mapa.mosaico) { ctx.drawImage(mapa, 0, 0, mapa.width / CELDA_MAPA_PX, mapa.height / CELDA_MAPA_PX); return; }
  const v = mosaicosVisibles(cam, mapa.N), T = MOSAICO;
  mapa.minimo = (v.ti1 - v.ti0 + 1) * (v.tj1 - v.tj0 + 1) + 4;   // el LRU nunca echa un mosaico visible
  mapa.presupuesto = mapa.porCuadro;
  let faltan = false;
  for (let tj = v.tj0; tj <= v.tj1 && !faltan; tj++) for (let ti = v.ti0; ti <= v.ti1; ti++)
    if (!mapa.mosaico(ti, tj, false)) { faltan = true; break; }
  if (faltan) { const gen = mapa.general(); if (gen) ctx.drawImage(gen, 0, 0, mapa.N, mapa.N); }
  for (let tj = v.tj0; tj <= v.tj1; tj++) for (let ti = v.ti0; ti <= v.ti1; ti++) {
    const m = mapa.mosaico(ti, tj, false);
    if (m) ctx.drawImage(m, ti * T, tj * T, m.width / CELDA_MAPA_PX, m.height / CELDA_MAPA_PX);
  }
}
function crearCanvasDoc(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---------- Estado de presentación (no es estado de juego) ----------

const sprites = crearCacheSprites({ fabrica: (w, h) => fabricaCanvas(w, h) });
const animPeat = new WeakMap();   // peatón o agente -> { x, z, mov, frente, fase }: para animar la caminata y elegir la vista
const grad = { vinW: 0, vinH: 0, vin: null, luzW: 0, luzH: 0, luzCol: '', luz: null };
const ordenados = [];             // lista reutilizada de entidades a dibujar, ordenadas por y de pantalla

// Vista (frente o espalda) en pantalla según el rumbo del mundo y el giro de la cámara: hacia abajo de la pantalla es de frente.
function frenteEnPantalla(cam, fx, fz) { return dirPantalla(cam, fx, fz)[1] >= 0; }

// Anima un peatón o agente: detecta si se movió desde el cuadro anterior y hacia dónde.
function animar(ent, x, z, cam, yaw) {
  let a = animPeat.get(ent);
  if (!a) { a = { x, z, mov: false, frente: true, fase: Math.random() * 2, quieto: 0 }; animPeat.set(ent, a); }
  const dx = x - a.x, dz = z - a.z, d = Math.hypot(dx, dz);
  if (d > 0.002) { a.mov = true; a.quieto = 0; if (yaw === undefined) a.frente = frenteEnPantalla(cam, dx, dz); }
  else if (++a.quieto > 3) a.mov = false;                        // tolera cuadros sueltos sin avance
  if (yaw !== undefined) a.frente = frenteEnPantalla(cam, Math.sin(yaw), Math.cos(yaw));
  a.x = x; a.z = z;
  return a;
}
const cuadroDe = (mov, tiempo, fase = 0) => mov ? (Math.floor((tiempo + fase) * 8) % 2 ? 'paso1' : 'paso2') : 'quieto';

// Dibuja el frame. `escena` = { mapa (crearMapa o canvas de rasterizarMapa), sim, pl, peds, burbujas, tiempo, ofr: { radio, medAng }, luz: { cielo, niebla }, objetivo, camino,
// personaje, dpr, reducido }. camino: pasos (celdas { x, y } en centro) del clic para caminar (G22), o null.
// objetivo: peatón al que se le puede ofrecer ahora (o null); se marca con una flecha amarilla (G23).
// dpr: píxeles del canvas por píxel CSS (main.js lo limita a 2). reducido: prefers-reduced-motion (sin pulsos ni rebotes).
export function dibujar(ctx, cam, escena) {
  const { mapa, sim, pl, peds, burbujas, tiempo, ofr, objetivo } = escena;
  const W = cam.w, H = cam.h, dpr = escena.dpr || 1, quieto = !!escena.reducido;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const luz = escena.luz;
  ctx.fillStyle = luz?.cielo ?? '#16171c';
  ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = false;
  // Mapa: el canvas rasterizado (N x N celdas) se dibuja con la transformada de la vista (zoom y rotación).
  {
    const c = Math.cos(cam.rot), s = Math.sin(cam.rot), k = cam.zoom;
    const e = W / 2 - k * (cam.x * c - cam.y * s), f = H / 2 - k * (cam.x * s + cam.y * c);
    ctx.save();
    ctx.transform(k * c, k * s, -k * s, k * c, e, f);
    dibujarSuelo(ctx, cam, mapa);
    ctx.restore();
  }
  // Luz de la jornada: tinte suave (soft-light) del color de la niebla, con un degradé vertical cacheado por tamaño y color.
  if (luz) {
    if (grad.luzW !== W || grad.luzH !== H || grad.luzCol !== luz.niebla) {
      const gr = ctx.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, hexA(luz.niebla, 0.42)); gr.addColorStop(1, hexA(luz.niebla, 0.18));
      Object.assign(grad, { luzW: W, luzH: H, luzCol: luz.niebla, luz: gr });
    }
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = grad.luz; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = hexA(luz.niebla, 0.08); ctx.fillRect(0, 0, W, H);
  }

  // Cono de ofrecer del jugador (celeste, en el suelo, con borde).
  if (pl && ofr) {
    const [sx, sy] = aPantalla(cam, pl.px, pl.py);
    const a = anguloPantalla(pl.heading, cam), r = ofr.radio * cam.zoom;
    const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    gr.addColorStop(0, 'rgba(120, 220, 255, 0.26)'); gr.addColorStop(1, 'rgba(120, 220, 255, 0.06)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.arc(sx, sy, r, a - ofr.medAng, a + ofr.medAng); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(150, 230, 255, 0.45)'; ctx.lineWidth = 1; ctx.stroke();
  }

  // Conos de visión de los agentes: degradé del color del estado, borde suave; en persecución, círculo que late.
  let hayPers = false;
  if (sim) for (const p of sim.agentes) {
    if (p.estado === 'persecucion') hayPers = true;
    if (!visible(cam, p.x, p.z, POLI_RADIO_PERS)) continue;
    if (!p.atento && p.estado !== 'persecucion' && p.estado !== 'alerta') continue;   // distraído: sin cono
    const [px, py] = aPantalla(cam, p.x, p.z);
    const pers = p.estado === 'persecucion';
    const rFov = (pers ? POLI_RADIO_PERS : radioVista(sim.ronda)) * cam.zoom;
    const col = COL_AG[p.estado] ?? COL_AG.patrulla;
    const late = pers && !quieto ? 0.06 * Math.sin(tiempo * 6) : 0;
    const gr = ctx.createRadialGradient(px, py, rFov * 0.08, px, py, rFov);
    gr.addColorStop(0, hexA(col, 0.34 + late)); gr.addColorStop(0.7, hexA(col, 0.16 + late)); gr.addColorStop(1, hexA(col, 0.03));
    ctx.fillStyle = gr;
    ctx.beginPath();
    if (pers) ctx.arc(px, py, rFov, 0, Math.PI * 2);
    else {
      const a = anguloPantalla(p.yaw, cam);
      ctx.moveTo(px, py); ctx.arc(px, py, rFov, a - POLI_FOV / 2, a + POLI_FOV / 2); ctx.closePath();
    }
    ctx.fill();
    ctx.strokeStyle = hexA(col, 0.22); ctx.lineWidth = 4; ctx.stroke();      // halo
    ctx.strokeStyle = hexA(col, 0.6); ctx.lineWidth = 1; ctx.stroke();       // borde
  }

  // Círculo de visión del helicóptero, en el suelo.
  if (sim?.heli) {
    hayPers = true;
    const [hx, hy] = aPantalla(cam, sim.heli.x, sim.heli.z), r = HELI_R * cam.zoom;
    ctx.fillStyle = hexA(HELI_COL, sim.heli.ve ? 0.3 : 0.16);
    ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = sim.heli.ve ? '#ffffff' : hexA(HELI_COL, 0.9); ctx.lineWidth = 2;
    ctx.setLineDash?.([10, 6]); ctx.stroke(); ctx.setLineDash?.([]);
  }
  if (sim?.patrullas.length) hayPers = true;

  // Camino del clic para caminar (G22): línea tenue desde el jugador por cada paso, y un anillo en el destino.
  if (pl && escena.camino?.length) {
    const [px, py] = aPantalla(cam, pl.px, pl.py);
    ctx.save();
    ctx.strokeStyle = hexA(OBJ_OFR_COL, 0.4); ctx.lineWidth = Math.max(2, cam.zoom * 0.12); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.setLineDash?.([cam.zoom * 0.25, cam.zoom * 0.2]);
    ctx.beginPath(); ctx.moveTo(px, py);
    for (const p of escena.camino) { const [sx, sy] = aPantalla(cam, p.x, p.y); ctx.lineTo(sx, sy); }
    ctx.stroke();
    ctx.setLineDash?.([]);
    const d = escena.camino[escena.camino.length - 1];
    const [dx, dy] = aPantalla(cam, d.x, d.y);
    const rr = Math.max(4, cam.zoom * 0.3) * (quieto ? 1 : 1 + 0.12 * Math.sin(tiempo * 5));
    ctx.strokeStyle = hexA(OBJ_OFR_COL, 0.7); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(dx, dy, rr, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Entidades con sprite, ordenadas por y de pantalla (las de abajo tapan a las de arriba).
  const p = escalaSprite(cam), sw = (ANCHO_SPRITE + 2) * p, sh = (ALTO_SPRITE + 2) * p;
  ordenados.length = 0;
  if (peds) for (const q of peds) {
    if (!visible(cam, q.x, q.z, 0.5)) continue;
    const [sx, sy] = aPantalla(cam, q.x, q.z);
    const a = animar(q, q.x, q.z, cam);
    const v = varianteDe(q), vista = a.frente ? 'frente' : 'espalda', cuadro = cuadroDe(a.mov, tiempo, a.fase);
    const img = sprites.obtener('P|' + v + '|' + vista + '|' + cuadro, () => spriteJugador(personajePeaton(v), a.frente ? 0 : Math.PI, cuadro));
    ordenados.push({ sy, sx, img, tipo: 'peat', ent: q });
  }
  if (sim) for (const ag of sim.agentes) {
    if (!visible(cam, ag.x, ag.z, 1)) continue;
    const [sx, sy] = aPantalla(cam, ag.x, ag.z);
    const a = animar(ag, ag.x, ag.z, cam, ag.yaw);
    const col = !ag.atento && (ag.estado === 'patrulla' || ag.estado === 'regreso') ? COL_AG.distraido : COL_AG[ag.estado] ?? COL_AG.patrulla, vista = a.frente ? 'frente' : 'espalda', cuadro = cuadroDe(a.mov, tiempo, a.fase);
    const img = sprites.obtener('A|' + col + '|' + vista + '|' + cuadro, () => spriteAgente(col, vista, cuadro));
    ordenados.push({ sy, sx, img, tipo: 'ag', ent: ag });
  }
  if (pl) {
    const [sx, sy] = aPantalla(cam, pl.px, pl.py);
    const per = completarPersonaje(escena.personaje);
    const [fx, fy] = dirPantalla(cam, Math.sin(pl.heading), Math.cos(pl.heading));
    const hPant = Math.atan2(fx, fy);                                   // rumbo en pantalla: abajo = de frente
    const cuadro = pl.spd > 0.05 ? (Math.floor(tiempo * (pl.corre ? 12 : 8)) % 2 ? 'paso1' : 'paso2') : 'quieto';
    const vista = Math.cos(hPant) >= 0 ? 'frente' : 'espalda';
    const img = sprites.obtener(claveJugador(per, vista, cuadro), () => spriteJugador(per, hPant, cuadro));
    ordenados.push({ sy, sx, img, tipo: 'jug', ent: pl });
  }
  ordenados.sort((a, b) => a.sy - b.sy);
  // Sombras bajo los pies (todas antes que los sprites, para que ninguna sombra pise un sprite).
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  for (const o of ordenados) { const yy = o.sy + sh / 2 - p; ctx.moveTo(o.sx + sw * 0.36, yy); ctx.ellipse(o.sx, yy, sw * 0.36, Math.max(1.5, p * 1.6), 0, 0, Math.PI * 2); }
  ctx.fill();
  for (const o of ordenados) {
    if (o.tipo === 'jug') {                                             // anillo bajo el jugador para ubicarlo
      ctx.strokeStyle = 'rgba(120, 220, 255, 0.85)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(o.sx, o.sy + sh / 2 - p, sw * 0.5, Math.max(2.5, p * 2.4), 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (o.img) ctx.drawImage(o.img, Math.round(o.sx - sw / 2), Math.round(o.sy - sh / 2), sw, sh);
  }

  // Indicador de memoria de los transeúntes (G35): punto con la letra, chico y a un costado de la cabeza.
  const br = Math.max(4, p * 3.2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(br * 1.35)}px system-ui, sans-serif`;
  for (const o of ordenados) {
    if (o.tipo !== 'peat') continue;
    const est = o.ent.mem?.est ?? 'N';
    const bx = o.sx + sw * 0.5, by = o.sy - sh * 0.42;
    ctx.fillStyle = MEM_COL[est] ?? MEM_COL.N; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.fillText(est, bx, by + 0.5);
  }

  // "!" de alerta con rebote sobre el agente en alerta visual.
  for (const o of ordenados) {
    if (o.tipo !== 'ag' || o.ent.estado !== 'alerta' || o.ent.aviso) continue;
    const salto = quieto ? 0 : Math.abs(Math.sin(tiempo * 9)) * Math.max(3, p * 3);
    const R = Math.max(7, cam.zoom * 0.28), cx = o.sx, cy = o.sy - sh / 2 - R - 2 - salto;
    ctx.fillStyle = '#ff5a1f'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(R * 1.5)}px system-ui, sans-serif`;
    ctx.fillText('!', cx, cy + 1);
  }
  ctx.textBaseline = 'alphabetic';

  // Vehículos de la búsqueda: patrullas en la calle y helicóptero en el aire.
  if (sim) for (const v of sim.patrullas) if (visible(cam, v.x, v.z, 2)) dibujarPatrulla(ctx, cam, v, tiempo, quieto);
  if (sim?.heli) dibujarHeli(ctx, cam, sim.heli, tiempo, quieto);

  // Flecha amarilla sobre el peatón objetivo de ofrecer (solo si hay uno en el cono) (G23).
  if (objetivo && visible(cam, objetivo.x, objetivo.z, 1)) {
    const [ox, oy] = aPantalla(cam, objetivo.x, objetivo.z);
    const bob = quieto ? 0 : Math.sin(tiempo * 6) * 2.5, L = Math.max(10, cam.zoom * 0.45), tip = oy - sh / 2 - 3 + bob;
    ctx.fillStyle = OBJ_OFR_COL; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(ox, tip); ctx.lineTo(ox - L * 0.6, tip - L); ctx.lineTo(ox + L * 0.6, tip - L); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  // Burbujas de texto (ventas, insultos, reacciones): globo con cola sobre la cabeza; el "+$" de venta, dorado y con chispas.
  if (burbujas) {
    const fs = Math.round(Math.max(12, cam.zoom * 0.42));
    for (const b of burbujas) {
      const [bx, by] = aPantalla(cam, b.x, b.z);
      const edad = Math.max(0, (tiempo - b.t0) / b.dur);
      if (edad >= 1) continue;
      const alfa = edad < 0.75 ? 1 : (1 - edad) / 0.25;
      const plata = b.tipo === 'venta' && b.texto.startsWith('+');
      ctx.globalAlpha = alfa;
      if (plata) {
        const y = by - sh * 0.6 - edad * cam.zoom * 1.4;
        if (edad < 0.55) chispas(ctx, bx, by - sh * 0.3, edad / 0.55, Math.max(10, cam.zoom * 0.9));
        ctx.font = `900 ${Math.round(fs * 1.25)}px system-ui, sans-serif`; ctx.textAlign = 'center';
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20, 40, 10, 0.9)'; ctx.lineJoin = 'round';
        ctx.strokeText(b.texto, bx, y);
        ctx.fillStyle = '#ffd94a'; ctx.fillText(b.texto, bx, y);
      } else {
        globo(ctx, bx, by - sh * 0.55 - (quieto ? 0 : edad * cam.zoom * 0.35), b.texto, b.tipo, fs, Math.min(1, edad * 8));
      }
      ctx.globalAlpha = 1;
    }
  }

  // Viñeta roja suave durante la persecución (degradé cacheado por tamaño; late salvo con movimiento reducido).
  if (hayPers) {
    if (grad.vinW !== W || grad.vinH !== H) {
      const R = Math.hypot(W, H) / 2, gr = ctx.createRadialGradient(W / 2, H / 2, R * 0.45, W / 2, H / 2, R);
      gr.addColorStop(0, 'rgba(224, 48, 48, 0)'); gr.addColorStop(1, 'rgba(200, 24, 24, 0.5)');
      Object.assign(grad, { vinW: W, vinH: H, vin: gr });
    }
    ctx.globalAlpha = quieto ? 0.7 : 0.6 + 0.25 * Math.sin(tiempo * 5);
    ctx.fillStyle = grad.vin; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  // Flechas en el borde hacia cada perseguidor fuera de la pantalla (G24): agentes, patrullas y helicóptero.
  if (sim && pl && hayPers) {
    const flecha = (x, z, col) => {
      const [sx, sy] = aPantalla(cam, x, z), f = flechaBorde(cam, sx, sy);
      if (!f) return;
      const S = 13 * (quieto ? 1 : 1 + 0.1 * Math.sin(tiempo * 8));
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.ang);
      ctx.fillStyle = col; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(S, 0); ctx.lineTo(-S * 0.6, -S * 0.7); ctx.lineTo(-S * 0.6, S * 0.7); ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.restore();
    };
    for (const a of sim.agentes) if (a.estado === 'persecucion') flecha(a.x, a.z, AG_COL.persecucion);
    for (const v of sim.patrullas) flecha(v.x, v.z, VEH_COL);
    if (sim.heli) flecha(sim.heli.x, sim.heli.z, HELI_COL);
  }
}

// Patrulla genérica vista desde arriba (1.7 x 0.9 celdas): carrocería, vidrio delantero y baliza naranja que titila.
function dibujarPatrulla(ctx, cam, v, tiempo, quieto) {
  const [x, y] = aPantalla(cam, v.x, v.z), k = cam.zoom;
  ctx.save(); ctx.translate(x, y); ctx.rotate(anguloPantalla(v.yaw, cam));
  ctx.fillStyle = 'rgba(0, 0, 0, .3)'; ctx.fillRect(-0.8 * k, -0.35 * k, 1.7 * k, 0.9 * k);
  ctx.fillStyle = VEH_COL; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
  ctx.fillRect(-0.85 * k, -0.45 * k, 1.7 * k, 0.9 * k); ctx.strokeRect(-0.85 * k, -0.45 * k, 1.7 * k, 0.9 * k);
  ctx.fillStyle = '#bfe4f2'; ctx.fillRect(0.2 * k, -0.35 * k, 0.28 * k, 0.7 * k);
  ctx.fillStyle = quieto || Math.floor(tiempo * 6) % 2 ? VEH_LUZ : '#fff';
  ctx.fillRect(-0.2 * k, -0.28 * k, 0.22 * k, 0.56 * k);
  ctx.restore();
}

// Helicóptero genérico: dibujado por encima (desplazado hacia arriba por la altura), con rotor que gira.
function dibujarHeli(ctx, cam, h, tiempo, quieto) {
  const [x, y0] = aPantalla(cam, h.x, h.z), k = cam.zoom, y = y0 - k * 1.8;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, .28)'; ctx.beginPath(); ctx.ellipse(x, y0, k * 0.9, k * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(x, y);
  ctx.fillStyle = HELI_COL; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
  ctx.fillRect(0, -0.12 * k, 1.5 * k, 0.24 * k); ctx.fillRect(1.35 * k, -0.4 * k, 0.15 * k, 0.8 * k);
  ctx.beginPath(); ctx.ellipse(0, 0, 0.8 * k, 0.5 * k, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#bfe4f2'; ctx.beginPath(); ctx.ellipse(-0.38 * k, 0, 0.3 * k, 0.28 * k, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(quieto ? 0.6 : tiempo * 18);
  ctx.strokeStyle = 'rgba(25, 25, 30, .8)'; ctx.lineWidth = Math.max(2, k * 0.12);
  ctx.beginPath(); ctx.moveTo(-1.5 * k, 0); ctx.lineTo(1.5 * k, 0); ctx.moveTo(0, -1.5 * k); ctx.lineTo(0, 1.5 * k); ctx.stroke();
  ctx.restore();
}

// Globo de diálogo con cola hacia abajo, centrado en x y con la base en y. escala (0..1): aparición rápida.
const GLOBO_COL = { mala: ['#7a1c1c', '#ff8a7a'], venta: ['#1d6a3a', '#8de0a6'], '': ['#20222c', '#9aa0b4'] };
function globo(ctx, x, y, texto, tipo, fs, escala) {
  const [fondo, borde] = GLOBO_COL[tipo] ?? GLOBO_COL[''];
  ctx.font = `700 ${fs}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = (ctx.measureText(texto).width || texto.length * fs * 0.55) + 14, h = fs + 10, r = Math.min(8, h / 2);
  ctx.save();
  ctx.translate(x, y); ctx.scale(0.85 + 0.15 * escala, 0.85 + 0.15 * escala);
  const x0 = -w / 2, y0 = -h - 6, t = 6;
  ctx.beginPath();
  ctx.moveTo(x0 + r, y0); ctx.lineTo(x0 + w - r, y0); ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  ctx.lineTo(x0 + w, y0 + h - r); ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  ctx.lineTo(t, y0 + h); ctx.lineTo(0, 0); ctx.lineTo(-t, y0 + h);                    // cola
  ctx.lineTo(x0 + r, y0 + h); ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  ctx.lineTo(x0, y0 + r); ctx.quadraticCurveTo(x0, y0, x0 + r, y0); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.translate(0, 2); ctx.fill(); ctx.translate(0, -2);   // sombra
  ctx.fillStyle = fondo; ctx.fill();
  ctx.strokeStyle = borde; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.fillText(texto, 0, y0 + h / 2 + 1);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

// Chispas doradas que salen del punto (x, y). k: avance 0..1. Sin estado: la posición sale de k y del índice.
function chispas(ctx, x, y, k, R) {
  const n = 10, d = R * (0.3 + k * 0.9), s = Math.max(1.5, R * 0.12 * (1 - k));
  ctx.fillStyle = k < 0.5 ? '#fff6c2' : '#ffd94a';
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + (i % 2) * 0.3, dd = d * (i % 2 ? 0.7 : 1);
    ctx.fillRect(x + Math.cos(a) * dd - s / 2, y + Math.sin(a) * dd - s / 2 - k * R * 0.3, s, s);
  }
}

// Escala entera de los sprites del jugador: el ancho del sprite (ANCHO_SPRITE píxeles) iguala el diámetro de un peatón.
// El radio del peatón es el mismo de siempre (max(2.5, zoom * 0.2)); peatones y agentes usan esta misma escala.
export function escalaSprite(cam) {
  return Math.max(1, Math.round(Math.max(2.5, cam.zoom * 0.2) / 6));
}

// Dibuja una grilla de sprite (personaje.js) con su esquina superior izquierda en (x0, y0), p píxeles de pantalla por píxel del sprite.
// Se usa en la vista previa del personaje (una vez por cambio); en la partida los sprites salen de la caché (sprites.js).
export function dibujarSprite(ctx, sprite, x0, y0, p) {
  for (let j = 0; j < sprite.alto; j++) for (let i = 0; i < sprite.ancho; i++) {
    const c = sprite.pixeles[j][i];
    if (!c) continue;
    ctx.fillStyle = c;
    ctx.fillRect(x0 + i * p, y0 + j * p, p, p);
  }
}

// Punto del borde de la pantalla (con margen) en la dirección de (sx, sy) desde el centro. null si (sx, sy) ya está en pantalla.
export function flechaBorde(cam, sx, sy, margen = 28) {
  const W = cam.w, H = cam.h;
  if (sx >= 0 && sx <= W && sy >= 0 && sy <= H) return null;
  const cx = W / 2, cy = H / 2, dx = sx - cx, dy = sy - cy;
  const kx = dx !== 0 ? (cx - margen) / Math.abs(dx) : Infinity;
  const ky = dy !== 0 ? (cy - margen) / Math.abs(dy) : Infinity;
  const k = Math.min(kx, ky);
  return { x: cx + dx * k, y: cy + dy * k, ang: Math.atan2(dy, dx) };
}

// Yaw de la simulación (0 = +z, forward = (sin, cos)) a ángulo de canvas (0 = +x, y crece hacia abajo), con el giro de la vista.
function anguloPantalla(yaw, cam) { return Math.atan2(Math.cos(yaw), Math.sin(yaw)) + cam.rot; }

// "#rrggbb" + alfa -> rgba(...). Para colores que no son hex se devuelve tal cual.
function hexA(hex, a) {
  if (!hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, Math.min(1, a))})`;
}
