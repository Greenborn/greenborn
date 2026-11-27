// Ajustes del jugador (volumen, silencio, distancia de vista, zoom inicial, límite de FPS, patrulla de agentes y controles en pantalla).
// Se guardan en localStorage con la clave "2d_ajustes". Sin DOM: main.js los lee y los aplica.
// Todo acceso a localStorage va en try/catch: en ventanas privadas o con datos bloqueados se usan los defaults.
import { ZOOM_OPCIONES, DISTANCIA_OPCIONES, FPS_OPCIONES, PATRULLA_OPCIONES, CONTROLES_OPCIONES } from './config.js';

const CLAVE = '2d_ajustes';

export const AJUSTES_DEFECTO = { volumen: 0.8, silencio: false, distancia: 'media', zoom: 'medio', fps: 60, patrulla: 'vereda', controles: 'joystick' };

// Devuelve un objeto nuevo con los ajustes guardados, validados contra las opciones conocidas.
export function cargarAjustes() {
  const a = { ...AJUSTES_DEFECTO };
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) || '{}') || {};
    if (typeof g.volumen === 'number' && g.volumen >= 0 && g.volumen <= 1) a.volumen = g.volumen;
    if (typeof g.silencio === 'boolean') a.silencio = g.silencio;
    if (DISTANCIA_OPCIONES.includes(g.distancia)) a.distancia = g.distancia;
    if (ZOOM_OPCIONES[g.zoom] !== undefined) a.zoom = g.zoom;
    if (FPS_OPCIONES.includes(g.fps)) a.fps = g.fps;
    if (Object.keys(PATRULLA_OPCIONES).includes(g.patrulla)) a.patrulla = g.patrulla;
    if (CONTROLES_OPCIONES.includes(g.controles)) a.controles = g.controles;
  } catch (e) {}
  return a;
}

// Guarda el objeto de ajustes completo.
export function guardarAjustes(a) {
  try { localStorage.setItem(CLAVE, JSON.stringify(a)); } catch (e) {}
}
