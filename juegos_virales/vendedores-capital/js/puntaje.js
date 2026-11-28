// Puntaje de la 2D: puntos por venta, zafadas, bonus de sigilo y de tiempo, medallas, récord y texto de compartir.
// Sin DOM. Funciones puras: no modifican la partida, devuelven una nueva. main.js reasigna `partida`.
// Origen: 3D (`../index.html`: PTS_*, T_BONUS_*, finPartida, CLAVE_RECORD y kProd; `medalla()` en js/ui.js).
import {
  PTS_VENTA, PTS_ESCAPE, PTS_BONUS_SIGILO, PTS_BONUS_TIEMPO, T_BONUS_BASE, T_BONUS_POR_U, BONUS_TIEMPO_ESCALA, MEDALLA_MIN,
} from './config.js';
import { NOMBRE_PRODUCTO } from './productos.js';
import { ptsEscapeMult } from './busqueda.js';

// Claves propias de la 2D (no se mezclan con las de la 3D).
export const CLAVE_RECORD = '2d_record';
export const claveRecordProducto = producto => CLAVE_RECORD + '_' + producto;

// ---------- Partida ----------
// Campos: ingresos ($), unidades, escapes, ptsVenta, ptsEscape, bonusSigilo, bonusTiempo (puntos),
// perseguido (hubo búsqueda en la ronda en curso), coimas (aceptadas en la partida) y producto (último producto vendido).
export const crearPartida = () => ({
  ingresos: 0, unidades: 0, escapes: 0, ptsVenta: 0, ptsEscape: 0, bonusSigilo: 0, bonusTiempo: 0, perseguido: false, producto: null, coimas: 0,
});

// Venta de `unidades` del producto `producto` por `ingreso` $. Cada unidad vale PTS_VENTA.
export function registrarVenta(pa, producto, unidades, ingreso) {
  if (!(unidades > 0)) return pa;
  return {
    ...pa,
    unidades: pa.unidades + unidades,
    ingresos: pa.ingresos + ingreso,
    ptsVenta: pa.ptsVenta + unidades * PTS_VENTA,
    producto,
  };
}

// Puntos por zafar con `nivel` estrellas: PTS_ESCAPE x (1, 1.5, 2, 2.5, 3).
export const puntosEscape = (nivel = 1) => Math.round(PTS_ESCAPE * ptsEscapeMult(nivel));
export function registrarEscape(pa, nivel = 1) {
  return { ...pa, escapes: pa.escapes + 1, ptsEscape: pa.ptsEscape + puntosEscape(nivel) };
}
export const registrarCoima = pa => ({ ...pa, coimas: (pa.coimas ?? 0) + 1 });

// Marca que hubo búsqueda: esta ronda no da bonus de sigilo.
export function marcarPerseguido(pa) {
  return pa.perseguido ? pa : { ...pa, perseguido: true };
}

// Puntaje total: suma de los cuatro componentes (el mismo número que muestra el HUD y el desglose).
export const puntosTotal = pa => pa.ptsVenta + pa.ptsEscape + pa.bonusSigilo + pa.bonusTiempo;

// ---------- Bonus de la ronda ----------

// Unidades compradas en la ronda (rd.inicial: lote de la reposición).
export const unidadesCompradas = rd => Object.values(rd?.inicial ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);

// Tiempo de referencia del bonus de tiempo (s): T_BONUS_BASE + T_BONUS_POR_U por unidad comprada.
export const tiempoBonus = unidadesRonda => T_BONUS_BASE + T_BONUS_POR_U * Math.max(0, unidadesRonda);

// Bonus de sigilo: PTS_BONUS_SIGILO si no hubo búsqueda en la ronda.
export const bonusSigilo = perseguido => (perseguido ? 0 : PTS_BONUS_SIGILO);

// Bonus de tiempo: máximo al empezar (crece con la ronda), baja linealmente a 0 al llegar a tiempoBonus(unidades).
export const bonusTiempoMax = (ronda = 1) => PTS_BONUS_TIEMPO * (1 + BONUS_TIEMPO_ESCALA * (ronda - 1));
export function bonusTiempo(tRonda, unidadesRonda, ronda = 1) {
  const f = Math.min(1, Math.max(0, tRonda) / tiempoBonus(unidadesRonda));
  return Math.round(bonusTiempoMax(ronda) * (1 - f));
}

// Cierra la ronda: suma el bonus de sigilo y el de tiempo, y deja el sigilo listo para la ronda siguiente.
export function cerrarRondaPuntos(pa, { tRonda, unidadesRonda, ronda = 1 }) {
  return {
    ...pa,
    perseguido: false,
    bonusSigilo: pa.bonusSigilo + bonusSigilo(pa.perseguido),
    bonusTiempo: pa.bonusTiempo + bonusTiempo(tRonda, unidadesRonda, ronda),
  };
}

