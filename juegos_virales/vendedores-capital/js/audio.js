// Audio de la 2D (D6, con mejora sonora): todo se sintetiza con WebAudio, sin archivos (música en capas, sirena y efectos).
// Sin DOM. El AudioContext se crea en desbloquear(), que main.js llama en el primer gesto del usuario (los navegadores bloquean el audio antes).
// Antes de desbloquear, sfx() y los demás métodos no hacen nada, pero el volumen y el silencio que se fijan igual quedan guardados.
// Expone: desbloquear, sfx, setVolumen, silenciar, escena, pausa y alerta (mismos nombres y lógica que la 3D).
//
// Grafo: gMus (bus de música) -> lp (filtro de pausa) -> master;  gFx (bus de efectos) -> master;  master -> destino.
// Eco: dos redes de delays con realimentación y filtro (reverb simple): una para efectos (vuelve a gFx) y otra para la música.
// Cada nota usa una envolvente ADSR (envolvente()); los efectos repetidos (venta, pasos) varían levemente el tono (variar()).
// Los nodos opcionales (delay, ruido) se crean solo si el navegador los ofrece: sin ellos, el audio sigue funcionando.

let ctx = null, master = null, gMus = null, gFx = null, lp = null, ruidoBuf = null;
const vol = { musica: 0.5, efectos: 0.8, silencio: false };
let escena = null, nivel = 'verde', paso = 0, timer = 0, sirena = null, pausado = false;
let envMus = null, envFx = null;   // envíos al eco (si hay createDelay)

const limitar = v => Math.min(1, Math.max(0, v));
const PISO = 0.0001;

// Envolvente ADSR como lista de puntos [segundos desde el inicio, ganancia]. a, d, r en segundos; s = nivel de sostén (0..1)
// relativo al pico. La nota se sostiene hasta `dur` (o hasta a + d si dur es más corto) y se apaga en r. Función pura.
export function envolvente({ a = 0.01, d = 0.05, s = 0.6, r = 0.08 } = {}, dur = 0.2, pico = 1) {
  const A = Math.max(0.001, a), D = Math.max(0, d), R = Math.max(0.005, r);
  const fin = Math.max(A + D, dur);
  const sost = Math.max(PISO, pico * limitar(s));
  return [[0, PISO], [A, Math.max(PISO, pico)], [A + D, sost], [fin, sost], [fin + R, PISO]];
}
// Frecuencia con una variación aleatoria leve (±frac). rng inyectable para pruebas. Función pura salvo por rng.
export function variar(f, rng = Math.random, frac = 0.04) {
  const r = Number(rng());
  return f * (1 + ((Number.isFinite(r) ? limitar(r) : 0.5) * 2 - 1) * frac);
}

function aplicarVol() {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(vol.silencio ? 0 : 1, t, 0.03);
  gMus.gain.setTargetAtTime(vol.musica * 0.22, t, 0.05);
  gFx.gain.setTargetAtTime(vol.efectos * 0.5, t, 0.05);
  lp.frequency.setTargetAtTime(pausado ? 500 : 12000, t, 0.1);
}
function aplicarEnv(param, puntos, t0) {
  param.setValueAtTime(puntos[0][1], t0);
  for (let k = 1; k < puntos.length; k++) param.exponentialRampToValueAtTime(puntos[k][1], t0 + puntos[k][0]);
}
// Nota con envolvente. o: { adsr, glide (frecuencia final), eco (0..1, envío al eco) }.
function nota(f, t, dur, tipo, g, destino, o = {}) {
  const osc = ctx.createOscillator(), v = ctx.createGain();
  osc.type = tipo; osc.frequency.setValueAtTime(f, t);
  if (o.glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.glide), t + dur);
  const env = envolvente(o.adsr ?? { a: 0.008, d: dur * 0.4, s: 0.5, r: dur * 0.6 }, dur, g);
  aplicarEnv(v.gain, env, t);
  osc.connect(v); v.connect(destino);
  if (o.eco) enviarEco(v, destino, o.eco);
  osc.start(t); osc.stop(t + env[env.length - 1][0] + 0.05);
}
// Ráfaga de ruido filtrado (pasos, platillos). Sin createBuffer, no suena (y no falla).
function ruido(t, dur, g, frec, tipoFiltro, destino, q = 1) {
  if (!ruidoBuf || !ctx.createBufferSource) return;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), v = ctx.createGain();
  s.buffer = ruidoBuf;
  f.type = tipoFiltro; f.frequency.value = frec; if (f.Q) f.Q.value = q;
  aplicarEnv(v.gain, envolvente({ a: 0.003, d: dur * 0.5, s: 0.3, r: dur * 0.5 }, dur * 0.5, g), t);
  s.connect(f); f.connect(v); v.connect(destino);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
