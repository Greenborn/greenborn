// Viewport en celulares (2D): alto visible real, orientación, escala de UI, límite de devicePixelRatio y preferencias
// táctiles (joystick fijo o flotante, vibración, calidad). Las funciones puras se prueban en Node (tools/test_movil.mjs);
// instalarViewport() es la única parte con DOM y la llama js/movil.js.
//
// Variables CSS que publica en :root (las usa css/movil.css como respaldo de dvh/svh):
//   --alto-visible  alto visible real en px (visualViewport.height, o innerHeight)
//   --ancho-visible ancho visible real en px
//   --vh-real       1 % del alto visible, en px
//   --ui-escala     factor 0.8..1 para tipografías y espaciados en pantallas chicas

const CLAVE_PREFS = '2d_movil';
export const PREFS_MOVIL_DEFECTO = { joystick: 'flotante', vibrar: true, calidad: 'normal' };
export const JOYSTICK_MODOS = ['flotante', 'fijo'];
export const CALIDADES = ['normal', 'baja'];
export const DPR_MAX = 2;

// Alto y ancho visibles reales. vv = visualViewport (o null). En Android con la barra de direcciones visible,
// innerHeight puede incluir la parte tapada; visualViewport no. Nunca devuelve menos de 1.
export function medidasVisibles({ innerWidth = 0, innerHeight = 0, vv = null } = {}) {
  const alto = vv && vv.height > 0 ? vv.height : innerHeight;
  const ancho = vv && vv.width > 0 ? vv.width : innerWidth;
  return { ancho: Math.max(1, Math.round(ancho)), alto: Math.max(1, Math.round(alto)) };
}

// Variables CSS a partir de las medidas: alto visible, 1 % del alto y escala de UI (1 desde 540 px de alto, 0.8 en 320 px).
export function variablesViewport({ ancho, alto }) {
  const corto = Math.min(ancho, alto);
  const escala = Math.max(0.8, Math.min(1, 0.8 + (corto - 320) * (0.2 / 220)));
  return {
    '--alto-visible': alto + 'px',
    '--ancho-visible': ancho + 'px',
    '--vh-real': (alto / 100).toFixed(2) + 'px',
    '--ui-escala': escala.toFixed(3),
  };
}

// ¿Hay que mostrar la capa "Girá el teléfono"? Solo en táctil y con la pantalla más alta que ancha.
// Si matchMedia dice vertical pero las medidas dicen apaisado (teclado abierto en Android achica el alto), manda la medida:
// así la capa no se queda trabada al volver a apaisado.
export function decidirVertical({ tactil, ancho, alto }) {
  if (!tactil) return false;
  return alto > ancho * 1.05;
}

// devicePixelRatio limitado: máximo DPR_MAX; con calidad "baja", 1.
export function dprLimitado(dpr, calidad = 'normal') {
  const d = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  return calidad === 'baja' ? 1 : Math.min(DPR_MAX, d);
}

// ¿El sistema es iOS (donde no hay screen.orientation.lock ni pantalla completa del documento)? Plan B: la capa.
export function esIOS(ua = '', plataforma = '', toques = 0) {
  return /iPad|iPhone|iPod/.test(ua) || (plataforma === 'MacIntel' && toques > 1);
}

// Preferencias táctiles (clave propia en localStorage para no mezclarse con 2d_ajustes). Validadas.
export function validarPrefs(g) {
  const p = { ...PREFS_MOVIL_DEFECTO };
  if (g && JOYSTICK_MODOS.includes(g.joystick)) p.joystick = g.joystick;
  if (g && typeof g.vibrar === 'boolean') p.vibrar = g.vibrar;
  if (g && CALIDADES.includes(g.calidad)) p.calidad = g.calidad;
  return p;
}
let prefs = null;
export function prefsMovil() {
  if (prefs) return prefs;
  let g = null;
  try { g = JSON.parse(localStorage.getItem(CLAVE_PREFS) || 'null'); } catch (e) {}
  prefs = validarPrefs(g);
  return prefs;
}
export function guardarPrefMovil(clave, valor) {
  prefs = validarPrefs({ ...prefsMovil(), [clave]: valor });
  try { localStorage.setItem(CLAVE_PREFS, JSON.stringify(prefs)); } catch (e) {}
  if (typeof document !== 'undefined') pintarPrefs();
  return prefs;
}
// Clases en body: joy-fijo (joystick fijo en vez de flotante) y calidad-baja (sin sombras ni animaciones caras).
function pintarPrefs() {
  const p = prefsMovil(), b = document.body;
  if (!b) return;
  b.classList.toggle('joy-fijo', p.joystick === 'fijo');
  b.classList.toggle('calidad-baja', p.calidad === 'baja');
}

// Vibración corta (si la API existe y la preferencia está activa). Nunca tira error.
export function vibrar(ms = 12) {
  try {
    if (prefsMovil().vibrar && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(ms);
  } catch (e) {}
}
export const puedeVibrar = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

// Publica las variables CSS y avisa con onCambio({ ancho, alto }) en cada cambio de tamaño. Devuelve la función de medida.
export function instalarViewport(onCambio) {
  const de = document.documentElement;
  const medir = () => {
    const m = medidasVisibles({ innerWidth: window.innerWidth, innerHeight: window.innerHeight, vv: window.visualViewport || null });
    for (const [k, v] of Object.entries(variablesViewport(m))) de.style.setProperty(k, v);
    if (onCambio) onCambio(m);
    return m;
  };
  addEventListener('resize', medir);
  addEventListener('orientationchange', () => setTimeout(medir, 250));
  window.visualViewport?.addEventListener('resize', medir);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) medir(); });
  if (esIOS(navigator.userAgent, navigator.platform, navigator.maxTouchPoints)) document.body.classList.add('ios');
  pintarPrefs();
  medir();
  return medir;
}
