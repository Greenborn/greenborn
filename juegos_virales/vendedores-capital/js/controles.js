// Controles: teclado (WASD / flechas, Shift para correr, E para ofrecer, rueda para zoom, Q y R para girar la vista 45 grados)
// y táctil (joystick fijo abajo a la izquierda, o pad de flechas si Opciones lo pide; botones Correr y Ofrecer, pellizco
// para zoom, botones de giro). Un toque o clic en el mapa (sin pellizco) avisa con onToque (caminar, G22).
// Expone un estado que main.js lee cada frame: vector de movimiento, correr y "ofrecer" de un solo disparo.
// Joystick y flechas no se usan a la vez: el primero que se toca gana hasta que se suelta (el otro se ignora).
// Táctil (mejora móvil): joystick flotante (el toque abajo a la izquierda lo centra ahí) o fijo (Ajustes),
// botones Ofrecer, Correr (mantener), Cambiar producto y Pausa, con multitoque real por pointerId: cada dedo queda
// asignado a un control y ni el pellizco ni el toque para caminar lo ven. Feedback con la clase .on y vibración corta.
import { zoomPor, girarPor } from './camara.js';
import { prefsMovil, vibrar } from './viewport.js';

const TECLAS = { KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };
const JOY_DZ = 0.12;   // zona muerta del joystick (fracción del radio)
const JOY_PLENO = 0.55;   // desde esta fracción del radio se camina a velocidad plena (el joystick nunca corre)
const TAP_PX = 12;     // movimiento máximo (px) para que un toque cuente como toque y no como arrastre
const TAP_MS = 500;    // duración máxima de un toque (ms)
export const JOY_ZONA = { ancho: 0.5, alto: 0.65 };   // zona de captura del joystick flotante: mitad izquierda x 65 % inferior

// ---------- Lógica pura (se prueba en Node: tools/test_movil.mjs) ----------
// Vector del joystick a partir del desplazamiento del dedo (px) y el radio R (px). Aplica la zona muerta y reescala
// para que la salida vaya de 0 (borde de la zona muerta) a 1 (desde `pleno`). Devuelve también el desplazamiento del knob.
export function vectorJoystick(ox, oy, R, dz = JOY_DZ, pleno = JOY_PLENO) {
  let dx = ox / R, dy = oy / R;
  let m = Math.hypot(dx, dy);
  if (!Number.isFinite(m)) return { vx: 0, vy: 0, kx: 0, ky: 0, m: 0 };
  if (m > 1) { dx /= m; dy /= m; m = 1; }
  const k = m < dz ? 0 : Math.min(1, (m - dz) / (pleno - dz));
  const s = m > 0 ? k / m : 0;
  return { vx: dx * s, vy: dy * s, kx: dx * R, ky: dy * R, m: k };
}
// ¿El toque (x, y) cae en la zona de captura del joystick flotante? (abajo a la izquierda)
export function enZonaJoystick(x, y, ancho, alto, zona = JOY_ZONA) {
  return x >= 0 && y <= alto && x < ancho * zona.ancho && y > alto * (1 - zona.alto);
}
// Centro del joystick flotante: donde tocó el dedo, corrido para que la base (radio rb) entre entera con un margen.
export function centroFlotante(x, y, rb, ancho, alto, margen = 8) {
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));
  return { x: lim(x, rb + margen, Math.max(rb + margen, ancho - rb - margen)), y: lim(y, rb + margen, Math.max(rb + margen, alto - rb - margen)) };
}
// Asignación de dedos a controles: cada pointerId tiene a lo sumo un control, y los controles exclusivos
// ('joy', 'flechas') un solo dueño a la vez (el primero que toca gana). Los botones admiten varios dedos.
export function crearAsignador(exclusivos = ['joy']) {
  const porId = new Map();
  const ocupado = c => [...porId.values()].includes(c);
  return {
    tomar(id, ctl) {
      if (porId.has(id)) return false;
      if (exclusivos.includes(ctl) && ocupado(ctl)) return false;
      porId.set(id, ctl); return true;
    },
    soltar(id) { const c = porId.get(id); porId.delete(id); return c || null; },
    de: id => porId.get(id) || null,
    dedos: ctl => [...porId].filter(([, c]) => c === ctl).map(([id]) => id),
    ocupado,
    limpiar() { porId.clear(); },
    get tamano() { return porId.size; },
  };
}


