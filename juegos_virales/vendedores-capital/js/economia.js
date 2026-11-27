// Economía por rondas de la 2D: caja, ronda, stock por producto, reposición, venta, cierre, desbloqueo, mejoras y persistencia.
// Sin DOM. Funciones puras: no modifican sus argumentos, devuelven estados nuevos. main.js los guarda.
// Origen: 3D (`../index.html`, bloque "Economía por rondas", liquidarRonda, cerrarRonda, maxProd y pintarMejoras).
//
// Dos estados:
//  - econ: lo que persiste entre rondas { ronda, caja, ultimaG, ventasUlt, ventasAct, mejoras }.
//  - rd (ronda en curso, en memoria): { lotes: { producto: unidades en mano }, inicial: { producto: unidades compradas },
//    activo: producto que se ofrece y vende (cambia con F o con clic en el HUD), dinero: ingresos de la ronda, costo: costo pagado }.
//  - sel (selección de la pantalla Mercadería): { producto: unidades a comprar }.
import { PRECIOS, ORDEN_DESBLOQUEO, PRODUCTO_INICIAL, PRODUCTOS } from './productos.js';
import {
  STOCK_BASE, STOCK_PASO, STOCK_MAX, COSTO_FRAC, CARRITO_BONO, CAP_MAX, CONOC_DESC, RESIST_MULT,
  OFR_RADIO, OFR_RADIO_MAX, OFR_PASO, RUN_SPEED, RUN_PASO_NIVEL, RUN_SPEED_TOPE, CONS_CORRER, CONS_MIN,
  GASTO_RONDA, GASTO_PASO, MEJ_INFLA,
} from './config.js';

export const CLAVE_ECON = 'vendedores_capital_2d_economia';

// Caja inicial = costo de llenar el primer carrito (tope de la ronda 1 x costo unitario del producto inicial), $.
export const CAPITAL_INI = Math.ceil(STOCK_BASE * PRECIOS[PRODUCTO_INICIAL] * COSTO_FRAC);

// Costos de mejora en $. Proporcionales a BASE_MEJ: costo de llenar STOCK_MAX unidades con el producto inicial.
// max = nivel máximo; costos[n] = precio base (ronda 1) para pasar del nivel n al n+1; sube con la ronda (MEJ_INFLA).
export const BASE_MEJ = Math.round(PRECIOS[PRODUCTO_INICIAL] * COSTO_FRAC * STOCK_MAX);
export const MEJORAS = {
  carrito:     { max: 2, costos: [1.5, 3].map(f => Math.round(f * BASE_MEJ)) },    // +2 y +5 de capacidad; 2 y 3 tipos por reposición
  alcance:     { max: 2, costos: [1, 2].map(f => Math.round(f * BASE_MEJ)) },    // alcance de ofrecer +0.75 por nivel
  velocidad:   { max: 2, costos: [1.2, 2.2].map(f => Math.round(f * BASE_MEJ)) },  // velocidad al correr +0.5 por nivel, tope 8.5
  resistencia: { max: 3, costos: [0.8, 1.4, 2].map(f => Math.round(f * BASE_MEJ)) }, // consumo al correr x RESIST_MULT
  proveedores: { max: 2, costos: [0.6, 1.4].map(f => Math.round(f * BASE_MEJ)) },    // descuento en el costo de compra (CONOC_DESC)
};
export const CLAVES_MEJORA = Object.keys(MEJORAS);

const mejorasNivel0 = () => Object.fromEntries(CLAVES_MEJORA.map(k => [k, 0]));

// ---------- Estado inicial y persistencia ----------

export function economiaInicial() {
  return { ronda: 1, caja: CAPITAL_INI, ultimaG: 0, ventasUlt: {}, ventasAct: {}, mejoras: mejorasNivel0() };
}

// Cada nivel de mejora queda como entero entre 0 y su máximo (datos viejos o corruptos vuelven a 0).
export function normMejoras(d) {
  const o = (d && typeof d === 'object' && !Array.isArray(d)) ? d : {};
  const r = {};
  for (const k of CLAVES_MEJORA) r[k] = Math.max(0, Math.min(MEJORAS[k].max, Math.floor(Number(o[k]) || 0)));
  return r;
}

