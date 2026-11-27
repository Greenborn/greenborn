// Pruebas headless de economia.js y productos.js (sin navegador ni DOM). Uso: node 2d/tools/test_economia.mjs
// Venta y caja, reposición parcial, cierre de ronda, desbloqueo, sin fondos, tope de stock, costo con proveedores,
// mejoras (carrito, alcance, velocidad, resistencia, proveedores) y persistencia con un storage simulado.
import {
  CLAVE_ECON, CAPITAL_INI, BASE_MEJ, MEJORAS, economiaInicial, cargarEconomia, guardarEconomia, reiniciarEconomia,
  stockTope, capacidad, tiposMax, radioOfrecer, velocidadCorrer, consumoCorrer, costoUnit, desbloqueado, rondaDesbloqueo,
  costoMin, sinFondos, selVacia, totalSel, costoTotal, maxProd, ajustarSel, cambiarSel, reponer, rondaNueva, stockDe,
  stockTotal, productoActivo, vender, cerrarRonda, comprarMejora, siguienteCosto, nivel,
  cambiarProducto, loteDe, gastoRonda,
} from '../js/economia.js';
import { PRECIOS, ORDEN_DESBLOQUEO, DEMANDA, PRODUCTO_INICIAL } from '../js/productos.js';
import { SPEED, RUN_SPEED, OFR_RADIO, CONOC_DESC } from '../js/config.js';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}
const cerca = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

// Storage simulado (mismo contrato que localStorage: getItem / setItem).
function storageSim(inicial = {}) {
  const d = { ...inicial };
  return { d, getItem: k => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); } };
}
const storageRoto = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };

console.log('0. Valores copiados de la 3D');
{
  check('PRECIOS como en la 3D', PRECIOS.medias === 5000 && PRECIOS.empanadas === 2000 && PRECIOS.churros === 1500 && PRECIOS.figuritas === 290 && PRECIOS.paltas === 1000);
  check('DEMANDA como en la 3D', DEMANDA.medias === 1 && DEMANDA.empanadas === 1.2 && DEMANDA.churros === 1.2 && DEMANDA.figuritas === 0.9 && DEMANDA.paltas === 0.8);
  check('orden de desbloqueo como en la 3D', ORDEN_DESBLOQUEO.join() === 'figuritas,churros,empanadas,medias,paltas');
  check('producto inicial = figuritas', PRODUCTO_INICIAL === 'figuritas');
  check('CAPITAL_INI = ceil(30 x 290 x 0.5) = 4350', CAPITAL_INI === 4350, String(CAPITAL_INI));
  check('BASE_MEJ = round(290 x 0.5 x 40) = 5800', BASE_MEJ === 5800, String(BASE_MEJ));
  check('costos base de mejoras (balance 2D)',
    MEJORAS.carrito.costos.join() === '8700,17400' && MEJORAS.alcance.costos.join() === '5800,11600' &&
    MEJORAS.velocidad.costos.join() === '6960,12760' && MEJORAS.resistencia.costos.join() === '4640,8120,11600' &&
    MEJORAS.proveedores.costos.join() === '3480,8120');
  check('base de movimiento de config.js', SPEED === 4.5 && RUN_SPEED === 7.5 && OFR_RADIO === 2.25);
}

console.log('1. Venta suma a la caja (al cerrar la ronda)');
{
  let econ = economiaInicial();
  const r = reponer(econ, { ...selVacia(), figuritas: 10 });
  check('reposición válida', r !== null);
  econ = r.econ;
  check('reponer descuenta el costo de la caja', econ.caja === CAPITAL_INI - 10 * 145 - 600, String(econ.caja));
  let rd = r.rd;
  check('stock de la ronda = lo comprado', stockDe(rd, 'figuritas') === 10 && stockTotal(rd) === 10);
  const v = vender(econ, rd, 'figuritas', 2);
  check('vender 2 unidades: ingreso = 2 x 290', v.vendidas === 2 && v.ingreso === 580 && v.rd.dinero === 580, JSON.stringify([v.vendidas, v.ingreso]));
  check('vender no cambia la caja (el ingreso queda en la ronda)', v.econ.caja === econ.caja);
  check('la venta cuenta en ventasAct', v.econ.ventasAct.figuritas === 2);
  check('vender no baja el stock de otro producto', stockDe(v.rd, 'churros') === 0 && stockDe(v.rd, 'figuritas') === 8);
  const v2 = vender(v.econ, v.rd, 'figuritas', 50);
  check('vender más de lo que hay se limita al stock', v2.vendidas === 8 && stockTotal(v2.rd) === 0);
  check('vender con stock 0 no hace nada', vender(v2.econ, v2.rd, 'figuritas', 1).vendidas === 0);
  check('argumentos originales no se modifican', rd.dinero === 0 && econ.caja === CAPITAL_INI - 2050);
}

