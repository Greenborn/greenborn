// Minimapas (F7, G28 y M8). Dos vistas, ambas en canvas que pasa el llamador:
//   dibujarMinimapa: vista local de ±R celdas alrededor del jugador, rotada con la cámara (arriba = arriba de la vista).
//                    Marca al jugador (flecha según su rumbo) y a los agentes. Va en la esquina del HUD.
//   dibujarMapaSeleccion: ciudad completa, sin rotación, con el color de cada barrio (y en el mapa real, el nombre de cada
//                    uno en su centroide). Va en la pantalla de zona.
import { perfilesDe } from './barrios.js';
import { AG_COL, VEH_COL, HELI_COL } from './config.js';
import { HELI_R } from './vehiculos.js';

const FUERA = [30, 30, 36];
const TINTE = 0.2;   // fuerza del color de barrio en el minimapa local y en el de selección

const rgba = ([r, g, b]) => (255 << 24 | b << 16 | g << 8 | r) >>> 0;   // Uint32 little-endian
const rgbDe = hex => [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16));
const mezcla = (a, b, t) => a.map((v, k) => v * (1 - t) + b[k] * t);
const COLOR_TERRENO = { road: [74, 77, 85], bld: [150, 138, 118], park: [95, 160, 74], side: [217, 212, 199], tree: [45, 90, 42], water: [58, 122, 160] };

// Color de cada celda (Uint32), calculado una vez por ciudad: el bucle de píxeles no crea arrays.
const cacheCelda = new WeakMap();
function coloresCelda(city) {
  if (cacheCelda.has(city)) return cacheCelda.get(city);
  const n = city.N, out = new Uint32Array(n * n);
  const colBarrio = perfilesDe(city).map(b => rgbDe(b.col));   // un color por barrio de esta ciudad (real o grilla)
  for (let q = 0; q < n * n; q++) {
    const cel = city.C[q];
    const base = cel.deco === 'tree' ? COLOR_TERRENO.tree : COLOR_TERRENO[cel.t] ?? COLOR_TERRENO.side;
    // Mapa real: los edificios también se tiñen (más suave) para distinguir los barrios; el agua y los árboles, no.
    const t = cel.deco === 'tree' || cel.t === 'water' ? 0 : cel.t === 'bld' ? (city.real ? TINTE * 1.6 : 0) : TINTE;
    out[q] = rgba(t ? mezcla(base, colBarrio[city.zona[q]], t) : base);
  }
  cacheCelda.set(city, out);
  return out;
}

let imgLocal = null, pixLocal = null;
const R_CELDAS = 30;   // radio visible del minimapa local, en celdas

