// Tránsito: autos particulares por las calzadas (celdas 'road') y atropello del jugador. Sin DOM (tools/test_transito.mjs).
// No son las patrullas de la búsqueda (vehiculos.js); de ahí se reutiliza la red principal de calles (ciudadCalles) y calleCerca.
//
// Pool: solo existen los autos cercanos al jugador (hasta TR_AUTOS). Aparecen fuera de la vista y se quitan al quedar lejos.
// Recorrido: cada auto lleva por delante una lista de celdas ya decidida (pts), por la mano derecha, que sigue las calles
// torcidas del mapa real, dobla en algunos cruces y, solo sin otra salida, vuelve para atrás.
//
// "Mirar antes de cruzar": el conductor mira su recorrido TR_MIRA celdas adelante. Si el jugador está en la calzada sobre ese
// recorrido, tarda TR_REACCION s en reaccionar, toca bocina y frena hasta TR_FRENO. Con margen frena a tiempo; si el jugador
// cruza demasiado cerca, no llega. Solo atropella el frente del auto, andando a más de TR_V_ATROPELLO y con el jugador en la
// calzada (la vereda es siempre segura). Por peatones, agentes y el jugador protegido el auto frena en seco: nunca los atropella.
import { ciudadCalles, calleCerca } from './vehiculos.js';
import { walkable, ladoDe } from './ciudad.js';
import {
  TR_AUTOS, TR_VEL_MIN, TR_VEL_MAX, TR_VEL_GIRO, TR_ACEL, TR_FRENO, TR_REACCION, TR_MIRA, TR_V_ATROPELLO, TR_LARGO,
  TR_ANCHO, TR_CORREDOR, TR_MARGEN, TR_SPAWN_MIN, TR_SPAWN_MAX, TR_SPAWN_ANCHO, TR_LEJOS_EXTRA, TR_P_GIRO,
  TR_GRACIA, TR_ESPERA_MAX, TR_BOCINA_D, TR_BOCINA_CD, TR_PASO_T, TR_AVISO_LATERAL, TR_COLORES,
} from './config.js';

const PUNTOS = Math.ceil(TR_MIRA) + 3;   // celdas que cada auto tiene decididas por delante
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const TR_IGNORA_T = 2;                   // s que un auto trabado por otro auto o un NPC los ignora para destrabarse

export function crearTransito(city, { rnd = Math.random } = {}) {
  return { city, calles: ciudadCalles(city), autos: [], eventos: [], rnd, id: 0, gracia: TR_GRACIA };
}

// Sin autos y con el período de gracia (arranque de partida o de ronda).
export function resetTransito(tr) {
  tr.autos.length = 0; tr.eventos.length = 0; tr.gracia = TR_GRACIA;
}

const esCalle = (c, i, j) => i >= 0 && j >= 0 && i < c.N && j < c.N && c.C[j * c.N + i].t === 'road';
export const enCalzada = (tr, x, z) => esCalle(tr.calles, Math.floor(x), Math.floor(z));

// Celda caminable que no es calzada, la más cercana a (x, z) por anillos; null si no hay. Para ubicar al jugador.
export function celdaSegura(city, x, z, rMax) {
  const ci = Math.floor(x), cj = Math.floor(z);
  for (let r = 0; r <= rMax; r++)
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      const i = ci + di, j = cj + dj;
      if (walkable(city, i, j) && city.C[j * ladoDe(city) + i].t !== 'road') return { i, j };
    }
  return null;
}

// Celdas de calle seguidas desde (i, j) hacia d (sin contar la de partida), hasta max.
function tramo(c, i, j, d, max) {
  let n = 0;
  while (n < max && esCalle(c, i + d[0] * (n + 1), j + d[1] * (n + 1))) n++;
  return n;
}

