// Sprites pixelart de peatones y agentes, y caché de sprites rasterizados (mejora visual). Sin DOM propio:
// la fábrica de canvas se inyecta (en el navegador, OffscreenCanvas o <canvas>; en Node, un canvas falso para pruebas).
//
// - Peatones: reusan spriteJugador (personaje.js) con una variante al azar estable por peatón (VARIANTES_PEATON variantes fijas,
//   elegidas con un generador con semilla). La variante se asigna una vez por objeto peatón (WeakMap), así no cambia entre cuadros.
// - Agentes: sprite propio de 12 x 16 con uniforme oscuro, chaleco y gorra del color de su estado (G35).
// - Caché: cada sprite (clave = tipo, variante, vista y cuadro) se rasteriza una sola vez a 1 px por píxel del sprite;
//   el render lo dibuja escalado con drawImage (sin suavizado). Tope de entradas: al pasarlo se vacía (no crece sin límite).
import { personajeAlAzar, ANCHO_SPRITE, ALTO_SPRITE, CUADROS } from './personaje.js';

export const VARIANTES_PEATON = 24;     // variantes distintas de transeúntes (todas válidas, generadas con semilla fija)
export const TOPE_CACHE = 400;          // entradas máximas de la caché de sprites

// Generador con semilla (mulberry32): mismo número, misma secuencia.
export function rngSemilla(s) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Personaje de la variante k (0..VARIANTES_PEATON-1). Determinista: la misma k da siempre el mismo personaje.
const variantes = Array.from({ length: VARIANTES_PEATON }, (_, k) => personajeAlAzar(rngSemilla(1009 + k * 7919)));
export function personajePeaton(k) {
  const i = ((Math.floor(Number(k)) % VARIANTES_PEATON) + VARIANTES_PEATON) % VARIANTES_PEATON;
  return variantes[Number.isFinite(i) ? i : 0];
}

// Variante estable por peatón: la primera vez que se pide para un objeto se asigna en ronda (0, 1, 2, ...) y queda fija.
const varPorPeaton = new WeakMap();
let proxVariante = 0;
export function varianteDe(p) {
  let v = varPorPeaton.get(p);
  if (v === undefined) { v = (proxVariante++ * 7) % VARIANTES_PEATON; varPorPeaton.set(p, v); }
  return v;
}

// Colores fijos del agente.
const UNIFORME = '#1f2a44', UNIFORME_OSC = '#151c30', BOTA = '#111111', PIEL_AG = '#d9a877', OJO = '#1a1a1a', VISERA = '#0d0d10';

// Grilla del agente: { ancho, alto, pixeles } como spriteJugador. col = color del estado (chaleco y gorra).
// vista: 'frente' | 'espalda'. cuadro: 'quieto' | 'paso1' | 'paso2'.
export function spriteAgente(col, vista = 'frente', cuadro = 'quieto') {
  const frente = vista !== 'espalda';
  const paso = CUADROS.includes(cuadro) ? cuadro : 'quieto';
  const g = Array.from({ length: ALTO_SPRITE }, () => Array(ANCHO_SPRITE).fill(null));
  const rect = (x0, y0, x1, y1, c) => {
    for (let y = Math.max(0, y0); y <= Math.min(ALTO_SPRITE - 1, y1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(ANCHO_SPRITE - 1, x1); x++) g[y][x] = c;
  };
  rect(3, 2, 8, 6, PIEL_AG);                         // cabeza
  rect(2, 0, 9, 2, col);                             // gorra del color del estado
  if (frente) { rect(2, 3, 9, 3, VISERA); g[4][4] = OJO; g[4][7] = OJO; }
  else rect(3, 3, 8, 4, '#3a2a1e');                  // nuca con pelo corto
  rect(1, 7, 10, 11, UNIFORME);                      // torso y brazos
  rect(3, 7, 8, 10, col);                            // chaleco del estado
  if (frente) { rect(5, 7, 6, 10, UNIFORME_OSC); rect(3, 9, 8, 9, '#f2f2f2'); }   // cierre y banda reflectiva
  else rect(3, 8, 8, 8, '#f2f2f2');
  rect(0, 8, 0, 11, UNIFORME); rect(11, 8, 11, 11, UNIFORME);
  rect(0, 12, 0, 12, PIEL_AG); rect(11, 12, 11, 12, PIEL_AG);
  if (paso === 'paso1') { rect(3, 12, 5, 14, UNIFORME_OSC); rect(3, 15, 5, 15, BOTA); rect(6, 12, 8, 13, UNIFORME_OSC); rect(6, 14, 8, 14, BOTA); }
  else if (paso === 'paso2') { rect(3, 12, 5, 13, UNIFORME_OSC); rect(3, 14, 5, 14, BOTA); rect(6, 12, 8, 14, UNIFORME_OSC); rect(6, 15, 8, 15, BOTA); }
  else { rect(3, 12, 5, 14, UNIFORME_OSC); rect(3, 15, 5, 15, BOTA); rect(6, 12, 8, 14, UNIFORME_OSC); rect(6, 15, 8, 15, BOTA); }
  return { ancho: ANCHO_SPRITE, alto: ALTO_SPRITE, pixeles: g };
}

// Fábrica de canvas por defecto: OffscreenCanvas si existe; si no, <canvas> del documento; si no hay ninguno, null.
export function fabricaCanvas(w, h) {
  if (typeof OffscreenCanvas === 'function') { try { return new OffscreenCanvas(w, h); } catch (e) { /* sigue */ } }
  if (typeof document !== 'undefined' && document.createElement) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  }
  return null;
}