console.log('2. Reposición parcial (maxCant) y topes de la selección');
{
  const econ = { ...economiaInicial(), caja: 1760 };
  check('con $1760 se puede comprar 8 figuritas (145 c/u + $600 de gasto fijo)', maxProd(econ, selVacia(), 'figuritas') === 8, String(maxProd(econ, selVacia(), 'figuritas')));
  const s = ajustarSel(econ, { ...selVacia(), figuritas: 30 });
  check('ajustarSel recorta a lo que alcanza la caja', s.figuritas === 8, String(s.figuritas));
  check('reponer con selección que no alcanza: usa el recorte', reponer(econ, { ...selVacia(), figuritas: 30 })?.econ.caja === 1760 - 8 * 145 - 600);
  check('reponer con caja insuficiente devuelve null', reponer({ ...economiaInicial(), caja: 50 }, { ...selVacia(), figuritas: 1 }) === null);
  check('reponer sin unidades devuelve null', reponer(economiaInicial(), selVacia()) === null);
  check('tipos: sin Carrito solo 1 producto por reposición', tiposMax(economiaInicial()) === 1);
  const sel1 = { ...selVacia(), figuritas: 5 };
  const econ2 = { ...economiaInicial(), ronda: 2 };
  check('ronda 2: churros desbloqueado, sin Carrito sigue en 1 tipo', maxProd(econ2, sel1, 'churros') === 0);
  check('cambiarSel suma 1 y respeta el tope', cambiarSel(econ, selVacia(), 'figuritas', 1).figuritas === 1);
  check('cambiarSel no baja de 0', cambiarSel(econ, selVacia(), 'figuritas', -1).figuritas === 0);
}

console.log('3. Cierre de ronda');
{
  let econ = economiaInicial();
  const r = reponer(econ, { ...selVacia(), figuritas: 10 });
  econ = r.econ;
  const v = vender(econ, r.rd, 'figuritas', 10);
  const c = cerrarRonda(v.econ, v.rd);
  check('ganancia = ingresos - costo (2900 - 2050)', c.ganancia === 850, String(c.ganancia));
  check('caja = caja anterior + ingresos', c.econ.caja === econ.caja + 2900, String(c.econ.caja));
  check('ronda pasa a 2', c.econ.ronda === 2);
  check('ultimaG guardada', c.econ.ultimaG === 850);
  check('ventasUlt = ventasAct, ventasAct vacío (reparto)', c.econ.ventasUlt.figuritas === 10 && Object.keys(c.econ.ventasAct).length === 0);
  check('la ronda nueva arranca vacía', stockTotal(c.rd) === 0 && c.rd.dinero === 0 && c.rd.costo === 0);
  check('estado ok con caja suficiente', c.estado === 'ok');
}

console.log('4. Desbloqueo por ronda');
{
  const e1 = economiaInicial();
  check('ronda 1: solo figuritas', desbloqueado(e1, 'figuritas') && !desbloqueado(e1, 'churros') && !desbloqueado(e1, 'paltas'));
  check('ronda 1: maxProd de un bloqueado = 0', maxProd({ ...e1, caja: 1e6 }, selVacia(), 'churros') === 0);
  const e3 = { ...economiaInicial(), ronda: 3 };
  check('ronda 3: figuritas, churros y empanadas', ['figuritas', 'churros', 'empanadas'].every(p => desbloqueado(e3, p)) && !desbloqueado(e3, 'medias'));
  check('rondaDesbloqueo: churros = 2, paltas = 5', rondaDesbloqueo('churros') === 2 && rondaDesbloqueo('paltas') === 5);
  const e9 = { ...economiaInicial(), ronda: 9 };
  check('ronda 9: todos desbloqueados', ORDEN_DESBLOQUEO.every(p => desbloqueado(e9, p)));
  const c = cerrarRonda({ ...economiaInicial(), caja: 1e6 }, { lotes: {}, dinero: 0, costo: 0 });
  check('cerrar ronda 1 desbloquea churros para la ronda 2', desbloqueado(c.econ, 'churros'));
}