// Decide una celda más del recorrido.
function extender(tr, a) {
  const c = tr.calles, { i, j } = a.pts[a.pts.length - 1], d = a.dir;
  const der = [-d[1] || 0, d[0]], izq = [d[1], -d[0] || 0];
  const lados = tr.rnd() < 0.5 ? [der, izq] : [izq, der];
  const agregar = (ni, nj, dir = d) => { a.dir = dir; a.pts.push({ i: ni, j: nj }); a.sinGiro--; };
  // Doblar en un cruce: solo si hacia el costado hay una calle larga (no el ancho de la propia).
  if (a.sinGiro <= 0 && tr.rnd() < TR_P_GIRO) {
    for (const t of lados) if (tramo(c, i, j, t, 8) >= 8) { agregar(i + t[0], j + t[1], t); a.sinGiro = 10; return; }
  }
  const fi = i + d[0], fj = j + d[1];
  if (esCalle(c, fi, fj)) {
    // Mano derecha: se corre al carril de la derecha si hay exactamente uno libre de ese lado.
    if (esCalle(c, fi + der[0], fj + der[1]) && !esCalle(c, fi + 2 * der[0], fj + 2 * der[1])) agregar(fi + der[0], fj + der[1]);
    else agregar(fi, fj);
    return;
  }
  for (const l of [der, izq]) if (esCalle(c, fi + l[0], fj + l[1])) { agregar(fi + l[0], fj + l[1]); return; }   // calle torcida
  let mejor = null, largo = 0;
  for (const t of lados) { const n = tramo(c, i, j, t, 8); if (n > largo) { largo = n; mejor = t; } }
  if (mejor) { agregar(i + mejor[0], j + mejor[1], mejor); a.sinGiro = 6; return; }
  const atras = [-d[0] || 0, -d[1] || 0];
  if (esCalle(c, i + atras[0], j + atras[1])) agregar(i + atras[0], j + atras[1], atras);
  else a.sinSalida = true;
}

function completar(tr, a) { while (a.pts.length < PUNTOS && !a.sinSalida) extender(tr, a); }

// Auto nuevo en la celda de calle (i, j) rumbo a dir ([dx, dz]).
export function crearAuto(tr, i, j, dir, vel = TR_VEL_MIN + tr.rnd() * (TR_VEL_MAX - TR_VEL_MIN)) {
  const a = {
    id: ++tr.id, x: i + .5, z: j + .5, yaw: Math.atan2(dir[0], dir[1]), dir, pts: [{ i, j }], u: 0, v: vel, vMax: vel,
    sinGiro: 3, sinSalida: false, reac: null, tBocina: 0, frena: false, avisa: false, trabado: 0, ignora: 0,
    color: TR_COLORES[Math.floor(tr.rnd() * TR_COLORES.length)],
  };
  completar(tr, a);
  return a;
}

// Distancias de aparición según el radio de la vista (celdas): fuera de la pantalla y nunca encima del jugador.
export function anilloSpawn(vista = 0) {
  const min = Math.min(TR_SPAWN_MAX, Math.max(TR_SPAWN_MIN, vista + 3));
  return { min, max: min + TR_SPAWN_ANCHO };
}

// Intenta crear un auto en el anillo alrededor del jugador; la mayoría viene hacia su lado. Devuelve el auto o null.
export function aparecer(tr, pl, vista = 0) {
  const { min, max } = anilloSpawn(vista), c = tr.calles;
  const ang = tr.rnd() * Math.PI * 2, r = min + tr.rnd() * (max - min);
  const cel = calleCerca(c, pl.px + Math.cos(ang) * r, pl.py + Math.sin(ang) * r, 5);
  if (!cel) return null;
  let { i, j } = cel;
  const dx = pl.px - i, dz = pl.py - j;
  const largas = DIRS.filter(d => tramo(c, i, j, d, 8) >= 5);
  if (!largas.length) return null;
  const vienen = largas.filter(d => d[0] * dx + d[1] * dz > 0);
  const lista = vienen.length && tr.rnd() < 0.7 ? vienen : largas;
  const d = lista[Math.floor(tr.rnd() * lista.length)], der = [-d[1] || 0, d[0]];
  if (esCalle(c, i + der[0], j + der[1]) && !esCalle(c, i + 2 * der[0], j + 2 * der[1])) { i += der[0]; j += der[1]; }
  if (Math.hypot(i + .5 - pl.px, j + .5 - pl.py) < min) return null;
  if (tr.autos.some(o => Math.hypot(o.x - i - .5, o.z - j - .5) < 4)) return null;
  const a = crearAuto(tr, i, j, d);
  tr.autos.push(a);
  return a;
}