// Lee la economía guardada. Si no hay nada válido, devuelve la inicial. `storage` por defecto: localStorage.
// Todo acceso va en try/catch (ventanas privadas, datos bloqueados).
export function cargarEconomia(storage = storageDefecto()) {
  try {
    const d = JSON.parse(storage.getItem(CLAVE_ECON) || 'null');
    if (d && Number.isFinite(d.ronda) && Number.isFinite(d.caja)) {
      const obj = v => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
      return {
        ...economiaInicial(),
        ronda: Math.max(1, Math.floor(d.ronda)),
        caja: Math.max(0, d.caja),
        ultimaG: Number(d.ultimaG) || 0,
        ventasUlt: obj(d.ventasUlt),
        ventasAct: obj(d.ventasAct),
        mejoras: normMejoras(d.mejoras),
      };
    }
  } catch (e) {}
  return economiaInicial();
}

// Guarda la economía. Devuelve true si se pudo escribir.
export function guardarEconomia(econ, storage = storageDefecto()) {
  try { storage.setItem(CLAVE_ECON, JSON.stringify(econ)); return true; } catch (e) { return false; }
}

// Partida nueva (Jugar, Reiniciar, captura o sin fondos): economía inicial guardada.
export function reiniciarEconomia(storage = storageDefecto()) {
  const e = economiaInicial();
  guardarEconomia(e, storage);
  return e;
}

function storageDefecto() {
  try { return globalThis.localStorage ?? null; } catch (e) { return null; }
}

// ---------- Stock, capacidad y mejoras ----------

// Tope de stock de la ronda r: STOCK_BASE en la ronda 1, +STOCK_PASO por ronda, máximo STOCK_MAX.
export const stockTope = r => Math.min(STOCK_MAX, STOCK_BASE + STOCK_PASO * (r - 1));

export const nivel = (econ, k) => econ.mejoras[k] || 0;

// Capacidad de la reposición de la ronda actual: tope de la ronda + bono de Carrito, sin superar CAP_MAX.
export const capacidad = econ => Math.min(CAP_MAX, stockTope(econ.ronda) + CARRITO_BONO[nivel(econ, 'carrito')]);

// Tipos de lote por reposición: 1 + nivel de Carrito (1 sin mejora, +1 por nivel). Cada tipo es un lote de un producto.
export const tiposMax = econ => 1 + nivel(econ, 'carrito');

// Alcance de ofrecer en celdas: 2.25 (base, D8) -> 3.0 -> 3.75.
export const radioOfrecer = econ => Math.min(OFR_RADIO_MAX, OFR_RADIO + OFR_PASO * nivel(econ, 'alcance'));

// Velocidad al correr en celdas/s: 7.5 -> 8.0 -> 8.5 (tope).
export const velocidadCorrer = econ => Math.min(RUN_SPEED_TOPE, RUN_SPEED + RUN_PASO_NIVEL * nivel(econ, 'velocidad'));

// Consumo de energía al correr (/s): base CONS_CORRER por RESIST_MULT del nivel, con piso CONS_MIN.
export const consumoCorrer = econ => Math.max(CONS_MIN, CONS_CORRER * RESIST_MULT[nivel(econ, 'resistencia')]);

// ---------- Desbloqueo y costos ----------

export const desbloqueadosN = econ => Math.min(ORDEN_DESBLOQUEO.length, econ.ronda);
export const productosDesbloqueados = econ => ORDEN_DESBLOQUEO.slice(0, desbloqueadosN(econ));
export const desbloqueado = (econ, p) => ORDEN_DESBLOQUEO.indexOf(p) >= 0 && ORDEN_DESBLOQUEO.indexOf(p) < desbloqueadosN(econ);
export const rondaDesbloqueo = p => ORDEN_DESBLOQUEO.indexOf(p) + 1;