console.log('5. Sin fondos');
{
  const e = { ...economiaInicial(), caja: 744 };
  check('caja 744 < 600 + 145 (figuritas): sin fondos', sinFondos(e) === true && costoMin(e) === 145);
  const ok = { ...economiaInicial(), caja: 745 };
  check('caja 745: todavía alcanza para una figurita', sinFondos(ok) === false);
  // Al cerrar la ronda, si la caja queda debajo del costo mínimo, el estado es sin_fondos.
  const rd = { lotes: {}, dinero: 0, costo: 4350 };
  const c = cerrarRonda({ ...economiaInicial(), caja: 0 }, { ...rd, dinero: 50, costo: 50 });
  check('cerrarRonda devuelve sin_fondos cuando la caja no alcanza', c.estado === 'sin_fondos', c.estado);
  const c2 = cerrarRonda({ ...economiaInicial(), caja: 100 }, { lotes: {}, dinero: 1200, costo: 0 });
  check('cerrarRonda con ingresos que alcanzan: ok', c2.estado === 'ok' && c2.econ.caja === 1300);
  check('sin fondos solo mira productos desbloqueados', costoMin({ ...economiaInicial(), ronda: 1, caja: 200 }) === 145);
}

console.log('6. Tope de stock por ronda');
{
  check('stockTope: ronda 1 = 30, ronda 2 = 32, ronda 5 = 38', stockTope(1) === 30 && stockTope(2) === 32 && stockTope(5) === 38);
  check('stockTope: máximo 40 desde la ronda 6', stockTope(6) === 40 && stockTope(20) === 40);
  const e = economiaInicial();
  check('capacidad ronda 1 sin Carrito = 30', capacidad(e) === 30);
  const eCar1 = { ...e, mejoras: { ...e.mejoras, carrito: 1 } };
  check('Carrito nivel 1 suma 2 (32)', capacidad(eCar1) === 32);
  const eCar2 = { ...e, mejoras: { ...e.mejoras, carrito: 2 } };
  check('Carrito nivel 2 suma 5 (35)', capacidad(eCar2) === 35);
  const e6 = { ...economiaInicial(), ronda: 6, mejoras: { ...e.mejoras, carrito: 2 } };
  check('ronda 6 con Carrito 2: tope absoluto 45', capacidad(e6) === 45, String(capacidad(e6)));
  const eTipos = { ...e, mejoras: { ...e.mejoras, carrito: 2 } };
  check('Carrito nivel 2: 3 tipos por reposición', tiposMax(eTipos) === 3);
  const eRep = { ...economiaInicial(), caja: 1e6 };
  const s = ajustarSel(eRep, { ...selVacia(), figuritas: 99 });
  check('la selección no supera la capacidad de la ronda', s.figuritas === 30, String(s.figuritas));
}

console.log('7. Costo con Conocimiento de proveedores');
{
  const e0 = economiaInicial();
  check('costo base figuritas = 145 (290 x 0.5)', costoUnit(e0, 'figuritas') === 145);
  const e1 = { ...e0, mejoras: { ...e0.mejoras, proveedores: 1 } };
  check('nivel 1: -10 % (round(290 x 0.5 x 0.9) = 131)', costoUnit(e1, 'figuritas') === Math.round(145 * 0.9) && costoUnit(e1, 'figuritas') === 131, String(costoUnit(e1, 'figuritas')));
  const e2 = { ...e0, mejoras: { ...e0.mejoras, proveedores: 2 } };
  check('nivel 2: -20 % (round(290 x 0.5 x 0.8) = 116)', costoUnit(e2, 'figuritas') === 116, String(costoUnit(e2, 'figuritas')));
  check('CONOC_DESC = [0, 0.10, 0.20]', CONOC_DESC.join() === '0,0.1,0.2');
  const r = reponer({ ...e2, caja: 10000 }, { ...selVacia(), figuritas: 10 });
  check('reponer usa el costo con descuento (10 x 116 + 600)', r.econ.caja === 10000 - 1760, String(r.econ.caja));
  check('costoTotal de la selección con descuento', costoTotal(e2, { ...selVacia(), figuritas: 10 }) === 1160);
}

