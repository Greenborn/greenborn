// Caminar con clic o toque (G22): el jugador sigue un camino de celdas hasta el destino. Sin DOM, para probarlo en Node.
// El camino sale del A* de rutas.js (8 direcciones, sin cortar esquinas, suavizado en rectas caminables). La entrada manual (teclado, joystick o flechas)
// cancela el camino. Si el jugador queda trabado (choque contra un árbol o una esquina) el camino también se cancela.
// Las coordenadas son en celdas (x = i + decimales, y = j + decimales), en la misma convención que pl.px / pl.py.
import { celdaCaminableMasCerca, walkable, ladoDe } from './ciudad.js';
import { buscarRuta, lineaCaminable } from './rutas.js';

export const CAMINO_RADIO = 6;   // celdas: radio de búsqueda de la celda caminable más cercana cuando el clic cae en una no caminable
const LLEGADA = 0.18;            // distancia (celdas) al centro de un paso para darlo por hecho
const UMBRAL_MOV = 0.01;         // magnitud mínima de la entrada manual para contar como movimiento
const AVANCE_MIN = 0.3;          // celdas que hay que avanzar para reiniciar el contador de trabado
const TRABADO_S = 0.6;           // segundos sin avanzar lo suficiente para cancelar el camino
export const CAMINO_MAX_NODOS = 80000;   // tope del A* por clic (en el mapa real, un destino sin acceso no recorre toda la ciudad)

export function crearCamino() {
  return { activo: false, pasos: [], destino: null, quieto: 0, ref: null };
}

// Plan para ir de `desde` a `clic` (ambos en celdas). Devuelve { destino, pasos } o null si no hay camino.
// `pasos` son los puntos de paso { i, j } (celdas), sin la celda de origen. Si el clic cae en una celda no caminable,
// el destino es la celda caminable más cercana (si hay una dentro de CAMINO_RADIO); nunca se camina a una no caminable.
export function planearCamino(city, desde, clic) {
  const ci = Math.floor(clic.x), cj = Math.floor(clic.y);
  const n = ladoDe(city);
  if (ci < 0 || cj < 0 || ci >= n || cj >= n) return null;
  const destino = walkable(city, ci, cj)
    ? { i: ci, j: cj }
    : celdaCaminableMasCerca(city, clic.x, clic.y, CAMINO_RADIO);
  if (!destino) return null;
  const origen = { i: Math.floor(desde.x), j: Math.floor(desde.y) };
  const pasos = buscarRuta(city, origen, destino, { suave: true, maxNodos: CAMINO_MAX_NODOS });
  if (!pasos) return null;
  // La ruta se suaviza desde el centro de la celda de origen: si desde la posición real la primera recta roza un
  // obstáculo, se pasa antes por ese centro.
  if (pasos.length && walkable(city, origen.i, origen.j) &&
    !lineaCaminable(city, desde.x, desde.y, pasos[0].i + .5, pasos[0].j + .5)) pasos.unshift(origen);
  return { destino, pasos };
}

// Activa un plan (salida de planearCamino). Un plan sin pasos (ya estás en el destino) no deja el camino activo.
export function iniciarCamino(camino, plan) {
  camino.pasos = plan.pasos.map(c => ({ x: c.i + .5, y: c.j + .5 }));
  camino.destino = plan.destino;
  camino.activo = camino.pasos.length > 0;
  camino.quieto = 0;
  camino.ref = null;
}

export function cancelarCamino(camino) {
  camino.activo = false;
  camino.pasos = [];
  camino.destino = null;
  camino.quieto = 0;
  camino.ref = null;
}

// ¿Hay movimiento manual? inp = { dx, dy } (lectura de controles, en coordenadas de la ciudad).
export const hayEntradaManual = inp => Math.hypot(inp.dx, inp.dy) > UMBRAL_MOV;

// Un cuadro de caminata. pos = { x, y } del jugador; inp = lectura de controles; dt en segundos.
// Devuelve { dx, dy, manual, llego }:
//  - manual: true si hubo entrada manual. El camino se cancela y el llamador usa dx, dy de inp (la entrada manual manda).
//  - si no hay entrada manual y el camino está activo: dx, dy es la dirección unitaria hacia el próximo paso.
//  - llego: true en el cuadro en que el camino termina (destino alcanzado o trabado).
export function pasoCamino(camino, pos, inp, dt) {
  if (hayEntradaManual(inp)) {
    cancelarCamino(camino);
    return { dx: inp.dx, dy: inp.dy, manual: true, llego: false };
  }
  if (!camino.activo) return { dx: 0, dy: 0, manual: false, llego: false };
  // Trabado: si no se avanza AVANCE_MIN en TRABADO_S, se cancela (no se queda empujando una pared).
  if (!camino.ref) camino.ref = { x: pos.x, y: pos.y };
  if (Math.hypot(pos.x - camino.ref.x, pos.y - camino.ref.y) >= AVANCE_MIN) {
    camino.ref = { x: pos.x, y: pos.y };
    camino.quieto = 0;
  } else if ((camino.quieto += dt) > TRABADO_S) {
    cancelarCamino(camino);
    return { dx: 0, dy: 0, manual: false, llego: true };
  }
  // Pasos ya cerca se descartan; cuando no quedan, el destino está alcanzado.
  while (camino.pasos.length && Math.hypot(camino.pasos[0].x - pos.x, camino.pasos[0].y - pos.y) < LLEGADA) camino.pasos.shift();
  if (!camino.pasos.length) {
    cancelarCamino(camino);
    return { dx: 0, dy: 0, manual: false, llego: true };
  }
  const p = camino.pasos[0];
  const dx = p.x - pos.x, dy = p.y - pos.y, d = Math.hypot(dx, dy);
  return { dx: dx / d, dy: dy / d, manual: false, llego: false };
}
