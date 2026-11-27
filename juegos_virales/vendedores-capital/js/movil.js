// Ajustes para celulares en la versión 2D: modo táctil (body.tactil), pantalla completa,
// apaisado y capa "Girá el teléfono" en vertical. No pausa la partida: avisa con el evento
// 'movil:vertical' (detail.vertical) y main.js decide si pausa y si reanuda.
import { instalarViewport, decidirVertical, prefsMovil, guardarPrefMovil, puedeVibrar, esIOS } from './viewport.js';
const de = document.documentElement;
const mq = q => window.matchMedia ? matchMedia(q) : { matches: false, addEventListener() {} };
const editable = t => !!(t && t.closest && t.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));

// Mismo criterio que la 3D: puntero grueso, o táctil sin puntero fino. Un laptop con mouse queda como escritorio.
export const esTactil = () => mq('(pointer: coarse)').matches ||
  (('ontouchstart' in window || navigator.maxTouchPoints > 0) && !mq('(any-pointer: fine)').matches);

// Sin menú contextual, selección ni arrastre sobre el juego (en táctil, en toda la página).
document.addEventListener('contextmenu', e => { if (!editable(e.target) && esTactil()) e.preventDefault(); });
document.addEventListener('selectstart', e => { if (!editable(e.target)) e.preventDefault(); });
document.addEventListener('dragstart', e => { if (!editable(e.target)) e.preventDefault(); });
for (const ev of ['gesturestart', 'gesturechange']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });

// ---------- Pantalla completa ----------
const fsElemento = () => document.fullscreenElement || document.webkitFullscreenElement || null;
const soportaFS = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled) &&
  !!(de.requestFullscreen || de.webkitRequestFullscreen);

// Bloqueo apaisado: en Android/Chrome sólo funciona en pantalla completa; en iOS no existe. Si falla, queda la capa.
function bloquearApaisado() {
  try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) {}
}
function liberarOrientacion() {
  try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
}
// Tiene que correr dentro del gesto del usuario: nada asíncrono antes de pedir la pantalla completa.
function entrarPC() {
  try {
    const p = de.requestFullscreen ? de.requestFullscreen({ navigationUI: 'hide' }) : de.webkitRequestFullscreen();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}
function salirPC() {
  try {
    const p = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen && document.webkitExitFullscreen();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}
function alternarPantallaCompleta() { if (fsElemento()) salirPC(); else entrarPC(); }

const botonesPC = () => document.querySelectorAll('[data-pantalla-completa]');
function pintarBotonesPC() {
  const en = !!fsElemento(), ocultar = !soportaFS();
  document.body.classList.toggle('en-pantalla-completa', en);
  botonesPC().forEach(b => {
    b.hidden = ocultar;
    b.setAttribute('aria-pressed', String(en));
    const txt = en ? 'Salir de pantalla completa' : 'Pantalla completa';
    b.setAttribute('aria-label', txt); b.title = txt;
  });
}
function alCambiarPC() {
  if (fsElemento()) bloquearApaisado(); else liberarOrientacion();
  pintarBotonesPC();
}
document.addEventListener('fullscreenchange', alCambiarPC);
document.addEventListener('webkitfullscreenchange', alCambiarPC);
botonesPC().forEach(b => b.addEventListener('click', e => { e.preventDefault(); alternarPantallaCompleta(); }));
// Tocar Jugar en el celular: pantalla completa (si se puede); al entrar, alCambiarPC bloquea en apaisado.
const btnJugar = document.getElementById('btnJugar');
// Sin pantalla completa (o si ya está), igual se intenta bloquear apaisado; en iOS no existe y queda la capa (plan B).
if (btnJugar) btnJugar.addEventListener('click', () => {
  if (!esTactil()) return;
  if (soportaFS() && !fsElemento()) entrarPC();
  else bloquearApaisado();
});
pintarBotonesPC();

// ---------- Capa "Girá el teléfono" ----------
// Aparece en táctil y vertical en cualquier pantalla (título, menús y partida). La decisión usa el tamaño visible real
// (viewport.js), no solo matchMedia: así no queda trabada si el navegador tarda en avisar el giro.
const mqVertical = mq('(orientation: portrait)');
let vertical = null, repiteT = 0, medida = { ancho: innerWidth, alto: innerHeight };
const avisar = () => dispatchEvent(new CustomEvent('movil:vertical', { detail: { vertical } }));
function revisarOrientacion() {
  const v = decidirVertical({ tactil: esTactil(), ancho: medida.ancho, alto: medida.alto });
  if (v === vertical) return;
  vertical = v;
  document.body.classList.toggle('movil-vertical', v);
  const capa = document.getElementById('capaGirar');
  if (capa) capa.setAttribute('aria-hidden', String(!v));
  if (v && document.activeElement && document.activeElement.blur && !editable(document.activeElement)) document.activeElement.blur();
  avisar();
  // Mientras siga en vertical se repite el aviso, por si la partida arranca tapada.
  clearInterval(repiteT);
  if (v) repiteT = setInterval(avisar, 500);
}
const medir = instalarViewport(m => { medida = m; revisarOrientacion(); });
mqVertical.addEventListener?.('change', () => { medir(); setTimeout(medir, 300); });
addEventListener('orientationchange', () => setTimeout(medir, 200));
mq('(pointer: coarse)').addEventListener?.('change', revisarOrientacion);
document.addEventListener('fullscreenchange', () => setTimeout(medir, 100));
// iOS: texto del plan B (no se puede bloquear el giro desde la página).
if (esIOS(navigator.userAgent, navigator.platform, navigator.maxTouchPoints)) {
  const d = document.getElementById('capaGirarD');
  if (d) d.textContent = 'Poné el celu apaisado y seguimos. Si no gira, desactivá el bloqueo de rotación.';
}

// ---------- Opciones táctiles (si están en Opciones: #optJoystick, #optVibrar, #optCalidad) ----------
function montarOpcionesTactiles() {
  const p = prefsMovil();
  const j = document.getElementById('optJoystick'), v = document.getElementById('optVibrar'), c = document.getElementById('optCalidad');
  if (j) { j.value = p.joystick; j.addEventListener('change', () => guardarPrefMovil('joystick', j.value)); }
  if (c) { c.value = p.calidad; c.addEventListener('change', () => guardarPrefMovil('calidad', c.value)); }
  if (v) {
    const fila = v.closest('label') || v;
    if (!puedeVibrar()) { fila.hidden = true; v.checked = false; }
    else { v.checked = p.vibrar; v.addEventListener('change', () => guardarPrefMovil('vibrar', v.checked)); }
  }
}
montarOpcionesTactiles();

// Clase body.tactil: muestra joystick y botones de pantalla. Se recalcula si cambia el tipo de puntero.
const ajustarTactil = () => document.body.classList.toggle('tactil', esTactil());
ajustarTactil();
mq('(any-pointer: fine)').addEventListener?.('change', ajustarTactil);
mq('(pointer: coarse)').addEventListener?.('change', ajustarTactil);
revisarOrientacion();