// Minimapa local rotado. pl = { px, py, heading }; cam = { rot }; agentes = lista con { x, z, estado }.
// veh: { patrullas, heli } (la simulación). Los perseguidores fuera del alcance se marcan pegados al borde.
export function dibujarMinimapa(cv, city, pl, cam, agentes = [], veh = null) {
  const g = cv.getContext('2d'), S = cv.width, k = (2 * R_CELDAS) / S, n = city.N;
  if (!imgLocal || imgLocal.width !== S) { imgLocal = g.createImageData(S, S); pixLocal = new Uint32Array(imgLocal.data.buffer); }
  const cols = coloresCelda(city), c = Math.cos(cam.rot), s = Math.sin(cam.rot);
  const fuera = rgba(FUERA);
  // Pantalla -> mundo (inversa de la rotación de la vista). u = derecha, v = abajo, en celdas.
  // Por columna x suma (k·c, -k·s); por fila y suma (k·s, k·c). Se arranca en la esquina superior izquierda.
  // Esquina (u0, v0) = (-S/2·k, -S/2·k): dx = u·c + v·s y dz = -u·s + v·c.
  const u0 = -S / 2 * k;
  let rowX = pl.px + u0 * (c + s), rowZ = pl.py + u0 * (c - s);
  let o = 0;
  for (let y = 0; y < S; y++, rowX += k * s, rowZ += k * c) {
    let wx = rowX, wz = rowZ;
    for (let x = 0; x < S; x++, o++, wx += k * c, wz += -k * s) {
      const wi = Math.floor(wx), wj = Math.floor(wz);
      pixLocal[o] = (wi >= 0 && wj >= 0 && wi < n && wj < n) ? cols[wj * n + wi] : fuera;
    }
  }
  g.putImageData(imgLocal, 0, 0);

  // Agentes: posición relativa al jugador, girada a la vista (u = dx·c - dz·s, v = dx·s + dz·c).
  const aMini = (x, z, pegar) => {
    const dx = x - pl.px, dz = z - pl.py;
    let px = S / 2 + (dx * c - dz * s) / k, py = S / 2 + (dx * s + dz * c) / k;
    if (px < 3 || py < 3 || px > S - 3 || py > S - 3) {
      if (!pegar) return null;
      px = Math.max(4, Math.min(S - 4, px)); py = Math.max(4, Math.min(S - 4, py));
    }
    return [px, py];
  };
  const marca = (p, col, lado, borde = '#000') => {
    const m = (lado - 1) / 2, x = Math.round(p[0]), y = Math.round(p[1]);
    g.fillStyle = col; g.fillRect(x - m, y - m, lado, lado);
    g.strokeStyle = borde; g.lineWidth = 1; g.strokeRect(x - m - .5, y - m - .5, lado, lado);
  };
  for (const a of agentes) {
    const persigue = a.estado === 'persecucion', p = aMini(a.x, a.z, persigue);
    if (!p) continue;
    const col = persigue ? '#ff3b30' : a.estado === 'alerta' ? '#ff9a3d' : a.atento === false ? AG_COL.distraido : '#ffd24a';
    marca(p, col, persigue ? 7 : 5, persigue ? '#fff' : '#000');
  }
  for (const v of veh?.patrullas ?? []) marca(aMini(v.x, v.z, true), VEH_COL, 9, '#fff');
  const h = veh?.heli;
  if (h) {
    const p = aMini(h.x, h.z, true);
    g.strokeStyle = HELI_COL; g.lineWidth = 2; g.beginPath(); g.arc(p[0], p[1], HELI_R / k, 0, Math.PI * 2); g.stroke();
    marca(p, HELI_COL, 7, '#fff');
  }

  // Jugador: triángulo que apunta según su rumbo en la vista (0 = hacia arriba de la vista).
  const fx = Math.sin(pl.heading), fz = Math.cos(pl.heading);
  const tu = fx * c - fz * s, tv = fx * s + fz * c;
  g.save(); g.translate(S / 2, S / 2); g.rotate(Math.atan2(tu, -tv));
  g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(-5, 5); g.closePath(); g.fill(); g.stroke();
  g.restore();
}

// Ciudad completa (sin rotación) en un canvas cuadrado. elegida = índice de barrio resaltado, o -1 (todos iguales).
// Con elegida >= 0 los demás barrios se atenúan. Bordes negros donde cambia el barrio.
export function dibujarMapaSeleccion(cv, city, elegida = -1) {
  const g = cv.getContext('2d'), S = cv.width, n = city.N;
  const img = g.createImageData(S, S), d = new Uint32Array(img.data.buffer);
  const cols = coloresCelda(city);
  const zp = (x, y) => city.zona[Math.floor((y + .5) * n / S) * n + Math.floor((x + .5) * n / S)];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const wi = Math.floor((x + .5) * n / S), wj = Math.floor((y + .5) * n / S);
    const z = city.zona[wj * n + wi];
    const borde = (x + 1 < S && zp(x + 1, y) !== z) || (y + 1 < S && zp(x, y + 1) !== z);
    let col = borde ? rgba([0, 0, 0]) : cols[wj * n + wi];
    if (!borde && elegida >= 0 && z !== elegida) {   // atenuado fuera del barrio elegido
      const r = col & 255, gg = (col >> 8) & 255, b = (col >> 16) & 255;
      col = rgba([r * .45, gg * .45, b * .45]);
    }
    d[y * S + x] = col;
  }
  g.putImageData(img, 0, 0);
  // Obelisco: punto blanco en el centro de la ciudad.
  g.fillStyle = '#fff'; g.fillRect(S / 2 - 1, S / 2 - 1, 3, 3);
  if (city.barrios) rotularBarrios(g, city, S, elegida);
}

// Nombre de cada barrio real en su centroide, sin salirse del canvas. El elegido va en amarillo.
function rotularBarrios(g, city, S, elegida) {
  g.save();
  g.font = `700 ${Math.max(9, Math.round(S / 24))}px system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 3; g.strokeStyle = 'rgba(0, 0, 0, .85)';
  city.barrios.forEach((b, z) => {
    if (!b?.centro) return;
    const medio = g.measureText(b.nombre).width / 2 + 2;
    const x = Math.max(medio, Math.min(S - medio, b.centro.i * S / city.N));
    const y = Math.max(7, Math.min(S - 7, b.centro.j * S / city.N));
    g.strokeText(b.nombre, x, y);
    g.fillStyle = z === elegida ? '#ffd24a' : '#fff';
    g.fillText(b.nombre, x, y);
  });
  g.restore();
}
