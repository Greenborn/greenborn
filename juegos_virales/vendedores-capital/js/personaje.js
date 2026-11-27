// Personaje del vendedor 2D (decisión D1): definición, validación, "Al azar", sprite pixelart procedural y guardado.
// Todo es procedural (sin imágenes ni librerías). Sin DOM: la pantalla Personaje y render.js lo usan.
// Se guarda en localStorage con la clave "2d_personaje". Todo acceso al almacenamiento va en try/catch.

export const CLAVE_PERSONAJE = '2d_personaje';
export const ANCHO_SPRITE = 12, ALTO_SPRITE = 16;          // tamaño fijo del sprite, en píxeles del sprite
export const CUADROS = Object.freeze(['quieto', 'paso1', 'paso2']);

// Opciones de cada categoría. Los valores de color son hex en minúsculas; los de estilo y accesorio son claves.
export const OPCIONES_PERSONAJE = Object.freeze({
  piel: Object.freeze(['#f6d1b1', '#e0ac69', '#c68642', '#8d5524', '#4a2c17']),
  peloColor: Object.freeze(['#1d1e24', '#6b4226', '#c9a227', '#8a8a8a', '#b5532a']),
  peloEstilo: Object.freeze(['corto', 'largo', 'rapado']),
  ropa: Object.freeze(['#2e86de', '#e74c3c', '#27ae60', '#f39c12', '#8e44ad', '#ecf0f1']),
  accesorio: Object.freeze(['ninguno', 'gorra', 'lentes']),
  calzado: Object.freeze(['#222222', '#7b4a2a', '#f5f5f5', '#2c3e50']),
});

export const PERSONAJE_DEFECTO = Object.freeze({
  piel: '#e0ac69', peloColor: '#1d1e24', peloEstilo: 'corto', ropa: '#2e86de', accesorio: 'ninguno', calzado: '#222222',
});

// Colores fijos del dibujo (no son categorías).
const PANTALON = '#3b4a6b', GORRA = '#c0392b', OJO = '#1a1a1a', LENTES = '#111111';

// ¿El objeto tiene una opción válida en cada categoría?
export function personajeValido(p) {
  if (!p || typeof p !== 'object') return false;
  return Object.keys(OPCIONES_PERSONAJE).every(k => OPCIONES_PERSONAJE[k].includes(p[k]));
}

// Devuelve un personaje nuevo: cada categoría válida se conserva; las inválidas o ausentes toman el valor por defecto.
export function completarPersonaje(p) {
  const o = { ...PERSONAJE_DEFECTO };
  if (p && typeof p === 'object') {
    for (const k of Object.keys(OPCIONES_PERSONAJE)) if (OPCIONES_PERSONAJE[k].includes(p[k])) o[k] = p[k];
  }
  return o;
}

// Personaje al azar. `rng` devuelve un número en [0, 1) (Math.random por defecto); se puede inyectar para pruebas.
// Siempre devuelve un personaje válido, aunque rng falle o devuelva valores fuera de rango.
export function personajeAlAzar(rng = Math.random) {
  const o = {};
  for (const k of Object.keys(OPCIONES_PERSONAJE)) {
    const lista = OPCIONES_PERSONAJE[k];
    const r = Number(rng());
    const i = Number.isFinite(r) ? Math.min(lista.length - 1, Math.max(0, Math.floor(r * lista.length))) : 0;
    o[k] = lista[i];
  }
  return o;
}

// Vista según el heading del jugador (radianes, forward = (sin, cos) como en agentes/render): mirando hacia abajo de la vista es de frente.
export function vistaDesde(heading = 0) {
  return Math.cos(heading) >= 0 ? 'frente' : 'espalda';
}

