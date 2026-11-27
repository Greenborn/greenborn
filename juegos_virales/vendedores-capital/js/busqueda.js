// Nivel de búsqueda (estrellas, 0 a 5) de la 2D. Sin DOM: lógica pura, se prueba en Node (tools/test_busqueda.mjs).
// Lo usa agentes.js, que aplica la respuesta de cada nivel. Constantes BUSQ_* propias.
//
// Cómo se gana: +1 estrella al vender a la vista de un agente (ventaVista) y +1 al empezar a correr a la vista de un agente
// (corridaVista). Un llamado de peatón que termina en que un agente te ve cuenta como venta vista. Tope BUSQ_MAX.
// Un mismo motivo no suma dos veces dentro de BUSQ_CD s (cooldown por motivo, así una venta no suma por cada agente que la ve).
//
// Respuesta por nivel (BUSQ_RESPUESTA): agentes a pie que persiguen, patrullas (vehículos por calles) y helicóptero.
//   1: 1 agente · 2: 2 agentes · 3: 4 agentes + 1 patrulla · 4: 4 agentes + 2 patrullas · 5: lo de 4 + helicóptero.
//
// Cómo se pierden (default propio, no especificado por el usuario):
//  - Zafar: ningún perseguidor te ve durante tPerder(nivel) s, todos están a más de distSafar(nivel) celdas y estás fuera del
//    círculo del helicóptero. Con más estrellas cuesta más: tiempo y distancia escalan por nivel. Al zafar el nivel vuelve a 0.
//  - Captura (con o sin coima aceptada): el nivel vuelve a 0.
//  - Puntos por zafar: PTS_ESCAPE x ptsEscapeMult(nivel) (x1, x1.5, x2, x2.5, x3).
//
// Activación por cercanía (agentes en cada esquina): con cientos de esquinas (mapa real) solo se simulan las que están dentro
// de BUSQ_R_ACTIVA del jugador, con tope BUSQ_MAX_ACTIVOS. indiceEsquinas() arma una grilla de cubetas una sola vez y
// esquinasCerca() consulta solo las cubetas vecinas: el costo no depende del total de esquinas. Depende solo de la lista de
// esquinas [{ x, z, ... }] que entregue la ciudad (procedural o real).

export const BUSQ_MAX = 5;
export const BUSQ_CD = 2;                 // s: cooldown por motivo para sumar otra estrella
export const BUSQ_PARPADEO = 1.2;         // s que parpadea el HUD al subir de nivel
export const BUSQ_RESPUESTA = [
  { agentes: 0, patrullas: 0, heli: false },
  { agentes: 1, patrullas: 0, heli: false },
  { agentes: 2, patrullas: 0, heli: false },
  { agentes: 4, patrullas: 1, heli: false },
  { agentes: 4, patrullas: 2, heli: false },
  { agentes: 4, patrullas: 2, heli: true },
];
// Zafar: tiempo base (POLI_T_PERDER) y distancia base (POLI_DIST_SAFAR) escalados por nivel: x (1 + paso x (nivel - 1)).
export const BUSQ_T_PASO = 0.15, BUSQ_D_PASO = 0.08;
// Activación por cercanía de los agentes de esquina (celdas). Reajustar con el mapa real.
export const BUSQ_R_ACTIVA = 40, BUSQ_MAX_ACTIVOS = 24, BUSQ_CUBETA = 16;

export const MOTIVOS = ['venta', 'corrida'];

export const crearBusqueda = () => ({ nivel: 0, cd: { venta: 0, corrida: 0 }, tSubida: -Infinity, sinVista: 0 });

// Suma una estrella por `motivo` en el instante t (s). Devuelve true si subió.
export function sumarEstrella(b, motivo, t) {
  if (!MOTIVOS.includes(motivo)) return false;
  if (t < b.cd[motivo]) return false;
  b.cd[motivo] = t + BUSQ_CD;
  if (b.nivel >= BUSQ_MAX) return false;
  b.nivel++; b.tSubida = t;
  return true;
}

export const respuesta = nivel => BUSQ_RESPUESTA[Math.max(0, Math.min(BUSQ_MAX, nivel | 0))];

// Parámetros para zafar con el nivel dado (tBase/dBase: POLI_T_PERDER y POLI_DIST_SAFAR de agentes.js).
export function safarParams(nivel, tBase, dBase) {
  const k = Math.max(0, nivel - 1);
  return { tPerder: tBase * (1 + BUSQ_T_PASO * k), dist: dBase * (1 + BUSQ_D_PASO * k) };
}