// Punto (x, z) respecto del recorrido del auto: { gap: distancia desde el frente a lo largo del recorrido, lat: distancia
// lateral } del primer tramo que pasa a `ancho` o menos, o null. Lo que ya quedó detrás del centro del auto no cuenta.
export function enRecorrido(a, x, z, ancho = TR_CORREDOR, mira = TR_MIRA) {
  const alcance = mira + TR_LARGO;
  if (Math.abs(x - a.x) > alcance || Math.abs(z - a.z) > alcance) return null;
  let ax = a.x, az = a.z, acum = 0;
  for (let k = 1; k < a.pts.length && acum < alcance; k++) {
    const bx = a.pts[k].i + .5, bz = a.pts[k].j + .5, dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
    if (L > 1e-6) {
      let t = ((x - ax) * dx + (z - az) * dz) / L;
      const detras = k === 1 && t < 0;
      t = Math.max(0, Math.min(L, t));
      const lat = Math.hypot(x - ax - dx / L * t, z - az - dz / L * t);
      if (!detras && lat <= ancho) { const gap = acum + t - TR_LARGO / 2; return gap <= mira ? { gap, lat } : null; }
      acum += L;
    }
    ax = bx; az = bz;
  }
  return null;
}

// Velocidad con la que todavía se frena dentro de `gap` celdas (dejando TR_MARGEN).
const velPermitida = gap => Math.sqrt(2 * TR_FRENO * Math.max(0, gap - TR_MARGEN));

// ¿Pisar (x, z) es meterse delante de un auto que llega en menos de t segundos? Lo usa el camino por clic (mira antes de cruzar).
export function hayPeligro(tr, x, z, t = TR_PASO_T) {
  if (!enCalzada(tr, x, z)) return false;
  return tr.autos.some(a => {
    if (a.v <= TR_V_ATROPELLO) return false;
    const r = enRecorrido(a, x, z);
    return !!r && r.gap > -TR_LARGO / 2 && r.gap < a.v * t;
  });
}

// Camino por clic: ¿conviene esperar antes de avanzar hacia (dx, dy)? Sí, si más adelante se pisa el paso de un auto que
// llega. Si ya está en ese paso, no: sigue para salir. Con teclado o joystick no se usa: mirar es cosa del jugador.
const MIRA_PASOS = [0.35, 0.8, 1.25];    // celdas hacia adelante que revisa
export function miraAlCruzar(tr, pl, dx, dy) {
  if (hayPeligro(tr, pl.px, pl.py)) return false;
  return MIRA_PASOS.some(d => hayPeligro(tr, pl.px + dx * d, pl.py + dy * d));
}

// ¿El frente del auto está tocando el punto? (en el marco del auto: adelante y de costado)
export function golpea(a, x, z) {
  const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), dx = x - a.x, dz = z - a.z;
  const ade = dx * fx + dz * fz, lat = Math.abs(dx * fz - dz * fx);
  return ade >= TR_LARGO / 2 - 0.5 && ade <= TR_LARGO / 2 + 0.15 && lat <= TR_ANCHO / 2 + 0.15;
}

function moverAuto(tr, a, avance) {
  while (avance > 0 && a.pts.length > 1) {
    const p = a.pts[0], q = a.pts[1], L = Math.hypot(q.i - p.i, q.j - p.j), resta = L * (1 - a.u);
    if (avance < resta) { a.u += avance / L; break; }
    avance -= resta; a.u = 0; a.pts.shift();
    completar(tr, a);
  }
  const p = a.pts[0], q = a.pts[1] ?? p;
  a.x = p.i + .5 + (q.i - p.i) * a.u; a.z = p.j + .5 + (q.j - p.j) * a.u;
  const m = a.pts[Math.min(2, a.pts.length - 1)];   // rumbo hacia dos celdas adelante: suaviza las diagonales y los giros
  const dx = m.i + .5 - a.x, dz = m.j + .5 - a.z;
  if (Math.hypot(dx, dz) > 0.2) a.yaw = Math.atan2(dx, dz);
}

// ¿Dobla dentro de las próximas celdas?
function girando(a) {
  const n = Math.min(4, a.pts.length - 1);
  if (n < 2) return a.sinSalida;
  const p = a.pts, d0x = p[1].i - p[0].i, d0z = p[1].j - p[0].j, d1x = p[n].i - p[n - 1].i, d1z = p[n].j - p[n - 1].j;
  return (d0x * d1x + d0z * d1z) <= 0;
}