// Costo unitario de compra: precio x COSTO_FRAC, con el descuento permanente de Conocimiento de proveedores.
export const costoUnit = (econ, p) => Math.round(PRECIOS[p] * COSTO_FRAC * (1 - CONOC_DESC[nivel(econ, 'proveedores')]));

// Costo unitario más bajo entre los productos desbloqueados.
export const costoMin = econ => Math.min(...productosDesbloqueados(econ).map(p => costoUnit(econ, p)));

// Gasto fijo (permiso y traslado) que se paga en cada reposición.
export const gastoRonda = econ => GASTO_RONDA + GASTO_PASO * (econ.ronda - 1);

// Sin fondos: la caja no alcanza para el gasto fijo más una unidad de algún producto desbloqueado.
export const sinFondos = econ => econ.caja < gastoRonda(econ) + costoMin(econ);

// ---------- Reposición (pantalla Mercadería) ----------

export const selVacia = () => Object.fromEntries(PRODUCTOS.map(p => [p, 0]));
export const totalSel = sel => Object.values(sel).reduce((a, b) => a + b, 0);
export const tiposSel = sel => Object.values(sel).filter(q => q > 0).length;
export const costoCompra = (econ, p, n) => costoUnit(econ, p) * n;
export const costoTotal = (econ, sel) => Object.entries(sel).reduce((a, [p, q]) => a + costoCompra(econ, p, q), 0);

// Máximo de unidades de p en la selección (incluye las que ya tiene): tope de capacidad, de caja y de tipos.
export function maxProd(econ, sel, p) {
  if (!desbloqueado(econ, p)) return 0;
  const q = sel[p] || 0;
  if (q === 0 && tiposSel(sel) >= tiposMax(econ)) return 0;
  const porCap = capacidad(econ) - (totalSel(sel) - q);
  const sobra = econ.caja - gastoRonda(econ) - (costoTotal(econ, sel) - costoCompra(econ, p, q));
  return Math.max(0, Math.min(porCap, Math.floor(sobra / costoUnit(econ, p))));
}

// Clampa la selección a los topes actuales (se llama cada vez que cambia la caja o el nivel de Carrito).
// Si trae más tipos de lote que tiposMax, quita los de última prioridad (orden de desbloqueo).
export function ajustarSel(econ, sel) {
  const out = { ...selVacia(), ...sel };
  for (const p of PRODUCTOS) out[p] = Math.max(0, Math.min(out[p] || 0, maxProd(econ, out, p)));
  let tipos = 0;
  for (const p of ORDEN_DESBLOQUEO) {
    if (out[p] > 0 && ++tipos > tiposMax(econ)) out[p] = 0;
  }
  return out;
}

// Botón − / + de un producto: devuelve una selección nueva.
export function cambiarSel(econ, sel, p, delta) {
  if (!desbloqueado(econ, p)) return { ...sel };
  const q = sel[p] || 0;
  const nq = delta > 0 ? Math.min(q + 1, maxProd(econ, sel, p)) : Math.max(0, q - 1);
  return { ...sel, [p]: nq };
}

// Compra la reposición. Devuelve { econ, rd } o null si la selección no es válida (sin unidades o sin caja).
export function reponer(econ, sel) {
  const s = ajustarSel(econ, sel);
  const n = totalSel(s), costo = costoTotal(econ, s) + gastoRonda(econ);   // incluye el gasto fijo (entra en la ganancia)
  if (n < 1 || costo > econ.caja) return null;
  const lotes = Object.fromEntries(Object.entries(s).filter(([, q]) => q > 0));
  return { econ: { ...econ, caja: econ.caja - costo }, rd: { lotes, inicial: { ...lotes }, activo: primerConStock(lotes), dinero: 0, costo } };
}

// ---------- Ronda en curso ----------

export const rondaNueva = () => ({ lotes: {}, inicial: {}, activo: null, dinero: 0, costo: 0 });
export const stockDe = (rd, p) => rd.lotes[p] || 0;
export const stockTotal = rd => Object.values(rd.lotes).reduce((a, b) => a + b, 0);
const primerConStock = lotes => ORDEN_DESBLOQUEO.find(p => (lotes[p] || 0) > 0) ?? null;