// x1, x1.5, x2, x2.5, x3 (más estrellas, más puntos, sin que farmear persecuciones domine el puntaje).
export const BUSQ_PTS_PASO = 0.5;
export const ptsEscapeMult = nivel => 1 + BUSQ_PTS_PASO * (Math.max(1, Math.min(BUSQ_MAX, nivel | 0)) - 1);

// Paso del contador para zafar. visto: algún perseguidor te ve; dMin: distancia al perseguidor más cercano; heliVe: estás
// en el círculo del helicóptero. Devuelve 'zafe' (y deja el nivel en 0) o null. Sin nivel no hace nada.
export function stepBusqueda(b, dt, { visto, dMin, heliVe = false }, tBase, dBase) {
  if (b.nivel <= 0) { b.sinVista = 0; return null; }
  const s = safarParams(b.nivel, tBase, dBase);
  if (visto || heliVe) { b.sinVista = 0; return null; }
  if (dMin <= s.dist) return null;              // cerca: no suma, pero tampoco reinicia (como agentes.js)
  b.sinVista += dt;
  if (b.sinVista >= s.tPerder) { const n = b.nivel; perderEstrellas(b); return { evento: 'zafe', nivel: n }; }
  return null;
}

export function perderEstrellas(b) { b.nivel = 0; b.sinVista = 0; }

// HUD: estrellas encendidas y si parpadea (subió hace menos de BUSQ_PARPADEO s).
export const hudEstrellas = (b, t) => ({ encendidas: b.nivel, total: BUSQ_MAX, parpadea: t - b.tSubida < BUSQ_PARPADEO });

// ---------- Activación por cercanía ----------

export function indiceEsquinas(esquinas, cubeta = BUSQ_CUBETA) {
  const celdas = new Map();
  esquinas.forEach((e, i) => {
    const k = Math.floor(e.x / cubeta) + ',' + Math.floor(e.z / cubeta);
    if (!celdas.has(k)) celdas.set(k, []);
    celdas.get(k).push(i);
  });
  return { esquinas, cubeta, celdas };
}

// Índices de las esquinas a menos de r del punto (x, z), las más cercanas primero, con tope max.
export function esquinasCerca(idx, x, z, r = BUSQ_R_ACTIVA, max = BUSQ_MAX_ACTIVOS) {
  const c = idx.cubeta, ci = Math.floor(x / c), cj = Math.floor(z / c), n = Math.ceil(r / c), out = [];
  for (let dj = -n; dj <= n; dj++) for (let di = -n; di <= n; di++) {
    const l = idx.celdas.get((ci + di) + ',' + (cj + dj));
    if (!l) continue;
    for (const i of l) {
      const e = idx.esquinas[i], d = Math.hypot(e.x - x, e.z - z);
      if (d <= r) out.push([i, d]);
    }
  }
  out.sort((a, b) => a[1] - b[1]);
  return out.slice(0, max).map(e => e[0]);
}

// Esquinas de cruce de calles de una grilla de manzanas (ciudad procedural): una por cruce, sobre la vereda.
// En el mapa real la lista sale de ciudad_real.js (misma forma { x, z, yaw }).
export function esquinasDeCruces(city, ciclo, manzana, walkable) {
  const out = [], n = city.N ?? Math.sqrt(city.C.length);
  for (let j = ciclo - 1; j < n - 1; j += ciclo) for (let i = ciclo - 1; i < n - 1; i += ciclo) {
    // celda de vereda en la esquina de la manzana que queda abajo-izquierda del cruce
    const vi = i - (ciclo - manzana), vj = j - (ciclo - manzana);
    if (walkable(city, vi, vj)) out.push({ x: vi + .5, z: vj + .5, yaw: Math.PI / 4 });
  }
  return out;
}

// Elige qué perseguidores sumar: de los agentes activos que no persiguen, los más cercanos al jugador hasta completar `quiero`.
export function asignarPerseguidores(agentes, jugador, quiero) {
  const ya = agentes.filter(a => a.estado === 'persecucion').length;
  if (ya >= quiero) return [];
  return agentes.filter(a => a.estado !== 'persecucion')
    .map(a => [a, Math.hypot(a.x - jugador.x, a.z - jugador.z)])
    .sort((a, b) => a[1] - b[1]).slice(0, quiero - ya).map(e => e[0]);
}
