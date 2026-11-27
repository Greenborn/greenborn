// Pruebas headless de puntaje.js (sin navegador). Uso: node 2d/tools/test_puntaje.mjs
// Componentes de puntos, bonus de tiempo lineal sin bajar de 0, medallas en los límites, récord global y por producto
// con storage simulado, desglose igual al total y texto de compartir sin datos personales.
import {
  crearPartida, registrarVenta, registrarEscape, marcarPerseguido, cerrarRondaPuntos, puntosTotal, desgloseFin,
  unidadesCompradas, tiempoBonus, bonusTiempo, bonusSigilo, medalla,
  CLAVE_RECORD, claveRecordProducto, leerRecords, actualizarRecord, textoCompartir, enlacesCompartir,
} from '../js/puntaje.js';
import { PTS_VENTA, PTS_ESCAPE, PTS_BONUS_SIGILO, PTS_BONUS_TIEMPO, T_BONUS_BASE, T_BONUS_POR_U, MEDALLA_MIN } from '../js/config.js';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}

// Storage simulado con la misma interfaz que localStorage.
function storageSim(inicial = {}) {
  const m = new Map(Object.entries(inicial));
  return {
    m,
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
  };
}
const storageRoto = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };

console.log('1. Constantes de la 3D');
{
  check('PTS_VENTA = 100', PTS_VENTA === 100);
  check('PTS_ESCAPE = 300', PTS_ESCAPE === 300);
  check('PTS_BONUS_SIGILO = 500', PTS_BONUS_SIGILO === 500);
  check('PTS_BONUS_TIEMPO = 500', PTS_BONUS_TIEMPO === 500);
  check('T_BONUS = 120 s + 6 s por unidad', T_BONUS_BASE === 120 && T_BONUS_POR_U === 6);
  check('medallas 8000 / 20000 / 40000', MEDALLA_MIN.bronce === 8000 && MEDALLA_MIN.plata === 20000 && MEDALLA_MIN.oro === 40000);
}

console.log('2. Puntos por venta y escape');
{
  let pa = crearPartida();
  pa = registrarVenta(pa, 'figuritas', 3, 870);
  check('3 unidades valen 300 puntos de venta', pa.ptsVenta === 300, String(pa.ptsVenta));
  check('unidades e ingresos acumulados', pa.unidades === 3 && pa.ingresos === 870);
  check('producto = último vendido', pa.producto === 'figuritas');
  const antes = pa;
  pa = registrarVenta(pa, 'paltas', 0, 0);
  check('venta de 0 unidades no cambia nada', pa === antes);
  pa = registrarEscape(pa);
  check('escape suma 300 y cuenta una zafada', pa.ptsEscape === 300 && pa.escapes === 1);
  pa = registrarEscape(pa);
  check('dos escapes suman 600', pa.ptsEscape === 600 && pa.escapes === 2);
  check('total = venta + escapes (sin bonus)', puntosTotal(pa) === 900, String(puntosTotal(pa)));
}

console.log('3. Bonus de sigilo');
{
  check('sin persecución: 500', bonusSigilo(false) === 500);
  check('con persecución: 0', bonusSigilo(true) === 0);
  let pa = marcarPerseguido(crearPartida());
  pa = cerrarRondaPuntos(pa, { tRonda: 0, unidadesRonda: 0 });
  check('ronda cerrada perseguido: sin bonus de sigilo', pa.bonusSigilo === 0);
  const sin = cerrarRondaPuntos(crearPartida(), { tRonda: 0, unidadesRonda: 0 });
  check('ronda cerrada sin persecución: bonus de sigilo 500', sin.bonusSigilo === 500);
  const marcada = marcarPerseguido(pa);
  check('marcarPerseguido es idempotente', marcarPerseguido(marcada) === marcada);
  check('el sigilo vuelve en la ronda siguiente', cerrarRondaPuntos(pa, { tRonda: 0, unidadesRonda: 0 }).bonusSigilo === 500);
  check('zafar con 5 estrellas: x3', registrarEscape(crearPartida(), 5).ptsEscape === 900);
  check('bonus de tiempo en la ronda 5: x2', bonusTiempo(0, 0, 5) === 1000);
}

console.log('4. Bonus de tiempo');
{
  check('T_BONUS con 0 unidades = 120 s', tiempoBonus(0) === 120);
  check('T_BONUS con 5 unidades = 150 s', tiempoBonus(5) === 150);
  check('al empezar (t = 0): 500', bonusTiempo(0, 0) === 500);
  check('a la mitad (t = 60 de 120): 250', bonusTiempo(60, 0) === 250, String(bonusTiempo(60, 0)));
  check('en T_BONUS: 0', bonusTiempo(120, 0) === 0);
  check('pasado T_BONUS: no baja de 0', bonusTiempo(500, 0) === 0 && bonusTiempo(121, 0) === 0);
  check('tiempo negativo: no pasa de 500', bonusTiempo(-5, 0) === 500);
  check('T_BONUS crece con las unidades: t = 75 con 5 u. = 250', bonusTiempo(75, 5) === 250, String(bonusTiempo(75, 5)));
  let previo = Infinity, lineal = true, noNeg = true;
  for (let t = 0; t <= 200; t += 1) {
    const b = bonusTiempo(t, 3);
    if (b > previo) lineal = false;
    if (b < 0) noNeg = false;
    previo = b;
  }
  check('baja de forma no creciente y nunca es negativo', lineal && noNeg);
  const paso = bonusTiempo(0, 0) - bonusTiempo(12, 0);
  const paso2 = bonusTiempo(12, 0) - bonusTiempo(24, 0);
  check('baja lineal: mismo descuento por cada 12 s', paso === paso2 && paso > 0, paso + ' / ' + paso2);
  let pa = cerrarRondaPuntos(crearPartida(), { tRonda: 30, unidadesRonda: 0 });
  check('cerrar ronda suma el bonus de tiempo al total', pa.bonusTiempo === 375 && puntosTotal(pa) === 375 + 500, String(pa.bonusTiempo));
}

