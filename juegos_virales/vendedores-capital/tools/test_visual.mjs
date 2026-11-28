// Pruebas headless de la mejora visual y sonora (sin navegador ni DOM). Uso: node 2d/tools/test_visual.mjs
// sprites.js: variantes de peatón estables y válidas, sprite de agente con el color del estado, rasterizado y caché con tope.
// audio.js: envolvente ADSR y variación de tono (funciones puras), y efectos nuevos con un AudioContext simulado.
import {
  VARIANTES_PEATON, personajePeaton, varianteDe, spriteAgente, aspectoAgente, VARIANTES_AGENTE, crearCacheSprites, rasterizarSprite, rngSemilla, claveJugador,
} from '../js/sprites.js';
import { personajeValido, ANCHO_SPRITE, ALTO_SPRITE, PERSONAJE_DEFECTO } from '../js/personaje.js';
import { envolvente, variar, audio } from '../js/audio.js';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}

// Canvas falso: cuenta fillRect por canvas.
function fabricaFalsa() {
  const creados = [];
  const f = (w, h) => {
    const c = { width: w, height: h, rects: 0, getContext: () => ({ fillStyle: '', fillRect() { c.rects++; } }) };
    creados.push(c);
    return c;
  };
  f.creados = creados;
  return f;
}

console.log('1. Variantes de peatón');
{
  let validas = true;
  for (let k = 0; k < VARIANTES_PEATON; k++) if (!personajeValido(personajePeaton(k))) validas = false;
  check('todas las variantes son personajes válidos', validas);
  check('la misma k da el mismo personaje', personajePeaton(5) === personajePeaton(5));
  check('k fuera de rango se envuelve', personajePeaton(VARIANTES_PEATON + 3) === personajePeaton(3) && personajePeaton(-1) === personajePeaton(VARIANTES_PEATON - 1));
  check('k no numérica da una variante válida', personajeValido(personajePeaton('x')));
  const distintas = new Set(Array.from({ length: VARIANTES_PEATON }, (_, k) => JSON.stringify(personajePeaton(k)))).size;
  check('hay variedad (al menos 12 variantes distintas)', distintas >= 12, String(distintas));
  const a = {}, b = {};
  const va = varianteDe(a);
  check('varianteDe es estable para el mismo peatón', varianteDe(a) === va && varianteDe(a) === va);
  check('varianteDe está en rango', va >= 0 && va < VARIANTES_PEATON && varianteDe(b) >= 0 && varianteDe(b) < VARIANTES_PEATON);
  check('dos peatones seguidos reciben variantes distintas', varianteDe(a) !== varianteDe(b));
  const r1 = rngSemilla(42), r2 = rngSemilla(42);
  check('rngSemilla es determinista', r1() === r2() && r1() === r2());
}

console.log('2. Sprite del agente');
{
  const s = spriteAgente('#e03030', 'frente', 'paso1');
  check('tamaño fijo 12 x 16', s.ancho === ANCHO_SPRITE && s.alto === ALTO_SPRITE && s.pixeles.length === ALTO_SPRITE && s.pixeles.every(f => f.length === ANCHO_SPRITE));
  check('la banda de la gorra lleva el color del estado', s.pixeles[2][5] === '#e03030');
  check('el chaleco lleva el color del estado', s.pixeles[8][3] === '#e03030');
  const otro = spriteAgente('#ffd33b');
  check('otro estado cambia la banda', otro.pixeles[2][5] === '#ffd33b');
  const aspectos = Array.from({ length: VARIANTES_AGENTE }, (_, k) => aspectoAgente(k));
  check('hay agentes con todos los tonos de piel y colores de pelo', new Set(aspectos.map(a => a.piel)).size === 5 && new Set(aspectos.map(a => a.pelo)).size === 5);
  check('el sprite usa la piel de su variante', spriteAgente('#fff', 'frente', 'quieto', 3).pixeles[5][5] === aspectoAgente(3).piel);
  check('cuadros de caminata distintos', JSON.stringify(spriteAgente('#fff', 'frente', 'paso1').pixeles) !== JSON.stringify(spriteAgente('#fff', 'frente', 'paso2').pixeles));
  check('frente y espalda distintos', JSON.stringify(spriteAgente('#fff', 'frente').pixeles) !== JSON.stringify(spriteAgente('#fff', 'espalda').pixeles));
  check('cuadro desconocido cuenta como quieto', JSON.stringify(spriteAgente('#fff', 'frente', 'x').pixeles) === JSON.stringify(spriteAgente('#fff', 'frente', 'quieto').pixeles));
}