console.log('8. Mejoras: compra, niveles y efectos');
{
  let e = { ...economiaInicial(), caja: 1e6 };
  check('siguienteCosto alcance nivel 0 = 5800', siguienteCosto(e, 'alcance') === 5800);
  e = comprarMejora(e, 'alcance');
  check('compra alcance: nivel 1 y caja descontada', nivel(e, 'alcance') === 1 && e.caja === 1e6 - 5800);
  check('alcance nivel 1: radio 3.0', cerca(radioOfrecer(e), 3.0));
  e = comprarMejora(e, 'alcance');
  check('alcance nivel 2: radio 3.75 (tope)', nivel(e, 'alcance') === 2 && cerca(radioOfrecer(e), 3.75));
  check('alcance al máximo: no se compra más', comprarMejora(e, 'alcance') === null);
  check('velocidad nivel 0 = 7.5', cerca(velocidadCorrer(economiaInicial()), 7.5));
  const ev1 = { ...economiaInicial(), mejoras: { ...economiaInicial().mejoras, velocidad: 1 } };
  const ev2 = { ...ev1, mejoras: { ...ev1.mejoras, velocidad: 2 } };
  check('velocidad: 8.0 y 8.5 (tope)', cerca(velocidadCorrer(ev1), 8) && cerca(velocidadCorrer(ev2), 8.5));
  const ec = economiaInicial();
  const cons = [0, 1, 2, 3].map(n => consumoCorrer({ ...ec, mejoras: { ...ec.mejoras, resistencia: n } }));
  check('consumo al correr: 12, 9.6, 7.8, 6 (RESIST_MULT)', cerca(cons[0], 12) && cerca(cons[1], 9.6) && cerca(cons[2], 7.8) && cerca(cons[3], 6), cons.join());
  check('consumo nunca baja de CONS_MIN (5)', consumoCorrer({ ...ec, mejoras: { ...ec.mejoras, resistencia: 3 } }) >= 5);
  check('mejora con caja insuficiente: null', comprarMejora({ ...economiaInicial(), caja: 100 }, 'carrito') === null);
  check('mejora desconocida: null', comprarMejora(economiaInicial(), 'nada') === null);
  check('las mejoras se conservan al cerrar la ronda', cerrarRonda(e, rondaNueva()).econ.mejoras.alcance === 2);
}

console.log('8b. Gasto fijo al reponer e inflación de mejoras');
{
  const r1 = economiaInicial(), r4 = { ...economiaInicial(), ronda: 4 };
  check('gasto fijo: 600 en la ronda 1 y +300 por ronda', gastoRonda(r1) === 600 && gastoRonda(r4) === 1500, String(gastoRonda(r4)));
  check('inflación: alcance en la ronda 4 = 5800 x 1.45', siguienteCosto(r4, 'alcance') === 8410, String(siguienteCosto(r4, 'alcance')));
}