// Un paso del tránsito. pl: jugador ({ px, py }). opts: npcs (listas de peatones y agentes con { x, z }), protegido (el
// jugador no puede ser atropellado: captura, ronda vendida), vista (radio visible en celdas), max (autos simultáneos).
// Devuelve { atropello }. tr.eventos recibe { t: 'bocina' | 'frenada' | 'atropello', x, z } (los consume main.js).
export function stepTransito(tr, pl, dt, { npcs = [], protegido = false, vista = 0, max = TR_AUTOS } = {}) {
  if (tr.gracia > 0) tr.gracia -= dt;
  const seguro = protegido || tr.gracia > 0;
  const { max: rMax } = anilloSpawn(vista), lejos = rMax + TR_LEJOS_EXTRA;
  for (let k = tr.autos.length - 1; k >= 0; k--) {
    const a = tr.autos[k], d = Math.hypot(a.x - pl.px, a.z - pl.py);
    if (d > lejos || (a.sinSalida && a.pts.length < 2 && d > anilloSpawn(vista).min)) tr.autos.splice(k, 1);
  }
  if (tr.autos.length > max) tr.autos.length = max;
  for (let k = 0; k < 3 && tr.autos.length < max; k++) aparecer(tr, pl, vista);

  // Solo importan los peatones y agentes que están en la calzada.
  const enLaCalle = [];
  for (const lista of npcs) for (const p of lista) if (enCalzada(tr, p.x, p.z)) enLaCalle.push(p);
  const jugadorEnCalle = enCalzada(tr, pl.px, pl.py);
  let atropello = false;
  for (const a of tr.autos) {
    if (a.tBocina > 0) a.tBocina -= dt;
    if (a.ignora > 0) a.ignora -= dt;
    let objetivo = girando(a) ? Math.min(TR_VEL_GIRO, a.vMax) : a.vMax;
    let tope = Infinity;                       // freno en seco (NPC, jugador protegido, otro auto)
    if (a.ignora <= 0) {
      for (const p of enLaCalle) {
        const r = enRecorrido(a, p.x, p.z);
        if (r && r.gap > -0.3) tope = Math.min(tope, velPermitida(r.gap));
      }
      const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
      for (const o of tr.autos) {
        if (o === a) continue;
        const dot = fx * Math.sin(o.yaw) + fz * Math.cos(o.yaw);
        if (dot < -0.3 || (dot < 0.5 && o.id > a.id)) continue;   // de frente: otro carril; cruzados: pasa el más antiguo
        const r = enRecorrido(a, o.x, o.z, 0.7, 6);
        if (r && r.gap > 0) tope = Math.min(tope, velPermitida(r.gap - TR_LARGO / 2));
      }
    }
    // El jugador en el recorrido.
    const r = jugadorEnCalle ? enRecorrido(a, pl.px, pl.py) : null;
    let frenaJug = Infinity;
    if (r && r.gap > -0.3) {
      if (seguro) tope = Math.min(tope, velPermitida(r.gap));
      else {
        a.reac = a.reac === null ? TR_REACCION : a.reac - dt;
        if (a.v > 0.5 && r.gap < TR_BOCINA_D && a.tBocina <= 0) {
          a.tBocina = TR_BOCINA_CD;
          const urgente = a.v > velPermitida(r.gap);
          tr.eventos.push({ t: urgente ? 'frenada' : 'bocina', x: a.x, z: a.z });
        }
        // Arrancando desde quieto ya lo está mirando: no avanza sobre él.
        if (a.reac <= 0 || a.v <= TR_V_ATROPELLO) frenaJug = velPermitida(r.gap);
      }
    } else a.reac = null;
    objetivo = Math.min(objetivo, frenaJug);
    const antes = a.v;
    if (objetivo < a.v) a.v = Math.max(objetivo, a.v - TR_FRENO * dt);
    else a.v = Math.min(objetivo, a.v + TR_ACEL * dt);
    if (a.v > tope) a.v = tope;
    a.frena = a.v < antes - 1e-3 || a.v < 0.1;
    // Trabado por otro auto o un NPC: al rato los ignora para no quedar clavado.
    if (a.v < 0.2 && tope < 0.2 && !r) { if ((a.trabado += dt) > TR_ESPERA_MAX) { a.trabado = 0; a.ignora = TR_IGNORA_T; } }
    else a.trabado = 0;
    moverAuto(tr, a, a.v * dt);
    // Aviso: viene hacia donde está el jugador (flecha en el borde y ruido de motor).
    a.avisa = a.v > TR_V_ATROPELLO && !!enRecorrido(a, pl.px, pl.py, TR_AVISO_LATERAL);
    if (!atropello && !seguro && jugadorEnCalle && a.v > TR_V_ATROPELLO && golpea(a, pl.px, pl.py)) {
      atropello = true;
      tr.eventos.push({ t: 'atropello', x: a.x, z: a.z });
    }
  }
  return { atropello };
}