console.log('3. Rasterizado y caché de sprites');
{
  const fab = fabricaFalsa();
  const c = rasterizarSprite(spriteAgente('#fff'), fab);
  check('el canvas mide sprite + 2 (contorno)', c.width === ANCHO_SPRITE + 2 && c.height === ALTO_SPRITE + 2);
  check('se pintan píxeles', c.rects > 50, String(c.rects));
  check('sin fábrica de canvas devuelve null', rasterizarSprite(spriteAgente('#fff'), () => null) === null);
  const fab2 = fabricaFalsa();
  const cache = crearCacheSprites({ fabrica: fab2, tope: 5 });
  let generados = 0;
  const gen = () => { generados++; return spriteAgente('#fff'); };
  const x1 = cache.obtener('a', gen), x2 = cache.obtener('a', gen);
  check('la misma clave se rasteriza una sola vez', x1 === x2 && generados === 1 && fab2.creados.length === 1);
  check('stats cuenta aciertos', cache.stats().aciertos === 1 && cache.stats().creados === 1);
  for (let k = 0; k < 10; k++) cache.obtener('k' + k, gen);
  check('el tope limita el tamaño de la caché', cache.stats().tamano <= 5, String(cache.stats().tamano));
  // Un cuadro típico: 40 peatones con 24 variantes x 2 vistas x 3 cuadros = como mucho 144 sprites, nunca uno por cuadro.
  const fab3 = fabricaFalsa(), c3 = crearCacheSprites({ fabrica: fab3 });
  for (let cuadro = 0; cuadro < 300; cuadro++) for (let p = 0; p < 40; p++) c3.obtener('P|' + (p % VARIANTES_PEATON) + '|frente|' + ['quieto', 'paso1', 'paso2'][cuadro % 3], gen);
  check('300 cuadros con 40 peatones crean pocos canvas', fab3.creados.length <= VARIANTES_PEATON * 3, String(fab3.creados.length));
  const k1 = claveJugador(PERSONAJE_DEFECTO, 'frente', 'quieto'), k2 = claveJugador({ ...PERSONAJE_DEFECTO, ropa: '#e74c3c' }, 'frente', 'quieto');
  check('la clave del jugador cambia con el personaje', k1 !== k2);
}

console.log('4. Envolvente ADSR y variación de tono');
{
  const e = envolvente({ a: 0.01, d: 0.05, s: 0.5, r: 0.1 }, 0.2, 0.8);
  check('cinco puntos', e.length === 5);
  check('empieza y termina en silencio (piso > 0 para rampas exponenciales)', e[0][1] > 0 && e[0][1] < 0.001 && e[4][1] < 0.001);
  check('pico en el ataque', e[1][0] === 0.01 && e[1][1] === 0.8);
  check('sostén = pico x s', Math.abs(e[2][1] - 0.4) < 1e-9 && e[3][1] === e[2][1]);
  check('se sostiene hasta dur y se apaga en r', e[3][0] === 0.2 && Math.abs(e[4][0] - 0.3) < 1e-9);
  check('los tiempos crecen', e.every((p, i) => i === 0 || p[0] >= e[i - 1][0]));
  const corta = envolvente({ a: 0.05, d: 0.1, s: 0.5, r: 0.1 }, 0.02, 1);
  check('nota más corta que a + d: se sostiene desde a + d', Math.abs(corta[3][0] - 0.15) < 1e-9);
  const rara = envolvente({ a: -1, d: -1, s: 5, r: 0 }, 0, 0);
  check('valores fuera de rango no rompen (todo positivo y finito)', rara.every(([t, v]) => Number.isFinite(t) && t >= 0 && v > 0));
  check('variar con rng 0.5 deja la frecuencia', variar(440, () => 0.5) === 440);
  check('variar respeta el rango ±frac', Math.abs(variar(440, () => 0, 0.05) - 418) < 1e-9 && Math.abs(variar(440, () => 1, 0.05) - 462) < 1e-9);
  check('variar con rng roto no da NaN', variar(440, () => NaN) === 440);
  let ok = true;
  for (let k = 0; k < 200; k++) { const f = variar(1000); if (f < 960 || f > 1040) ok = false; }
  check('200 variaciones al azar quedan en ±4 %', ok);
}

console.log('5. Efectos nuevos con AudioContext simulado (con delay y buffers)');
{
  class P { constructor(v = 0) { this.value = v; } setValueAtTime(v) { this.value = v; } setTargetAtTime(v) { this.value = v; } exponentialRampToValueAtTime(v) { if (!(v > 0)) throw new Error('rampa exponencial a ' + v); } }
  let osc = 0, fuentes = 0, delays = 0;
  globalThis.AudioContext = class {
    constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 8000; this.destination = {}; }
    createGain() { return { gain: new P(1), connect() {} }; }
    createOscillator() { osc++; return { type: 'sine', frequency: new P(0), connect() {}, start() {}, stop() {} }; }
    createBiquadFilter() { return { type: 'lowpass', frequency: new P(0), Q: new P(1), connect() {} }; }
    createDelay() { delays++; return { delayTime: new P(0), connect() {} }; }
    createBuffer(c, n) { const d = new Float32Array(n); return { getChannelData: () => d }; }
    createBufferSource() { fuentes++; return { buffer: null, connect() {}, start() {}, stop() {} }; }
  };
  let error = null;
  try { audio.desbloquear(); } catch (e) { error = e; }
  check('desbloquear con eco y ruido no lanza', !error, String(error));
  check('arma las redes de eco', delays >= 2, String(delays));
  for (const n of ['paso', 'pasoCorrer', 'cortes', 'ignorar', 'venta']) {
    const o0 = osc, f0 = fuentes;
    let err = null;
    try { audio.sfx(n); } catch (e) { err = e; }
    check(`sfx('${n}') suena sin errores`, !err && (osc > o0 || fuentes > f0), String(err));
  }
  const f0 = fuentes;
  audio.sfx('paso');
  check('los pasos usan ruido filtrado', fuentes > f0);
  let err = null;
  try { audio.escena('partida'); audio.alerta('rojo'); audio.escena('menu'); audio.escena(null); } catch (e) { err = e; }
  check('cambios de escena y alerta no lanzan', !err, String(err));
}

console.log('');
console.log(fallos === 0 ? `TODAS LAS PRUEBAS OK (${pasos})` : `FALLARON ${fallos} de ${pasos}`);
process.exit(fallos === 0 ? 0 : 1);