export function crearControles({ canvas, cam, onInicio, onToque, onCambiar, onPausa }) {
  const teclas = new Set();
  const st = { dx: 0, dy: 0, corre: false, ofrecer: false, tactil: false };
  // Joystick: centro y radio en píxeles, id del dedo y vector de salida (|v| <= 1).
  const joy = { id: -1, cx: 0, cy: 0, R: 1, vx: 0, vy: 0 };
  const joyEl = document.getElementById('joy');
  const joyKnob = document.getElementById('joyKnob');
  // Pad de flechas (pantalla): cada flecha suma su dirección mientras tenga un dedo encima. Map: pointerId -> [dx, dy].
  const flechas = new Map();
  const asig = crearAsignador(['joy']);
  const esPropio = e => asig.de(e.pointerId) !== null;   // dedo ya asignado a un control: no es pellizco ni toque
  const body = document.body;
  const modoJoystick = () => body.classList.contains('tactil') && !body.classList.contains('ctl-flechas');
  const flotante = () => prefsMovil().joystick !== 'fijo' && !body.classList.contains('joy-fijo');

  // Joystick: centro (cx, cy) y radio útil R en px. Flotante: aparece donde toca el dedo; fijo: centro del elemento #joy.
  function joyMover(e) {
    // Flotante: si el dedo se pasa del radio, la base lo sigue, así cambiar de dirección pide poco recorrido.
    const ox = e.clientX - joy.cx, oy = e.clientY - joy.cy, d = Math.hypot(ox, oy);
    if (d > joy.R && joyEl.classList.contains('flotando')) {
      const c = centroFlotante(e.clientX - ox / d * joy.R, e.clientY - oy / d * joy.R, joy.R / 0.7, innerWidth, innerHeight);
      joy.cx = c.x; joy.cy = c.y;
      joyEl.style.setProperty('--joy-x', c.x + 'px');
      joyEl.style.setProperty('--joy-y', c.y + 'px');
    }
    const v = vectorJoystick(e.clientX - joy.cx, e.clientY - joy.cy, joy.R);   // dy positivo = hacia abajo
    if (joyKnob) joyKnob.style.transform = `translate(${v.kx.toFixed(1)}px, ${v.ky.toFixed(1)}px)`;
    joy.vx = v.vx; joy.vy = v.vy;
    st.tactil = true;
  }
  function joyEmpezar(e, flota) {
    if (joy.id !== -1 || flechas.size > 0 || !asig.tomar(e.pointerId, 'joy')) return false;
    joy.id = e.pointerId;
    const r = joyEl.getBoundingClientRect();
    const rb = (r.width || 120) / 2;
    if (flota) {
      const c = centroFlotante(e.clientX, e.clientY, rb, innerWidth, innerHeight);
      joy.cx = c.x; joy.cy = c.y;
      joyEl.style.setProperty('--joy-x', c.x + 'px');
      joyEl.style.setProperty('--joy-y', c.y + 'px');
      joyEl.classList.add('flotando');
    } else { joy.cx = r.left + rb; joy.cy = r.top + rb; }
    joy.R = rb * 0.7;
    joyEl.classList.add('on');
    vibrar(8);
    joyMover(e);
    return true;
  }
  function joyFin(e) {
    if (e && e.pointerId !== joy.id) return;
    if (joy.id !== -1) asig.soltar(joy.id);
    joy.id = -1; joy.vx = 0; joy.vy = 0;
    if (joyKnob) joyKnob.style.transform = '';
    if (joyEl) joyEl.classList.remove('on', 'flotando');
  }
  // Joystick flotante: el toque abajo a la izquierda del mapa lo centra ahí. Se registra antes que el
  // pellizco y el toque para caminar, que ignoran a los dedos ya asignados.
  if (joyEl) {
    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' || !modoJoystick() || !flotante()) return;
      if (!enZonaJoystick(e.clientX, e.clientY, innerWidth, innerHeight)) return;
      if (joyEmpezar(e, true)) { canvas.setPointerCapture?.(e.pointerId); e.preventDefault(); }
    });
    canvas.addEventListener('pointermove', e => { if (e.pointerId === joy.id) joyMover(e); });
    canvas.addEventListener('pointerup', joyFin);
    canvas.addEventListener('pointercancel', joyFin);
    // Joystick fijo (o el dedo empieza sobre la base visible): centro del elemento.
    joyEl.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (joyEmpezar(e, false)) joyEl.setPointerCapture?.(e.pointerId);
    });
    joyEl.addEventListener('pointermove', e => { if (e.pointerId === joy.id) joyMover(e); });
    joyEl.addEventListener('pointerup', joyFin);
    joyEl.addEventListener('pointercancel', joyFin);
    joyEl.addEventListener('lostpointercapture', e => { if (joyEl.classList.contains('flotando')) return; joyFin(e); });
  }

  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'Enter') { if (onInicio) onInicio(); }
    if (TECLAS[e.code]) { teclas.add(e.code); e.preventDefault(); }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') teclas.add('Shift');
    if (e.code === 'KeyE' && !e.repeat) st.ofrecer = true;
    if ((e.code === 'KeyQ' || e.code === 'KeyR') && !e.repeat) girarPor(cam, e.code === 'KeyQ' ? -1 : 1);
  });
  window.addEventListener('keyup', e => {
    teclas.delete(e.code);
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') teclas.delete('Shift');
  });
  window.addEventListener('blur', () => teclas.clear());

  canvas.addEventListener('wheel', e => { e.preventDefault(); zoomPor(cam, e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });

  // Pellizco con dos dedos sobre el mapa: acerca o aleja según cambie la distancia entre dedos.
  const toques = new Map();
  let distPinch = 0;
  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' || esPropio(e)) return;
    toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
    distPinch = 0;
  });
  canvas.addEventListener('pointermove', e => {
    if (!toques.has(e.pointerId)) return;
    toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (toques.size !== 2) return;
    const [a, b] = toques.values();
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (distPinch > 0 && d > 0) zoomPor(cam, d / distPinch);
    distPinch = d;
  });
  const soltarToque = e => { toques.delete(e.pointerId); distPinch = 0; };
  canvas.addEventListener('pointerup', soltarToque);
  canvas.addEventListener('pointercancel', soltarToque);

  // Toque o clic en el mapa (G22): un solo dedo o puntero, sin arrastrar y sin pellizco. Se avisa al soltar.
  // Un segundo puntero durante el gesto lo anula (es un pellizco, no un toque).
  const punteros = new Set();
  let tap = null;   // { id, x, y, t } del gesto en curso que puede ser un toque
  canvas.addEventListener('pointerdown', e => {
    if (esPropio(e)) return;
    tap = punteros.size === 0 ? { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() } : null;
    punteros.add(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (tap && e.pointerId === tap.id && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > TAP_PX) tap = null;
  });
  const finTap = e => {
    punteros.delete(e.pointerId);
    if (!tap || e.pointerId !== tap.id) return;
    const valido = e.type === 'pointerup' && performance.now() - tap.t < TAP_MS && punteros.size === 0;
    const p = tap;
    tap = null;
    if (valido && onToque) onToque({ x: p.x, y: p.y });
  };
  canvas.addEventListener('pointerup', finTap);
  canvas.addEventListener('pointercancel', finTap);

  // Pad de flechas (opción "flechas" en Opciones; se muestra solo en táctil). Arbitraje: si el joystick está en uso, se ignora.
  for (const b of document.querySelectorAll('#dpad [data-dir]')) {
    const [dx, dy] = b.dataset.dir.split(',').map(Number);
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (joy.id !== -1 || !asig.tomar(e.pointerId, 'flecha')) return;
      flechas.set(e.pointerId, [dx, dy]);
      b.setPointerCapture?.(e.pointerId);
      b.classList.add('on');
      vibrar(8);
      st.tactil = true;
    });
    const soltar = e => {
      if (!flechas.delete(e.pointerId)) return;
      asig.soltar(e.pointerId);
      b.classList.remove('on');
    };
    b.addEventListener('pointerup', soltar);
    b.addEventListener('pointercancel', soltar);
    b.addEventListener('lostpointercapture', soltar);
  }

  // Botones de acción: cada dedo se asigna al botón; .on mientras haya algún dedo encima (feedback visual).
  function boton(id, { alPresionar, mantener = false } = {}) {
    const b = document.getElementById(id);
    if (!b) return null;
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (!asig.tomar(e.pointerId, id)) return;
      b.setPointerCapture?.(e.pointerId);
      b.classList.add('on');
      if (mantener) b.dataset.on = '1';
      st.tactil = true;
      vibrar(12);
      if (alPresionar) alPresionar();
    });
    const suelta = e => {
      if (asig.de(e.pointerId) !== id) return;
      asig.soltar(e.pointerId);
      if (asig.dedos(id).length) return;
      b.classList.remove('on');
      delete b.dataset.on;
    };
    b.addEventListener('pointerup', suelta);
    b.addEventListener('pointercancel', suelta);
    b.addEventListener('lostpointercapture', suelta);
    // La acción ya corrió en pointerdown: se anula el click sintético del toque, que si no caería sobre el menú
    // recién abierto debajo del dedo (botón Pausa).
    b.addEventListener('touchend', e => e.preventDefault(), { passive: false });
    // Teclado o lector de pantalla (click sin puntero): mismo efecto que tocar, salvo en Correr.
    if (!mantener && alPresionar) b.addEventListener('click', e => { if (e.detail === 0) alPresionar(); });
    return b;
  }
  boton('btnOfrecer', { alPresionar: () => { st.ofrecer = true; } });
  const btnCorrer = boton('btnCorrer', { mantener: true });
  boton('btnCambiar', { alPresionar: () => onCambiar && onCambiar() });
  boton('btnPausaT', { alPresionar: () => onPausa && onPausa() });
  // Botones de giro (móvil): cada toque gira 45 grados.
  for (const [id, paso] of [['btnRotL', -1], ['btnRotR', 1]]) {
    const b = document.getElementById(id);
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); girarPor(cam, paso); vibrar(8); });
  }

  // Lee el estado del frame: dirección (normalizada), correr y ofrecer (se consume al leer).
  function leer() {
    let dx = 0, dy = 0;
    for (const c of teclas) { const v = TECLAS[c]; if (v) { dx += v[0]; dy += v[1]; } }
    dx += joy.vx; dy += joy.vy;
    for (const [fx, fy] of flechas.values()) { dx += fx; dy += fy; }
    const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    // La entrada es en pantalla (arriba = arriba de la vista): se pasa a coordenadas de la ciudad según el giro de la cámara.
    const c = Math.cos(cam.rot), s = Math.sin(cam.rot);
    [dx, dy] = [dx * c + dy * s, -dx * s + dy * c];
    st.dx = dx; st.dy = dy;
    st.corre = teclas.has('Shift') || (btnCorrer?.dataset.on === '1');   // el joystick solo camina
    const ofrecer = st.ofrecer; st.ofrecer = false;
    return { dx, dy, corre: st.corre, ofrecer };
  }
  function tactilActivo() { return st.tactil; }
  // Suelta todo (al pausar, perder el foco o empezar una partida) para que no quede movimiento pegado.
  function resetLecturas() {
    st.ofrecer = false; teclas.clear();
    joyFin();
    flechas.clear();
    asig.limpiar();
    for (const b of document.querySelectorAll('.touch-btn.on')) b.classList.remove('on');
    for (const b of document.querySelectorAll('#dpad [data-dir].on')) b.classList.remove('on');
    tap = null;
    delete btnCorrer?.dataset.on;
  }
  return { leer, tactilActivo, resetLecturas };
}