console.log('9. Persistencia (storage simulado)');
{
  const s = storageSim();
  check('clave de persistencia', CLAVE_ECON === 'vendedores_capital_2d_economia');
  const e = { ...economiaInicial(), caja: 1234, ronda: 3, ultimaG: -50, mejoras: { ...economiaInicial().mejoras, carrito: 1 } };
  check('guardarEconomia escribe y devuelve true', guardarEconomia(e, s) === true && typeof s.d[CLAVE_ECON] === 'string');
  const l = cargarEconomia(s);
  check('cargarEconomia recupera caja, ronda, ultimaG y mejoras', l.caja === 1234 && l.ronda === 3 && l.ultimaG === -50 && l.mejoras.carrito === 1);
  s.d[CLAVE_ECON] = '{no es json';
  check('JSON roto: vuelve a la economía inicial', cargarEconomia(s).caja === CAPITAL_INI);
  s.d[CLAVE_ECON] = JSON.stringify({ ronda: 2, caja: 500, mejoras: { carrito: 99, alcance: -3, velocidad: 'x' } });
  const n = cargarEconomia(s);
  check('mejoras corruptas se normalizan a [0, max]', n.mejoras.carrito === 2 && n.mejoras.alcance === 0 && n.mejoras.velocidad === 0);
  s.d[CLAVE_ECON] = JSON.stringify({ ronda: 'x', caja: 5 });
  check('datos sin ronda numérica: inicial', cargarEconomia(s).caja === CAPITAL_INI);
  check('storage que lanza: cargar no falla y da la inicial', cargarEconomia(storageRoto).caja === CAPITAL_INI);
  check('storage que lanza: guardar no falla y devuelve false', guardarEconomia(e, storageRoto) === false);
  const r = reiniciarEconomia(s);
  check('reiniciarEconomia: caja inicial, ronda 1 y mejoras en 0', r.caja === CAPITAL_INI && r.ronda === 1 && Object.values(r.mejoras).every(v => v === 0));
  check('reiniciarEconomia guarda la inicial', cargarEconomia(s).caja === CAPITAL_INI && cargarEconomia(s).ronda === 1);
}

console.log('10. Producto activo y stock');
{
  let rd = { lotes: { churros: 0, figuritas: 3 }, dinero: 0, costo: 0 };
  check('producto activo = primero con stock en orden de desbloqueo', productoActivo(rd) === 'figuritas');
  rd = { lotes: { churros: 2, figuritas: 0 }, dinero: 0, costo: 0 };
  check('si figuritas se agota, pasa a churros', productoActivo(rd) === 'churros');
  check('sin stock: productoActivo = null', productoActivo({ lotes: {}, dinero: 0, costo: 0 }) === null);
  check('totalSel suma las unidades', totalSel({ ...selVacia(), figuritas: 2, paltas: 1 }) === 3);
}

console.log('11. Lotes por reposición (1 + nivel de Carrito)');
{
  const base = { ...economiaInicial(), ronda: 5, caja: 1000000 };   // ronda 5: los cinco productos desbloqueados
  const todos = { figuritas: 5, churros: 5, empanadas: 5, medias: 5, paltas: 5 };
  for (const [nivelCarrito, tipos] of [[0, 1], [1, 2], [2, 3]]) {
    const econ = { ...base, mejoras: { ...base.mejoras, carrito: nivelCarrito } };
    const r = reponer(econ, todos);
    const lotes = Object.keys(r.rd.lotes).length;
    check('carrito nivel ' + nivelCarrito + ': ' + tipos + ' lote(s) por reposición', tiposMax(econ) === tipos && lotes === tipos, String(lotes));
  }
  const r0 = reponer(base, todos);
  check('cada lote tiene las unidades compradas', r0.rd.lotes.figuritas === 5 && r0.rd.inicial.figuritas === 5);
  check('reponer sin mejora cobra solo el lote de figuritas (5 x 145 + gasto 1800)', r0.econ.caja === base.caja - 2525, String(r0.econ.caja));
  check('reponer deja el producto activo en el primer lote en orden', r0.rd.activo === 'figuritas');
  const r1 = reponer({ ...base, mejoras: { ...base.mejoras, carrito: 1 } }, { ...selVacia(), churros: 4, paltas: 3, medias: 2 });
  check('con 2 tipos, la selección de 3 se recorta a los 2 primeros en orden (churros y medias)', r1.rd.lotes.churros === 4 && r1.rd.lotes.medias === 2 && r1.rd.lotes.paltas === undefined, JSON.stringify(r1.rd.lotes));
  check('lote: comprado y en mano', JSON.stringify(loteDe(r1.rd, 'churros')) === '{"comprado":4,"queda":4}');
  check('lote de producto sin reposición: 0 y 0', JSON.stringify(loteDe(r1.rd, 'figuritas')) === '{"comprado":0,"queda":0}');
  const v = vender(r1.econ, r1.rd, 'churros', 3);
  check('vender no cambia el lote comprado', loteDe(v.rd, 'churros').comprado === 4 && loteDe(v.rd, 'churros').queda === 1);
}

