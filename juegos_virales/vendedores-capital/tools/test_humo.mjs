// Prueba de humo: arranca js/main.js con un DOM y un canvas falsos, juega una partida, dispara 5 estrellas (con patrullas y
// helicóptero), pausa, es capturado y vuelve a jugar, sin excepciones. No reemplaza la prueba en navegador.
// Uso: node 2d/tools/test_humo.mjs
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}

// main.js no exporta nada: se le agrega al cargarlo un acceso de solo lectura a su estado.
registerHooks({
  load(url, ctx, next) {
    const r = next(url, ctx);
    if (!url.endsWith('/js/main.js')) return r;
    return { ...r, source: String(r.source) + '\nglobalThis.__juego = { get sim() { return sim; }, get pl() { return pl; }, get estado() { return estado; } };\n' };
  },
});

// ---------- DOM y canvas falsos ----------
const nada = () => {};
function contexto() {
  const grad = { addColorStop: nada };
  const base = {
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    measureText: t => ({ width: String(t).length * 7 }),
    createRadialGradient: () => grad, createLinearGradient: () => grad, createPattern: () => ({}),
  };
  return new Proxy(base, { get: (o, k) => (k in o ? o[k] : nada), set: (o, k, v) => { o[k] = v; return true; } });
}
function elemento(id = '', tag = 'div') {
  const oyentes = {}, clases = new Set(), sels = new Map();
  const el = {
    id, tagName: tag.toUpperCase(), hidden: false, textContent: '', value: '', title: '', width: 150, height: 150, innerHTML: '', disabled: false,
    dataset: {}, children: [], style: { setProperty: nada },
    classList: {
      add: (...c) => c.forEach(x => clases.add(x)), remove: (...c) => c.forEach(x => clases.delete(x)), contains: c => clases.has(c),
      toggle: (c, f = !clases.has(c)) => { f ? clases.add(c) : clases.delete(c); return f; },
    },
    get childElementCount() { return this.children.length; },
    append(...h) { this.children.push(...h); }, appendChild(h) { this.children.push(h); return h; }, replaceChildren(...h) { this.children = h; },
    remove: nada, select: nada, setAttribute(k, v) { this['attr_' + k] = v; }, getAttribute(k) { return this['attr_' + k] ?? null; }, removeAttribute: nada,
    addEventListener: (t, f) => (oyentes[t] ??= []).push(f), removeEventListener: nada,
    emitir(t, ev = {}) { for (const f of oyentes[t] ?? []) f({ type: t, target: this, currentTarget: this, preventDefault: nada, stopPropagation: nada, ...ev }); },
    querySelector(s) { if (!sels.has(s)) sels.set(s, elemento(s)); return sels.get(s); }, querySelectorAll: () => [],
    closest: () => null, contains: () => false, focus: nada, setPointerCapture: nada, releasePointerCapture: nada,
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }), getContext: () => contexto(),
  };
  return el;
}
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
check('index.html sin ids repetidos', new Set(ids).size === ids.length, ids.filter((v, i) => ids.indexOf(v) !== i).join());
const porId = new Map(ids.map(i => [i, elemento(i)]));
for (const i of ids) if (/^pantalla/.test(i)) porId.get(i).hidden = i !== 'pantallaTitulo';
porId.get('hudEstrellas').children = Array.from({ length: 5 }, () => elemento());
const global_ = globalThis, ventana = elemento('window');
const def = (k, v) => Object.defineProperty(global_, k, { value: v, configurable: true, writable: true });
def('window', global_);
Object.assign(global_, { addEventListener: ventana.addEventListener, removeEventListener: nada, dispatchEvent: e => { ventana.emitir(e.type, e); return true; } });
def('innerWidth', 1280); def('innerHeight', 720); def('devicePixelRatio', 1);
def('matchMedia', q => ({ matches: q.includes('reduced-motion'), addEventListener: nada }));
const cuerpo = elemento('body');
def('document', {
  body: cuerpo, documentElement: elemento('html'), activeElement: cuerpo, hidden: false,
  getElementById: i => porId.get(i) ?? null, createElement: t => elemento('', t), createElementNS: (n, t) => elemento('', t),
  querySelectorAll: () => [], querySelector: () => null, addEventListener: nada, removeEventListener: nada, execCommand: () => false,
});
const almacen = new Map();
def('localStorage', { getItem: k => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, String(v)), removeItem: k => almacen.delete(k) });
def('navigator', { userAgent: 'node', platform: '', maxTouchPoints: 0 });
def('location', { origin: 'http://local', pathname: '/' });
def('fetch', async u => ({ json: async () => JSON.parse(await readFile(u, 'utf8')), arrayBuffer: async () => { const b = await readFile(u); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); } }));
let cuadro = null;
def('requestAnimationFrame', f => { cuadro = f; return 1; });