console.log('5. Unidades compradas de la ronda');
{
  check('suma las unidades de rd.inicial', unidadesCompradas({ inicial: { medias: 4, churros: 6 } }) === 10);
  check('sin ronda: 0', unidadesCompradas(null) === 0 && unidadesCompradas({}) === 0);
}

console.log('6. Medallas en los límites');
{
  check('0 sin medalla', medalla(0) === null);
  check('7999 sin medalla', medalla(7999) === null);
  check('8000 bronce', medalla(8000)?.id === 'bronce');
  check('19999 bronce', medalla(19999)?.id === 'bronce');
  check('20000 plata', medalla(20000)?.id === 'plata');
  check('39999 plata', medalla(39999)?.id === 'plata');
  check('40000 oro', medalla(40000)?.id === 'oro');
  check('texto de oro', medalla(40000)?.txt === 'ORO');
}

console.log('7. Récord global y por producto');
{
  const st = storageSim();
  check('claves 2d_ (no las de la 3D)', CLAVE_RECORD === '2d_record' && claveRecordProducto('paltas') === '2d_record_paltas');
  let r = actualizarRecord(700, 'figuritas', st);
  check('primer puntaje es récord global y del producto', r.nuevoGlobal && r.nuevoProducto && r.global === 700 && r.producto === 700);
  check('se guardan en storage con claves 2d_', st.m.get('2d_record') === '700' && st.m.get('2d_record_figuritas') === '700');
  r = actualizarRecord(400, 'figuritas', st);
  check('puntaje menor no cambia récords', !r.nuevoGlobal && !r.nuevoProducto && r.global === 700 && r.producto === 700);
  r = actualizarRecord(900, 'churros', st);
  check('récord global nuevo, pero el de churros es propio', r.nuevoGlobal && r.nuevoProducto && r.global === 900 && r.producto === 900);
  check('figuritas conserva su récord', leerRecords('figuritas', st).producto === 700);
  r = actualizarRecord(800, 'figuritas', st);
  check('no es récord global (900) pero sí de figuritas (800 > 700)', !r.nuevoGlobal && r.nuevoProducto && r.producto === 800 && r.global === 900);
  r = actualizarRecord(0, 'paltas', st);
  check('puntaje 0 no es récord', !r.nuevoGlobal && !r.nuevoProducto);
  check('leer sin storage devuelve 0', leerRecords('medias', null).global === 0 && leerRecords('medias', null).producto === 0);
  const sinStorage = actualizarRecord(300, 'medias', storageRoto);
  check('storage bloqueado no rompe y devuelve el récord del puntaje', sinStorage.nuevoGlobal && sinStorage.global === 300);
  const sinProd = actualizarRecord(1200, null, storageSim());
  check('sin producto: solo récord global', sinProd.nuevoGlobal && !sinProd.nuevoProducto);
}

console.log('8. Desglose y total');
{
  let pa = crearPartida();
  pa = registrarVenta(pa, 'medias', 2, 10000);
  pa = registrarEscape(pa);
  pa = cerrarRondaPuntos(pa, { tRonda: 100, unidadesRonda: 2 });
  const filas = desgloseFin(pa);
  const total = filas.at(-1);
  const suma = filas.slice(0, -1).reduce((a, f) => a + f.puntos, 0);
  check('el desglose tiene 4 componentes y el total', filas.length === 5 && total.id === 'total');
  check('suma de componentes = puntaje total', suma === total.puntos && total.puntos === puntosTotal(pa), suma + ' vs ' + total.puntos);
  check('nombres de las filas', ['Unidades vendidas', 'Zafadas', 'Bonus de sigilo', 'Bonus de tiempo'].every((n, i) => filas[i].nombre === n));
}

console.log('9. Texto de compartir y enlaces');
{
  const txt = textoCompartir({ motivo: 'capturado', puntos: 23456, medalla: medalla(23456), producto: 'churros' });
  check('texto con resultado, producto, puntaje y medalla', txt === 'Me atraparon (Churros) en Vendedores Capital: 23456 puntos, medalla plata. ¿Podés superarme?', txt);
  const sinMed = textoCompartir({ motivo: 'sin_fondos', puntos: 120, medalla: null, producto: null });
  check('sin medalla ni producto', sinMed === 'Me quedé sin fondos para reponer en Vendedores Capital: 120 puntos. ¿Podés superarme?', sinMed);
  check('el texto no lleva datos del usuario (solo lo recibido)', !/@|https?:|dni|nombre|usuario/i.test(txt));
  const L = enlacesCompartir(txt, 'https://ejemplo.test/juego');
  check('cuatro redes con enlace', ['whatsapp', 'x', 'facebook', 'telegram'].every(k => typeof L[k] === 'string' && L[k].startsWith('https://')));
  check('el enlace de WhatsApp incluye el texto codificado', L.whatsapp.includes(encodeURIComponent(txt)) && L.whatsapp.includes(encodeURIComponent('https://ejemplo.test/juego')));
  check('cada enlace apunta a un servicio de compartir conocido', [L.whatsapp, L.x, L.facebook, L.telegram].every(u => /^https:\/\/(wa\.me|twitter\.com|www\.facebook\.com|t\.me)\//.test(u)));
}

console.log('');
console.log(fallos === 0 ? `TODAS LAS PRUEBAS OK (${pasos})` : `FALLARON ${fallos} de ${pasos}`);
process.exit(fallos === 0 ? 0 : 1);