console.log('12. Cambio de producto (tecla F y clic en el icono)');
{
  const rd = { lotes: { figuritas: 3, churros: 2, empanadas: 0 }, inicial: {}, activo: 'figuritas', dinero: 0, costo: 0 };
  const c1 = cambiarProducto(rd);
  check('F: pasa de figuritas a churros', c1.activo === 'churros', String(c1.activo));
  check('F: cambiar no modifica la ronda original', rd.activo === 'figuritas');
  const c2 = cambiarProducto(c1);
  check('F otra vez: vuelve a figuritas (cíclico, saltea empanadas sin stock)', c2.activo === 'figuritas', String(c2.activo));
  check('F: el producto activo cambia la venta (productoActivo)', productoActivo(c1) === 'churros' && productoActivo(c2) === 'figuritas');
  const v = vender(economiaInicial(), c1, productoActivo(c1), 1);
  check('vender con el producto activo cobra su precio (churros 1500)', v.ingreso === PRECIOS.churros && v.rd.lotes.churros === 1, String(v.ingreso));
  const solo = { lotes: { medias: 4 }, inicial: {}, activo: 'medias', dinero: 0, costo: 0 };
  check('F con un solo producto con stock no cambia nada', cambiarProducto(solo).activo === 'medias');
  const vacio = { lotes: {}, inicial: {}, activo: null, dinero: 0, costo: 0 };
  check('F sin mercadería: sigue sin producto', productoActivo(cambiarProducto(vacio)) === null);
  const tres = { lotes: { paltas: 1, medias: 1, churros: 1 }, inicial: {}, activo: 'churros', dinero: 0, costo: 0 };
  check('F recorre en orden de desbloqueo: churros -> medias', cambiarProducto(tres).activo === 'medias');
  check('F recorre en orden de desbloqueo: medias -> paltas', cambiarProducto({ ...tres, activo: 'medias' }).activo === 'paltas');
}

console.log('13. Agotamiento automático del producto activo');
{
  const rd = { lotes: { figuritas: 1, churros: 3 }, inicial: {}, activo: 'figuritas', dinero: 0, costo: 0 };
  const v = vender(economiaInicial(), rd, 'figuritas', 1);
  check('figuritas se agota: el activo pasa a churros', v.rd.activo === 'churros' && productoActivo(v.rd) === 'churros');
  check('sin cambio manual, churros queda con su stock', stockDe(v.rd, 'churros') === 3);
  const ciclo = { lotes: { figuritas: 1, medias: 2, paltas: 1 }, inicial: {}, activo: 'paltas', dinero: 0, costo: 0 };
  const w = vender(economiaInicial(), ciclo, 'paltas', 1);
  check('paltas se agota: pasa al siguiente en orden cíclico (figuritas)', w.rd.activo === 'figuritas', String(w.rd.activo));
  const ult = { lotes: { medias: 2 }, inicial: {}, activo: 'medias', dinero: 0, costo: 0 };
  const u = vender(economiaInicial(), ult, 'medias', 2);
  check('último producto agotado: no queda producto activo', productoActivo(u.rd) === null && stockTotal(u.rd) === 0);
  const ren = reponer({ ...economiaInicial(), ronda: 2, caja: 100000 }, { ...selVacia(), figuritas: 2 });
  check('ronda nueva parte con el activo del lote', ren.rd.activo === 'figuritas');
  const cierre = cerrarRonda({ ...economiaInicial(), caja: 0 }, u.rd);
  check('cerrar la ronda tras agotar: vuelve a ronda vacía', cierre.rd.activo === null && stockTotal(cierre.rd) === 0);
}

console.log('');
console.log(fallos === 0 ? `TODAS LAS PRUEBAS OK (${pasos})` : `FALLARON ${fallos} de ${pasos}`);
process.exit(fallos === 0 ? 0 : 1);