await import('../js/main.js');
const { ventaVista } = await import('../js/agentes.js');
const J = globalThis.__juego, $ = i => porId.get(i), clic = i => $(i).emitir('click');
let ahora = performance.now();
const correr = n => { for (let k = 0; k < n; k++) { const f = cuadro; ahora += 1000 / 60; f(ahora); } };
const tecla = (code, t = 'keydown') => ventana.emitir(t, { code, repeat: false });

console.log('Arranque');
check('main.js arranca con el mapa real', J.sim.city.real === true && J.estado === 'titulo');
correr(30);
check('en el título hay agentes cerca', J.sim.agentes.length > 0);

console.log('Partida');
clic('btnJugar');
check('Mercadería', J.estado === 'venta' && !$('pantallaMercaderia').hidden);
check('muestra el gasto fijo', $('repoGasto').textContent === '$600', $('repoGasto').textContent);
const card = $('prodGrid').children.find(c => c.dataset.producto === 'figuritas');
for (let k = 0; k < 20; k++) card.querySelector('[data-mas]').emitir('click');
clic('btnReponer');
check('pantalla de zona', !$('pantallaSeleccion').hidden);
$('selBotones').children[J.sim.city.zonaCentro].emitir('click');
check('a la calle', J.estado === 'jugando');
tecla('KeyW'); tecla('ShiftLeft'); correr(120); tecla('ShiftLeft', 'keyup'); tecla('KeyW', 'keyup');
for (let k = 0; k < 40; k++) { tecla('KeyE'); correr(2); tecla('KeyE', 'keyup'); correr(40); if (J.estado !== 'jugando') break; }

console.log('5 estrellas');
if (J.estado !== 'jugando') { clic('btnFinJugar'); }
check('sigue o vuelve a la calle', J.estado === 'jugando' || J.estado === 'venta', J.estado);
if (J.estado === 'venta') { for (let k = 0; k < 20; k++) card.querySelector('[data-mas]').emitir('click'); clic('btnReponer'); if (!$('pantallaSeleccion').hidden) $('selBotones').children[0].emitir('click'); }
const sim = J.sim, pl = J.pl;
sim.busq.nivel = 4; sim.ultima = { x: pl.px, z: pl.py, heading: 0 };
const a = sim.agentes[0];
Object.assign(a, { x: pl.px, z: pl.py - 3, yaw: 0, estado: 'patrulla', atento: true });
sim.busq.cd.venta = 0; ventaVista(sim, pl);
if (sim.busq.nivel < 5) sim.busq.nivel = 5;
correr(2);
check('5 estrellas, 2 patrullas y helicóptero', sim.busq.nivel === 5 && sim.patrullas.length === 2 && !!sim.heli, `${sim.busq.nivel} / ${sim.patrullas.length} / ${!!sim.heli}`);
check('HUD con 5 estrellas encendidas', $('hudEstrellas').children.every(e => e.classList.contains('on')));
tecla('KeyP'); const t0 = sim.t; correr(30);
check('la pausa congela la búsqueda', sim.t === t0 && !$('pantallaPausa').hidden);
tecla('KeyP'); correr(1);
for (let k = 0; k < 3600 && J.estado === 'jugando'; k++) { sim.G.coimaCd = 99; correr(1); }
check('termina capturado o zafando, sin excepciones', J.estado === 'fin' || sim.busq.nivel === 0, J.estado + ' ' + sim.busq.nivel);
if (J.estado === 'fin') {
  correr(2);
  check('al terminar queda todo limpio', sim.busq.nivel === 0 && !sim.patrullas.length && !sim.heli);
  clic('btnFinJugar');
  check('jugar de nuevo', J.estado === 'venta');
}

console.log('');
console.log(fallos === 0 ? `TODAS LAS PRUEBAS OK (${pasos})` : `FALLARON ${fallos} de ${pasos}`);
process.exit(fallos === 0 ? 0 : 1);