// Grilla del frame del jugador: { ancho, alto, pixeles } con pixeles[y][x] = "#rrggbb" o null (transparente).
// cuadro: 'quieto' | 'paso1' | 'paso2' (dos cuadros de caminata; otro valor cuenta como quieto).
// La vista es de frente o de espaldas según el heading. Lentes solo se ven de frente.
export function spriteJugador(p, heading = 0, cuadro = 'quieto') {
  const o = completarPersonaje(p);
  const frente = vistaDesde(heading) === 'frente';
  const paso = CUADROS.includes(cuadro) ? cuadro : 'quieto';
  const g = Array.from({ length: ALTO_SPRITE }, () => Array(ANCHO_SPRITE).fill(null));
  const pon = (x, y, c) => { if (x >= 0 && x < ANCHO_SPRITE && y >= 0 && y < ALTO_SPRITE) g[y][x] = c; };
  const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) pon(x, y, c); };

  // Cabeza de piel (6 x 6) y pelo.
  rect(3, 1, 8, 6, o.piel);
  if (o.peloEstilo === 'largo') rect(2, 3, 9, 8, o.peloColor);
  if (o.peloEstilo !== 'rapado') {
    rect(2, 0, 9, 2, o.peloColor);
    if (!frente) rect(2, 3, 9, 6, o.peloColor);          // de espaldas, el pelo cubre toda la cabeza
    else { rect(2, 3, 2, 4, o.peloColor); rect(9, 3, 9, 4, o.peloColor); }
  } else {
    rect(3, 0, 8, 0, o.peloColor);                       // rapado: solo una franja corta arriba
  }
  // Rostro (solo de frente).
  if (frente) {
    if (o.accesorio === 'lentes') { rect(3, 3, 4, 3, LENTES); rect(7, 3, 8, 3, LENTES); }
    else { pon(4, 3, OJO); pon(7, 3, OJO); }
  }
  // Gorra: tapa la parte de arriba y una visera.
  if (o.accesorio === 'gorra') { rect(2, 0, 9, 1, GORRA); rect(1, 2, 10, 2, GORRA); }

  // Torso y brazos en la ropa; manos en la piel.
  rect(2, 7, 9, 10, o.ropa);
  rect(0, 7, 1, 10, o.ropa);
  rect(10, 7, 11, 10, o.ropa);
  rect(0, 11, 1, 11, o.piel);
  rect(10, 11, 11, 11, o.piel);

  // Piernas y calzado según el cuadro de caminata.
  if (paso === 'paso1') {
    rect(3, 11, 5, 14, PANTALON); rect(3, 15, 5, 15, o.calzado);      // pierna izquierda adelante
    rect(6, 11, 8, 13, PANTALON); rect(6, 14, 8, 14, o.calzado);      // derecha levantada
  } else if (paso === 'paso2') {
    rect(3, 11, 5, 13, PANTALON); rect(3, 14, 5, 14, o.calzado);      // izquierda levantada
    rect(6, 11, 8, 14, PANTALON); rect(6, 15, 8, 15, o.calzado);      // derecha adelante
  } else {
    rect(3, 11, 5, 14, PANTALON); rect(3, 15, 5, 15, o.calzado);
    rect(6, 11, 8, 14, PANTALON); rect(6, 15, 8, 15, o.calzado);
  }
  return { ancho: ANCHO_SPRITE, alto: ALTO_SPRITE, pixeles: g };
}

function storageDefecto() {
  try { return globalThis.localStorage ?? null; } catch (e) { return null; }
}

// Lee el personaje guardado. Si la clave falta, está corrupta o el almacenamiento falla, devuelve el personaje por defecto.
export function cargarPersonaje(storage = storageDefecto()) {
  try {
    return completarPersonaje(JSON.parse(storage?.getItem(CLAVE_PERSONAJE) ?? 'null'));
  } catch (e) {
    return completarPersonaje(null);
  }
}

// Guarda el personaje si es válido. Devuelve true si se pudo escribir en el almacenamiento.
export function guardarPersonaje(p, storage = storageDefecto()) {
  if (!personajeValido(p)) return false;
  try {
    storage.setItem(CLAVE_PERSONAJE, JSON.stringify(completarPersonaje(p)));
    return true;
  } catch (e) {
    return false;
  }
}