// Rasteriza una grilla de sprite a un canvas de ancho x alto (1 px por píxel del sprite), con un contorno oscuro de 1 px
// alrededor de la silueta para que se lea sobre cualquier suelo. El canvas resultante mide (ancho + 2) x (alto + 2).
export function rasterizarSprite(sprite, fabrica = fabricaCanvas) {
  const c = fabrica(sprite.ancho + 2, sprite.alto + 2);
  if (!c) return null;
  const g = c.getContext('2d');
  const px = sprite.pixeles;
  g.fillStyle = 'rgba(10, 10, 14, 0.75)';
  for (let j = 0; j < sprite.alto; j++) for (let i = 0; i < sprite.ancho; i++) {
    if (px[j][i]) continue;
    const vecino = (px[j - 1]?.[i]) || (px[j + 1]?.[i]) || px[j][i - 1] || px[j][i + 1];
    if (vecino) g.fillRect(i + 1, j + 1, 1, 1);
  }
  for (let i = 0; i < sprite.ancho; i++) {                     // contorno exterior en los bordes del cuadro
    if (px[0][i]) g.fillRect(i + 1, 0, 1, 1);
    if (px[sprite.alto - 1][i]) g.fillRect(i + 1, sprite.alto + 1, 1, 1);
  }
  for (let j = 0; j < sprite.alto; j++) {
    if (px[j][0]) g.fillRect(0, j + 1, 1, 1);
    if (px[j][sprite.ancho - 1]) g.fillRect(sprite.ancho + 1, j + 1, 1, 1);
  }
  for (let j = 0; j < sprite.alto; j++) for (let i = 0; i < sprite.ancho; i++) {
    const col = px[j][i];
    if (!col) continue;
    g.fillStyle = col;
    g.fillRect(i + 1, j + 1, 1, 1);
  }
  return c;
}

// Caché de sprites rasterizados. obtener(clave, generar) devuelve el canvas de la clave; si falta, llama generar() (que
// devuelve una grilla), lo rasteriza y lo guarda. Al superar `tope` entradas se vacía entera. stats() para pruebas.
export function crearCacheSprites({ fabrica = fabricaCanvas, tope = TOPE_CACHE } = {}) {
  const m = new Map();
  let creados = 0, aciertos = 0;
  return {
    obtener(clave, generar) {
      const v = m.get(clave);
      if (v !== undefined) { aciertos++; return v; }
      if (m.size >= tope) m.clear();
      const c = rasterizarSprite(generar(), fabrica);
      m.set(clave, c);
      creados++;
      return c;
    },
    stats: () => ({ tamano: m.size, creados, aciertos }),
    vaciar() { m.clear(); },
  };
}

// Clave de caché del personaje del jugador (todas sus categorías) para una vista y un cuadro.
export const claveJugador = (p, vista, cuadro) =>
  'J|' + [p.piel, p.peloColor, p.peloEstilo, p.ropa, p.accesorio, p.calzado].join(',') + '|' + vista + '|' + cuadro;
