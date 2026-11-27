// Pruebas headless de audio.js (sin navegador ni DOM). Uso: node 2d/tools/test_audio.mjs
// Con un AudioContext simulado: sfx con nombre desconocido no lanza, el volumen se recorta a 0..1, silenciar deja la
// ganancia maestra en 0, desbloquear crea el contexto una sola vez y, antes del gesto, no hace nada (sin error).
import { audio } from '../js/audio.js';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}
function noLanza(fn) { try { fn(); return true; } catch (e) { return String(e); } }

// Parámetro de audio simulado: guarda el último valor fijado (value o setTargetAtTime).
class ParamSim {
  constructor(v = 0) { this.value = v; this.last = v; }
  setValueAtTime(v) { this.value = v; this.last = v; }
  setTargetAtTime(v) { this.last = v; this.value = v; }
  exponentialRampToValueAtTime(v) { this.last = v; }
}
// AudioContext simulado: cuenta cuántas veces se creó, guarda los gain en orden de creación y los osciladores.
class AudioContextSim {
  constructor() {
    AudioContextSim.creados++;
    AudioContextSim.ultimo = this;
    this.state = 'running';
    this.currentTime = 0;
    this.destination = {};
    this.gains = [];
    this.osciladores = 0;
    this.resumes = 0;
  }
  resume() { this.resumes++; this.state = 'running'; }
  createGain() { const g = { gain: new ParamSim(1), connect() {} }; this.gains.push(g); return g; }
  createOscillator() {
    this.osciladores++;
    return { type: 'sine', frequency: new ParamSim(0), connect() {}, start() {}, stop() {} };
  }
  createBiquadFilter() { return { type: 'lowpass', frequency: new ParamSim(12000), connect() {} }; }
}
AudioContextSim.creados = 0;
AudioContextSim.ultimo = null;

console.log('1. Sin AudioContext disponible (antes del primer gesto o en Node)');
{
  globalThis.AudioContext = undefined;
  globalThis.webkitAudioContext = undefined;
  check('desbloquear sin AudioContext no lanza', noLanza(() => audio.desbloquear()) === true);
  check('sfx antes de desbloquear no lanza', noLanza(() => audio.sfx('venta')) === true);
  check('sfx con nombre desconocido no lanza', noLanza(() => audio.sfx('no_existe')) === true);
  check('sfx con nombre de Object.prototype no lanza', noLanza(() => audio.sfx('constructor')) === true);
  check('sfx sin argumento no lanza', noLanza(() => audio.sfx()) === true);
  check('setVolumen, silenciar, escena, pausa y alerta antes del gesto no lanzan',
    noLanza(() => { audio.setVolumen(0.3); audio.silenciar(true); audio.silenciar(false); audio.escena('menu'); audio.pausa(true); audio.pausa(false); audio.alerta('verde'); }) === true);
}

console.log('2. Volumen fuera de rango y valores no numéricos');
{
  globalThis.AudioContext = AudioContextSim;
  audio.setVolumen(0.5);
  audio.desbloquear();
  const ctx = AudioContextSim.ultimo;
  const master = ctx.gains[0], gMus = ctx.gains[1], gFx = ctx.gains[2];
  check('con 0.5 la música baja a 0.5 * 0.22', Math.abs(gMus.gain.last - 0.11) < 1e-9, String(gMus.gain.last));
  check('con 0.5 los efectos bajan a 0.5 * 0.5', Math.abs(gFx.gain.last - 0.25) < 1e-9, String(gFx.gain.last));
  audio.setVolumen(2);
  check('volumen 2 se recorta a 1 (efectos a 0.5)', Math.abs(gFx.gain.last - 0.5) < 1e-9, String(gFx.gain.last));
  check('volumen 2 se recorta a 1 (música a 0.22)', Math.abs(gMus.gain.last - 0.22) < 1e-9, String(gMus.gain.last));
  audio.setVolumen(-3);
  check('volumen -3 se recorta a 0 (efectos a 0)', gFx.gain.last === 0, String(gFx.gain.last));
  check('volumen -3 se recorta a 0 (música a 0)', gMus.gain.last === 0, String(gMus.gain.last));
  audio.setVolumen('abc');
  check('volumen no numérico se ignora (sigue en 0)', gFx.gain.last === 0, String(gFx.gain.last));
  audio.setVolumen(NaN);
  check('NaN se ignora (sigue en 0)', gFx.gain.last === 0, String(gFx.gain.last));
  audio.setVolumen(0.8);
  check('volumen 0.8 vuelve a aplicarse', Math.abs(gFx.gain.last - 0.4) < 1e-9, String(gFx.gain.last));
  check('la ganancia maestra sigue en 1 sin silencio', master.gain.last === 1, String(master.gain.last));
}

console.log('3. Silenciar');
{
  const ctx = AudioContextSim.ultimo;
  const master = ctx.gains[0];
  audio.silenciar(true);
  check('silenciar(true) deja la ganancia maestra en 0', master.gain.last === 0, String(master.gain.last));
  const antes = ctx.osciladores;
  audio.sfx('venta');
  check('con silencio sfx no crea osciladores', ctx.osciladores === antes, `${antes} -> ${ctx.osciladores}`);
  audio.silenciar(false);
  check('silenciar(false) restaura la ganancia maestra a 1', master.gain.last === 1, String(master.gain.last));
  audio.sfx('venta');
  check('sin silencio sfx sí crea osciladores', ctx.osciladores > antes);
}

console.log('4. Desbloqueo una sola vez');
{
  const antes = AudioContextSim.creados;
  audio.desbloquear();
  audio.desbloquear();
  audio.desbloquear();
  check('desbloquear repetido no crea otro AudioContext', AudioContextSim.creados === antes, `${antes} -> ${AudioContextSim.creados}`);
  const ctx = AudioContextSim.ultimo;
  ctx.state = 'suspended';
  audio.desbloquear();
  check('si el contexto quedó suspendido, desbloquear lo reanuda', ctx.resumes === 1, String(ctx.resumes));
  ctx.state = 'running';
  audio.desbloquear();
  check('con el contexto corriendo no vuelve a reanudar', ctx.resumes === 1, String(ctx.resumes));
}

console.log('5. Nombres de efectos');
{
  const ctx = AudioContextSim.ultimo;
  for (const n of ['clic', 'venta', 'rechazo', 'alerta', 'escape', 'captura', 'victoria', 'medalla', 'cuenta']) {
    const antes = ctx.osciladores;
    audio.sfx(n);
    check(`sfx('${n}') sintetiza sonido`, ctx.osciladores > antes);
  }
  const antes = ctx.osciladores;
  audio.sfx('no_existe');
  audio.sfx('toString');
  check('nombres desconocidos no sintetizan nada', ctx.osciladores === antes);
  check('escena y alerta con sirena no lanzan', noLanza(() => { audio.escena('partida'); audio.alerta('rojo'); audio.pausa(true); audio.pausa(false); audio.alerta('verde'); audio.escena(null); }) === true);
}

console.log('');
console.log(fallos === 0 ? `TODAS LAS PRUEBAS OK (${pasos})` : `FALLARON ${fallos} de ${pasos}`);
process.exit(fallos === 0 ? 0 : 1);
