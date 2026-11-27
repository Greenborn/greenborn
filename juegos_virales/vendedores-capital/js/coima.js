// Coima al capturar (G16). Sin DOM: se prueba en Node (tools/test_coima.mjs).
// Funciones puras: reciben la ronda (y la economía cuando hace falta) y devuelven estados nuevos; no modifican sus argumentos.
// Origen: 3D (`../index.html`, intentarCoima y COIMA_*). Balance de la 2D: 60 %, aceptación 55 % con decaimiento, cooldown 8 s, mínimo $500.
//
// Flujo en agentes.js: una captura (de un agente o de una patrulla) intenta una coima si no hay cooldown. main.js llama a
// ofrecerCoima(); si se acepta, la búsqueda termina (0 estrellas para todos), no hay captura y se sigue la partida. Si no, la captura
// termina la partida como antes (F2). Sin propuesta posible (sin dinero ni producto) la captura termina la partida.
import { COIMA_MODO, COIMA_FRAC, COIMA_ACEPTA, COIMA_CD, COIMA_DECAE, COIMA_MIN } from './config.js';
import { PRECIOS } from './productos.js';
import { productoActivo, stockDe } from './economia.js';

export { COIMA_MODO, COIMA_FRAC, COIMA_ACEPTA, COIMA_CD, COIMA_DECAE, COIMA_MIN };

// Probabilidad de aceptación con `aceptadas` coimas ya aceptadas en la partida.
export const probAceptar = (aceptadas = 0) => COIMA_ACEPTA * COIMA_DECAE ** aceptadas;

// Valor de la mercadería de la ronda: stock de cada producto por su precio de venta.
export const valorMercaderia = rd => Object.entries(rd.lotes).reduce((a, [p, q]) => a + q * (PRECIOS[p] ?? 0), 0);

// Propuesta posible con el modo dado, o null si no hay nada que pagar.
// dinero: COIMA_FRAC del valor de la mercadería, limitado al dinero de la ronda; si queda por debajo de COIMA_MIN, no hay coima.
// producto: COIMA_FRAC de las unidades del producto activo, redondeo hacia arriba, sin tocar la última unidad.
export function propuestaCoima(rd, modo = COIMA_MODO) {
  if (modo === 'producto') {
    const p = productoActivo(rd);
    if (!p) return null;
    const up = stockDe(rd, p);
    const unidades = Math.min(Math.ceil(up * COIMA_FRAC), up - 1);
    return unidades >= 1 ? { modo: 'producto', producto: p, unidades } : null;
  }
  const monto = Math.min(rd.dinero, Math.round(COIMA_FRAC * valorMercaderia(rd)));
  return monto >= Math.max(1, COIMA_MIN) ? { modo: 'dinero', monto } : null;
}

// Descuenta de la ronda lo que se paga con la propuesta. Devuelve { econ, rd } nuevos.
export function pagarCoima(econ, rd, propuesta) {
  if (propuesta.modo === 'producto') {
    const lotes = { ...rd.lotes, [propuesta.producto]: stockDe(rd, propuesta.producto) - propuesta.unidades };
    return { econ, rd: { ...rd, lotes } };
  }
  return { econ, rd: { ...rd, dinero: rd.dinero - propuesta.monto } };
}

// Oferta completa en una captura. rand: generador de [0, 1) (inyectable). Acepta si rand() < COIMA_ACEPTA.
// Devuelve { oferta, aceptada, econ, rd }: oferta null si no hay nada para pagar (la captura sigue); si hay oferta y el agente
// la rechaza, econ y rd quedan igual.
export function ofrecerCoima(econ, rd, rand = Math.random, modo = COIMA_MODO, aceptadas = 0) {
  const oferta = propuestaCoima(rd, modo);
  if (!oferta) return { oferta: null, aceptada: false, econ, rd };
  if (!(rand() < probAceptar(aceptadas))) return { oferta, aceptada: false, econ, rd };
  const pago = pagarCoima(econ, rd, oferta);
  return { oferta, aceptada: true, econ: pago.econ, rd: pago.rd };
}

// Cooldown tras una coima aceptada: no hay nueva oferta mientras dure (COIMA_CD s).
export const cooldownInicial = () => COIMA_CD;
export const bajarCooldown = (cd, dt) => Math.max(0, cd - dt);
export const puedeOfrecer = cd => cd <= 0;