// Producto que se ofrece y vende: el activo si tiene stock. Si se agotó, el siguiente con stock en orden cíclico
// de desbloqueo (desde el activo). Sin rd.activo (ronda vieja o nueva), el primero con stock. null si no queda nada.
export function productoActivo(rd) {
  const i0 = rd.activo ? ORDEN_DESBLOQUEO.indexOf(rd.activo) : 0;
  const n = ORDEN_DESBLOQUEO.length;
  for (let k = 0; k < n; k++) {
    const p = ORDEN_DESBLOQUEO[(Math.max(0, i0) + k) % n];
    if (stockDe(rd, p) > 0) return p;
  }
  return null;
}

// Tecla F y clic en el icono del HUD: pasa al siguiente producto con stock (cíclico). Con un solo producto con stock no cambia.
// Devuelve rd nuevo.
export function cambiarProducto(rd) {
  const con = ORDEN_DESBLOQUEO.filter(p => stockDe(rd, p) > 0);
  if (con.length < 2) return { ...rd };
  const i = con.indexOf(productoActivo(rd));
  return { ...rd, activo: con[(i + 1) % con.length] };
}

// Lote de un producto: unidades compradas en la reposición de la ronda y las que quedan.
export const loteDe = (rd, p) => ({ comprado: rd.inicial?.[p] || 0, queda: stockDe(rd, p) });

// Vende hasta n unidades de p (sin pasar del stock). Suma el ingreso a rd.dinero y cuenta la venta en econ.ventasAct.
// Devuelve { econ, rd, vendidas, ingreso }.
export function vender(econ, rd, p, n) {
  const k = Math.min(n, stockDe(rd, p));
  if (!(k > 0)) return { econ, rd, vendidas: 0, ingreso: 0 };
  const ingreso = k * PRECIOS[p];
  const lotes = { ...rd.lotes, [p]: stockDe(rd, p) - k };
  // Si el producto activo se agota, el activo pasa al siguiente con stock (productoActivo).
  const nuevoRd = { ...rd, lotes, dinero: rd.dinero + ingreso };
  nuevoRd.activo = productoActivo({ ...nuevoRd, activo: p }) ?? p;
  return {
    econ: { ...econ, ventasAct: { ...econ.ventasAct, [p]: (econ.ventasAct[p] || 0) + k } },
    rd: nuevoRd,
    vendidas: k,
    ingreso,
  };
}

// Cierra la ronda vendida (stock en 0). El ingreso entra a la caja (el costo ya se pagó al reponer).
// Ganancia = ingreso - costo. Pasa a la ronda siguiente (desbloqueos y tope nuevos).
// Devuelve { econ, rd, ganancia, estado }: estado 'sin_fondos' si la caja no alcanza para nada, o 'ok'.
export function cerrarRonda(econ, rd) {
  const ganancia = rd.dinero - rd.costo;
  const nuevo = {
    ...econ,
    caja: econ.caja + rd.dinero,
    ultimaG: ganancia,
    ventasUlt: { ...econ.ventasAct },
    ventasAct: {},
    ronda: econ.ronda + 1,
  };
  return { econ: nuevo, rd: rondaNueva(), ganancia, estado: sinFondos(nuevo) ? 'sin_fondos' : 'ok' };
}

// ---------- Mejoras ----------

export const siguienteCosto = (econ, k) => {
  const m = MEJORAS[k], n = nivel(econ, k);
  return m && n < m.max ? Math.round(m.costos[n] * (1 + MEJ_INFLA * (econ.ronda - 1))) : null;
};

// Compra el siguiente nivel de una mejora con la caja. Devuelve econ nuevo o null si no se puede.
export function comprarMejora(econ, k) {
  const costo = siguienteCosto(econ, k);
  if (costo === null || econ.caja < costo) return null;
  return { ...econ, caja: econ.caja - costo, mejoras: { ...econ.mejoras, [k]: nivel(econ, k) + 1 } };
}
