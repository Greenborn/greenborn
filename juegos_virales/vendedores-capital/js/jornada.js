// Jornada de la 2D: momentos del día (mañana, mediodía, tarde), demanda, cantidad de peatones y luz (cielo y niebla). Sin DOM.
// Origen: 3D (`../index.html`, JORNADA y MOMENTO_INICIAL). La noche queda deshabilitada, como en la 3D.
//
// Cambio de momento según el tiempo de la ronda: la duración de la ronda (DURACION_RONDA, config.js) se divide en tres tramos
// iguales (mañana, mediodía, tarde). Pasado el final, queda en tarde. Cada ronda arranca en MOMENTO_INICIAL.
import { PEATONES_N, DURACION_RONDA } from './config.js';

export const JORNADA = [
  // dem: escala el peso de compra (ver peatones.js). peat: fracción de PEATONES_N que se mantiene en escena.
  { id: 'manana', nombre: 'Mañana', dem: 0.7, peat: 0.6, cielo: '#f1c8a0', niebla: '#f0c9a6' },
  { id: 'mediodia', nombre: 'Mediodía', dem: 1.3, peat: 1.0, cielo: '#a9dcf7', niebla: '#b8e2f8' },
  { id: 'tarde', nombre: 'Tarde', dem: 1.0, peat: 0.8, cielo: '#e98c45', niebla: '#e6a06a' },
  // 'noche' deshabilitada: fuera del ciclo (no se llega nunca). Para reactivarla, volver a agregar la entrada:
  // { id: 'noche', nombre: 'Noche', dem: 0.8, peat: 0.5, cielo: '#131b38', niebla: '#1a2448' },
];
// Momento con el que arranca cada ronda.
export const MOMENTO_INICIAL = 'manana';
// Duración de cada tramo (s): DURACION_RONDA / cantidad de momentos.
export const TRAMO = DURACION_RONDA / JORNADA.length;

export const jornadaPorId = id => JORNADA.find(j => j.id === id) ?? JORNADA[0];

// Momento que corresponde al tiempo transcurrido de la ronda (s). Tramos iguales; después del último, tarde.
export function momentoEn(tRonda) {
  const i = Math.min(JORNADA.length - 1, Math.max(0, Math.floor(tRonda / TRAMO)));
  return JORNADA[i];
}

// Cantidad de peatones en escena para un momento: PEATONES_N x peat.
export const cantidadPeatones = j => Math.round(PEATONES_N * j.peat);

// ---------- Luz: colores de cielo y niebla con transición suave ----------

const aRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const aHex = rgb => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

// Mezcla de dos colores hex (t en 0..1). Cada canal avanza al menos 1 nivel hacia el destino, así el redondeo no la estanca.
export function mezclarColor(a, b, t) {
  const A = aRgb(a), B = aRgb(b);
  return aHex(A.map((v, i) => {
    const d = B[i] - v;
    if (d === 0) return v;
    let paso = d * t;
    if (Math.abs(paso) < 1) paso = Math.sign(d);
    return Math.abs(paso) > Math.abs(d) ? B[i] : v + paso;
  }));
}

// Acerca la luz actual al objetivo: fracción exponencial por segundo (vel). Con vel 0.8 se llega en unos 3 s.
export function acercarLuz(actual, objetivo, dt, vel = 0.8) {
  const t = 1 - Math.exp(-vel * dt);
  return {
    cielo: mezclarColor(actual.cielo, objetivo.cielo, t),
    niebla: mezclarColor(actual.niebla, objetivo.niebla, t),
  };
}

export const luzDe = j => ({ cielo: j.cielo, niebla: j.niebla });