// Filas del desglose de la pantalla de fin. La última fila es el total.
export function desgloseFin(pa) {
  return [
    { id: 'ventas', nombre: 'Unidades vendidas', detalle: pa.unidades + ' u.', puntos: pa.ptsVenta },
    { id: 'escapes', nombre: 'Zafadas', detalle: String(pa.escapes), puntos: pa.ptsEscape },
    { id: 'sigilo', nombre: 'Bonus de sigilo', detalle: '', puntos: pa.bonusSigilo },
    { id: 'tiempo', nombre: 'Bonus de tiempo', detalle: '', puntos: pa.bonusTiempo },
    { id: 'total', nombre: 'Puntaje total', detalle: '', puntos: puntosTotal(pa) },
  ];
}

// ---------- Medallas ----------
// Mismos umbrales que la 3D: bronce 500, plata 1000, oro 1500. Devuelve null bajo el umbral del bronce.
export function medalla(p) {
  if (p >= MEDALLA_MIN.oro) return { id: 'oro', txt: 'ORO', ico: '🥇' };
  if (p >= MEDALLA_MIN.plata) return { id: 'plata', txt: 'PLATA', ico: '🥈' };
  if (p >= MEDALLA_MIN.bronce) return { id: 'bronce', txt: 'BRONCE', ico: '🥉' };
  return null;
}

// ---------- Récord ----------
// storage: objeto con getItem/setItem (localStorage por defecto). Todo acceso va en try/catch.
export function storageDefecto() {
  try { return globalThis.localStorage ?? null; } catch (e) { return null; }
}

function leerNumero(storage, clave) {
  try { return Math.max(0, Number(storage?.getItem(clave)) || 0); } catch (e) { return 0; }
}

function escribir(storage, clave, valor) {
  try { storage?.setItem(clave, String(valor)); } catch (e) { /* sin almacenamiento: el récord queda solo en pantalla */ }
}

// Récord global y récord del producto (0 si no hay).
export function leerRecords(producto, storage = storageDefecto()) {
  return {
    global: leerNumero(storage, CLAVE_RECORD),
    producto: producto ? leerNumero(storage, claveRecordProducto(producto)) : 0,
  };
}

// Compara el puntaje con los récords guardados y guarda los que se superan (solo si el puntaje es mayor que 0).
// Devuelve { global, producto, nuevoGlobal, nuevoProducto, previoGlobal, previoProducto }: los valores vigentes y si hubo récord nuevo.
export function actualizarRecord(puntos, producto, storage = storageDefecto()) {
  const previo = leerRecords(producto, storage);
  const nuevoGlobal = puntos > 0 && puntos > previo.global;
  const nuevoProducto = !!producto && puntos > 0 && puntos > previo.producto;
  if (nuevoGlobal) escribir(storage, CLAVE_RECORD, puntos);
  if (nuevoProducto) escribir(storage, claveRecordProducto(producto), puntos);
  return {
    global: nuevoGlobal ? puntos : previo.global,
    producto: nuevoProducto ? puntos : previo.producto,
    nuevoGlobal,
    nuevoProducto,
    previoGlobal: previo.global,
    previoProducto: previo.producto,
  };
}

// ---------- Compartir ----------
// Texto del resultado: motivo, producto, puntaje y medalla. No incluye nombre ni otros datos personales.
const RESULTADO = {
  capturado: 'Me atraparon',
  atropello: 'Me atropellaron por cruzar sin mirar',
  sin_fondos: 'Me quedé sin fondos para reponer',
};

export function textoCompartir({ motivo = null, puntos = 0, medalla: m = null, producto = null } = {}) {
  const res = RESULTADO[motivo] ?? 'Terminé la partida';
  const prod = producto ? ' (' + (NOMBRE_PRODUCTO[producto] ?? producto) + ')' : '';
  const med = m ? ', medalla ' + m.txt.toLowerCase() : '';
  return `${res}${prod} en Vendedores Capital: ${puntos} puntos${med}. ¿Podés superarme?`;
}

// Enlaces de cada red para el texto y la URL dados. Se generan solo en el cliente: el único envío es el enlace que el usuario abre.
export function enlacesCompartir(texto, url) {
  const t = encodeURIComponent(texto), u = encodeURIComponent(url);
  return {
    whatsapp: 'https://wa.me/?text=' + encodeURIComponent(texto + ' ' + url),
    x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + u + '&quote=' + t,
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
  };
}
