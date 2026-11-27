// Coima al capturar (G16). Sin DOM: se prueba en Node (tools/test_coima.mjs).
// Funciones puras: reciben la ronda (y la economía cuando hace falta) y devuelven estados nuevos; no modifican sus argumentos.
// Origen: 3D (`../index.html`, intentarCoima y COIMA_*). Balance de la 2D: 60 %, aceptación 55 % con decaimiento, cooldown 8 s, mínimo $500.
//
// Flujo en agentes.js: una captura (de un agente o de una patrulla) intenta una coima si no hay cooldown. main.js llama a
// tirarAceptacion() y el diálogo (elegirCoima); si se acepta, la búsqueda termina (0 estrellas para todos), no hay captura y se sigue la partida. Si no, la captura
// termina la partida como antes (F2). Sin propuesta posible (sin dinero ni producto) la captura termina la partida.
import { COIMA_FRAC, COIMA_ACEPTA, COIMA_CD, COIMA_DECAE, COIMA_MIN } from './config.js';
import { PRECIOS } from './productos.js';
import { productoActivo, stockDe } from './economia.js';

export { COIMA_FRAC, COIMA_ACEPTA, COIMA_CD, COIMA_DECAE, COIMA_MIN };

// Probabilidad de aceptación con `aceptadas` coimas ya aceptadas en la partida.
export const probAceptar = (aceptadas = 0) => COIMA_ACEPTA * COIMA_DECAE ** aceptadas;

// Valor de la mercadería de la ronda: stock de cada producto por su precio de venta.
export const valorMercaderia = rd => Object.entries(rd.lotes).reduce((a, [p, q]) => a + q * (PRECIOS[p] ?? 0), 0);

// Propuesta posible con el modo dado, o null si no hay nada que pagar.
// dinero: COIMA_FRAC del valor de la mercadería, limitado al dinero de la ronda; si queda por debajo de COIMA_MIN, no hay coima.
// producto: la mitad de las unidades del producto activo, redondeo hacia arriba (ceil(stock / 2)), sin tocar la última unidad
// (con stock 1 no hay opción). modo es obligatorio: 'producto' o 'dinero'.
export function propuestaCoima(rd, modo) {
  if (modo === 'producto') {
    const p = productoActivo(rd);
    if (!p) return null;
    const up = stockDe(rd, p);
    const unidades = Math.min(Math.ceil(up / 2), up - 1);
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

// Cooldown tras una coima aceptada (COIMA_CD s). SIN EFECTO sobre las ofertas: la coima no tiene cooldown (el estado se mantiene por si se reactiva).
export const cooldownInicial = () => COIMA_CD;
export const bajarCooldown = (cd, dt) => Math.max(0, cd - dt);

// ---- Elección del jugador (diálogo al capturar) ----
// Opciones del diálogo (se muestra solo si el agente ya aceptó la tirada): mercadería, dinero y no pagar. Cada una { id, disponible, motivo, propuesta }.
// motivo: por qué no se puede (texto para mostrar). prob solo viene si COIMA_MOSTRAR_PROB es true.
export function opcionesCoima(rd) {
  const pr = propuestaCoima(rd, 'producto');
  const pd = propuestaCoima(rd, 'dinero');
  let motProd = null, motDin = null;
  if (!pr) motProd = !productoActivo(rd) ? 'No tenés mercadería' : 'Con una sola unidad no alcanza';
  if (!pd) motDin = rd.dinero < Math.max(1, COIMA_MIN) ? 'Necesitás al menos $' + COIMA_MIN + ' de lo vendido en la ronda' : 'Tu mercadería vale muy poco';
  return [
    { id: 'producto', disponible: !!pr, motivo: motProd, propuesta: pr },
    { id: 'dinero', disponible: !!pd, motivo: motDin, propuesta: pd },
    { id: 'nada', disponible: true, motivo: null, propuesta: null },
  ];
}

// Hay algo para pagar (mercadería o dinero): si no, no vale la pena abrir el diálogo.
export const hayOpcionDePago = rd => opcionesCoima(rd).some(o => o.id !== 'nada' && o.disponible);

// Tirada de aceptación (opción B): ocurre al capturar, ANTES del diálogo. true = el agente acepta negociar.
export const tirarAceptacion = (rand = Math.random, aceptadas = 0) => rand() < probAceptar(aceptadas);

// Resuelve la elección del jugador una vez que el agente aceptó (sin nueva tirada). eleccion: 'producto' | 'dinero' | 'nada'.
// Devuelve { resultado: 'nada' | 'no_disponible' | 'pagada', oferta, econ, rd }. Solo 'pagada' descuenta; 'nada' (no pagar) y
// 'no_disponible' dejan econ y rd iguales (con 'nada' la captura termina la partida).
export function elegirCoima(econ, rd, eleccion) {
  if (eleccion !== 'producto' && eleccion !== 'dinero') return { resultado: 'nada', oferta: null, econ, rd };
  const oferta = propuestaCoima(rd, eleccion);
  if (!oferta) return { resultado: 'no_disponible', oferta: null, econ, rd };
  const pago = pagarCoima(econ, rd, oferta);
  return { resultado: 'pagada', oferta, econ: pago.econ, rd: pago.rd };
}