function enviarEco(nodo, destino, cant) {
  const env = destino === gFx ? envFx : null;   // la música ya tiene su eco general
  if (!env) return;
  const s = ctx.createGain(); s.gain.value = cant;
  nodo.connect(s); s.connect(env);
}
// Eco / reverb simple: dos delays con realimentación y paso bajo, en paralelo. Una red por bus:
// - efectos: las notas con `eco` envían a la red, que vuelve a gFx (así el volumen de efectos también la afecta);
// - música: toma la salida de lp (ya con volumen y filtro de pausa) y vuelve a master.
function crearEco(salida, fb0) {
  const entrada = ctx.createGain(); entrada.gain.value = 1;
  for (const [tiempo, fb] of [[0.13, fb0], [0.21, fb0 * 0.8]]) {
    const d = ctx.createDelay(1), r = ctx.createGain(), f = ctx.createBiquadFilter();
    d.delayTime.value = tiempo; r.gain.value = fb; f.type = 'lowpass'; f.frequency.value = 2600;
    entrada.connect(d); d.connect(f); f.connect(r); r.connect(d); f.connect(salida);
  }
  return entrada;
}
function armarEco() {
  if (!ctx.createDelay) return;
  try {
    envFx = crearEco(gFx, 0.32);
    const ecoMus = crearEco(master, 0.3);
    envMus = ctx.createGain(); envMus.gain.value = 0.22; envMus.connect(ecoMus);
    lp.connect(envMus);                         // la música entera lleva un poco de eco
  } catch (e) { envMus = envFx = null; }
}
function armarRuido() {
  if (!ctx.createBuffer) return;
  try {
    const n = Math.floor(ctx.sampleRate || 44100);
    ruidoBuf = ctx.createBuffer(1, n, ctx.sampleRate || 44100);
    const d = ruidoBuf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { ruidoBuf = null; }
}

// Música: progresión de 4 compases (La menor, Fa, Do, Sol), 8 corcheas por compás. Capas: bajo, acorde sostenido (pad),
// arpegio o melodía, bombo y platillo (en partida). En alerta se suma una línea aguda; en rojo, más rápido y con bombo fuerte.
const PROG = [[110, 165, 131], [87.31, 130.8, 110], [130.8, 196, 164.8], [98, 146.8, 123.5]];   // raíz, quinta, tercera
const BAJO = [0, 0, 1, 0, 2, 2, 1, 2];
const AGUDO = [440, 0, 523, 0, 392, 0, 523, 659];
const MELODIA = [659, 0, 587, 523, 0, 440, 523, 0, 587, 0, 523, 440, 392, 0, 440, 0];
function tick() {
  if (!ctx || !escena) return;
  const t = ctx.currentTime + 0.05;
  const partida = escena === 'partida';
  const rojo = partida && nivel === 'rojo', amar = partida && nivel === 'amarillo';
  const compas = Math.floor(paso / 8) % PROG.length, acorde = PROG[compas], k = paso % 8;
  const corchea = 60 / (rojo ? 115 : 80) / 2;
  const b = acorde[BAJO[k]] * (escena === 'menu' ? 2 : 1);
  nota(b, t, 0.22, 'triangle', 0.9, gMus, { adsr: { a: 0.006, d: 0.08, s: 0.55, r: 0.12 } });
  if (k === 0) for (const f of acorde) nota(f * 2, t, corchea * 7, 'sine', 0.16, gMus, { adsr: { a: 0.25, d: 0.3, s: 0.7, r: 0.4 } });   // pad
  if (partida) {
    if (paso % 2 === 0) nota(b * 2, t, 0.1, 'square', rojo ? 0.35 : 0.15, gMus);
    if (k === 0 || k === 4) nota(rojo ? 140 : 110, t, 0.14, 'sine', rojo ? 1 : 0.55, gMus, { glide: 45, adsr: { a: 0.002, d: 0.06, s: 0.3, r: 0.08 } });
    if (k % 2 === 1) ruido(t, 0.05, rojo ? 0.35 : 0.18, 7000, 'highpass', gMus);
    if (rojo && k % 4 === 2) ruido(t, 0.12, 0.3, 1800, 'bandpass', gMus, 0.8);   // caja
  } else {
    const m = MELODIA[paso % 16];
    if (m) nota(m, t, 0.32, 'triangle', 0.32, gMus, { adsr: { a: 0.02, d: 0.1, s: 0.5, r: 0.25 }, eco: 0.5 });
  }
  if ((rojo || amar) && AGUDO[k]) nota(AGUDO[k] * (rojo ? 1.5 : 1), t, 0.12, 'square', rojo ? 0.4 : 0.2, gMus);
  paso++;
}
function reprogramar() {
  clearInterval(timer);
  if (!ctx || !escena) return;
  const bpm = nivel === 'rojo' && escena === 'partida' ? 115 : 80;
  timer = setInterval(tick, 60000 / bpm / 2);
  timer?.unref?.();   // en Node (pruebas) no mantiene vivo el proceso; en el navegador es un número y no hace nada
}
function sirenaOn(on) {
  if (!ctx) return;
  if (on && !sirena) {
    const o = ctx.createOscillator(), l = ctx.createOscillator(), lg = ctx.createGain(), v = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = 760; l.frequency.value = 1.6; lg.gain.value = 180; v.gain.value = 0.0001;
    l.connect(lg); lg.connect(o.frequency); o.connect(v); v.connect(gFx);
    v.gain.setTargetAtTime(0.12, ctx.currentTime, 0.1);
    o.start(); l.start(); sirena = { o, l, v };
  } else if (!on && sirena) {
    const s = sirena; sirena = null;
    s.v.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
    setTimeout(() => { try { s.o.stop(); s.l.stop(); } catch (e) {} }, 500);
  }
}
const CORTO = { a: 0.004, d: 0.04, s: 0.4, r: 0.05 };
const SFX = {
  clic: t => nota(660, t, 0.05, 'square', 0.22, gFx, { adsr: CORTO }),
  venta: t => {                                                       // moneda: dos notas con brillo y eco, tono variable
    const f = variar(988);
    nota(f, t, 0.08, 'square', 0.35, gFx, { adsr: CORTO });
    nota(f * 1.335, t + 0.08, 0.22, 'square', 0.35, gFx, { adsr: { a: 0.004, d: 0.06, s: 0.5, r: 0.18 }, eco: 0.6 });
    nota(f * 2.67, t + 0.08, 0.15, 'sine', 0.18, gFx, { eco: 0.6 });
  },
  rechazo: t => { nota(220, t, 0.12, 'sawtooth', 0.35, gFx); nota(165, t + 0.1, 0.2, 'sawtooth', 0.35, gFx, { glide: 140 }); },
  cortes: t => { const f = variar(523, Math.random, 0.03); nota(f, t, 0.1, 'triangle', 0.3, gFx); nota(f * 1.26, t + 0.1, 0.16, 'triangle', 0.3, gFx, { eco: 0.3 }); },
  ignorar: t => nota(variar(330, Math.random, 0.03), t, 0.14, 'sine', 0.22, gFx, { glide: 260, adsr: CORTO }),
  paso: t => { ruido(t, 0.05, 0.22, variar(900, Math.random, 0.15), 'bandpass', gFx, 1.5); nota(variar(95, Math.random, 0.1), t, 0.04, 'sine', 0.12, gFx, { adsr: CORTO }); },
  pasoCorrer: t => { ruido(t, 0.06, 0.32, variar(1300, Math.random, 0.15), 'bandpass', gFx, 1.5); nota(variar(110, Math.random, 0.1), t, 0.05, 'sine', 0.16, gFx, { adsr: CORTO }); },
  alerta: t => { nota(988, t, 0.1, 'square', 0.5, gFx, { adsr: CORTO }); nota(740, t + 0.12, 0.2, 'square', 0.5, gFx, { eco: 0.4 }); },
  escape: t => [523, 659, 784, 1046].forEach((f, i) => nota(f, t + i * 0.08, 0.16, 'triangle', 0.5, gFx, { eco: 0.4 })),
  captura: t => [392, 330, 262, 196].forEach((f, i) => nota(f, t + i * 0.16, 0.3, 'sawtooth', 0.45, gFx, { glide: f * 0.94 })),
  cuenta: t => nota(440, t, 0.15, 'square', 0.45, gFx, { eco: 0.3 }),
  ya: t => nota(880, t, 0.4, 'square', 0.5, gFx, { eco: 0.4 }),
  victoria: t => [523, 659, 784, 659, 784, 1046].forEach((f, i) => nota(f, t + i * 0.11, 0.25, 'triangle', 0.55, gFx, { eco: 0.5 })),
  medalla: t => { nota(1046, t, 0.12, 'square', 0.4, gFx); nota(1568, t + 0.1, 0.3, 'square', 0.4, gFx, { eco: 0.6 }); },
  fila: t => nota(520, t, 0.05, 'square', 0.2, gFx, { adsr: CORTO }),
  patrulla: t => [0, 1, 2, 3].forEach(i => nota(i % 2 ? 520 : 690, t + i * 0.18, 0.16, 'triangle', 0.45, gFx, { eco: 0.3 })),   // bocina de dos tonos
  heli: t => [0, 1, 2, 3, 4].forEach(i => { ruido(t + i * 0.09, 0.06, 0.35, 260, 'lowpass', gFx); nota(72, t + i * 0.09, 0.05, 'sine', 0.3, gFx, { adsr: CORTO }); }),   // aspas
};

export const audio = {
  // Crea el contexto y arma el grafo. Se llama en el primer gesto; si ya existe, solo lo reanuda si quedó suspendido.
  desbloquear() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume?.(); return; }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    master = ctx.createGain(); lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 12000;
    gMus = ctx.createGain(); gFx = ctx.createGain();
    gMus.connect(lp); gFx.connect(master); lp.connect(master); master.connect(ctx.destination);
    armarEco(); armarRuido();
    aplicarVol(); reprogramar();
  },
  // Efecto por nombre (SFX). Un nombre desconocido se ignora sin error.
  sfx(n) { if (ctx && Object.hasOwn(SFX, n) && !vol.silencio) SFX[n](ctx.currentTime + 0.01); },
  // Volumen general de Opciones (0 a 1), aplicado a música y efectos. Fuera de rango se recorta.
  setVolumen(v) {
    const x = Number(v);
    if (!Number.isFinite(x)) return;
    vol.musica = limitar(x); vol.efectos = limitar(x);
    aplicarVol();
  },
  // Silencia o restaura todo el audio (el contexto sigue corriendo; solo baja la ganancia maestra).
  silenciar(b) { vol.silencio = !!b; aplicarVol(); },
  escena(e) { escena = e; paso = 0; reprogramar(); if (!e) sirenaOn(false); },
  pausa(p) { pausado = !!p; aplicarVol(); sirenaOn(!p && nivel === 'rojo' && escena === 'partida'); },
  alerta(n) {
    if (n === nivel) return;
    nivel = n; reprogramar();
    sirenaOn(n === 'rojo' && escena === 'partida' && !pausado);
  },
};
