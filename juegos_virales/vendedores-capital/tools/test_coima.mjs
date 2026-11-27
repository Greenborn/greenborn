// Pruebas headless de coima.js y de la integración con agentes.js (sin navegador). Uso: node 2d/tools/test_coima.mjs
// Modo dinero limitado a la caja de la ronda, modo producto con redondeo, cooldown, aceptación determinista con un generador
// inyectado, captura sin coima (termina la partida), coima rechazada, coima aceptada (el agente vuelve a su esquina) y cooldown.
import { N, generarCiudad } from '../js/ciudad.js';
import {
  crearSimulacion, stepAgentes, resolverCoima, ventaVista, ofertaVista, corridaVista, alertarAgentes, POLI_PAUSA_CAPT,
} from '../js/agentes.js';
import {
  propuestaCoima, pagarCoima, valorMercaderia, cooldownInicial, bajarCooldown,
  COIMA_FRAC, COIMA_ACEPTA, COIMA_CD, COIMA_MIN, probAceptar, opcionesCoima, elegirCoima, tirarAceptacion, hayOpcionDePago,
} from '../js/coima.js';
import { PRECIOS, PRODUCTO_INICIAL } from '../js/productos.js';
import { economiaInicial } from '../js/economia.js';
import { COIMA_CIEGO } from '../js/config.js';
import { colorCono, COL_CONO_CIEGO } from '../js/render.js';
import { readFileSync } from 'node:fs';
import { MOTIVOS_FIN } from '../js/textos.js';
import { textoCompartir } from '../js/puntaje.js';
import { cerrarRonda, sinFondos, costoMin } from '../js/economia.js';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}

const P = PRODUCTO_INICIAL;
const rdCon = (unid, dinero = 0, p = P) => ({ lotes: unid > 0 ? { [p]: unid } : {}, inicial: { [p]: unid }, activo: p, dinero, costo: 0 });

console.log('1. Constantes (defaults de la 3D)');
{
  check('COIMA_FRAC = 0.6', COIMA_FRAC === 0.6);
  check('COIMA_ACEPTA = 0.55', COIMA_ACEPTA === 0.55);
  check('COIMA_CD = 8 s', COIMA_CD === 8);
}

console.log('2. Modo dinero: 60 % de la mercadería, limitado a la caja de la ronda');
{
  const unid = 10, valor = unid * PRECIOS[P];
  const r1 = propuestaCoima(rdCon(unid, 1e9), 'dinero');
  check('paga el 60 % del valor de la mercadería si hay dinero', r1?.modo === 'dinero' && r1.monto === Math.round(valor * 0.6), JSON.stringify(r1));
  const r2 = propuestaCoima(rdCon(unid, 600), 'dinero');
  check('si el dinero de la ronda no alcanza, paga todo lo que hay', r2?.monto === 600, JSON.stringify(r2));
  check('sin dinero en la ronda no hay coima en modo dinero', propuestaCoima(rdCon(unid, 0), 'dinero') === null);
  check('sin mercadería el valor es 0', valorMercaderia(rdCon(0, 100)) === 0);
  const r3 = propuestaCoima(rdCon(unid, 1e9), 'dinero');
  const pago = pagarCoima(economiaInicial(), rdCon(unid, 1e9), r3);
  check('pagar descuenta el monto del dinero de la ronda', pago.rd.dinero === 1e9 - r3.monto);
  check('pagar en dinero no toca el stock', pago.rd.lotes[P] === unid);
}

console.log('3. Mercadería: la mitad del stock (ceil), siempre queda 1');
{
  const casos = [[0, null], [1, null], [2, 1], [3, 2], [4, 2], [5, 3], [10, 5], [11, 6]];
  for (const [up, esperado] of casos) {
    const r = propuestaCoima(rdCon(up), 'producto');
    const got = r ? r.unidades : null;
    check(`stock ${up} -> entrega ${esperado ?? 'nada'}`, got === esperado, 'obtenido=' + got);
    if (r) {
      const pago = pagarCoima(economiaInicial(), rdCon(up), r);
      check(`stock ${up}: queda al menos 1 unidad`, pago.rd.lotes[P] >= 1, 'queda=' + pago.rd.lotes[P]);
    }
  }
  check('mercadería no usa el dinero', propuestaCoima(rdCon(4, 0), 'producto')?.unidades === 2);
}

console.log('4. Tirada de aceptación y elección (sin cooldown)');
{
  const econ = economiaInicial();
  const rd = rdCon(10, 2000);
  check('rand < COIMA_ACEPTA: acepta', tirarAceptacion(() => 0.54, 0));
  check('rand = COIMA_ACEPTA: rechaza', !tirarAceptacion(() => 0.55, 0));
  check('rand 0 acepta y 0.999 rechaza', tirarAceptacion(() => 0, 0) && !tirarAceptacion(() => 0.999, 0));
  check('la aceptación decae x0.6 por coima aceptada', probAceptar(0) === 0.55 && Math.abs(probAceptar(1) - 0.33) < 1e-9);
  check('con 1 aceptada, rand 0.4 ya rechaza', !tirarAceptacion(() => 0.4, 1));
  check('menos de $500 vendidos en la ronda: no hay coima en dinero', propuestaCoima(rdCon(10, COIMA_MIN - 1), 'dinero') === null && propuestaCoima(rdCon(10, COIMA_MIN), 'dinero')?.monto === 500);
  const ac = elegirCoima(econ, rd, 'dinero');
  check('pagar en dinero: descuenta del dinero de la ronda', ac.resultado === 'pagada' && ac.rd.dinero === 2000 - ac.oferta.monto);
  check('sin dinero ni producto: ninguna opción de pago', !hayOpcionDePago(rdCon(0, 0)));
  const mp = elegirCoima(econ, rdCon(4, 0), 'producto');
  check('mercadería con stock 4: entrega 2 y quedan 2', mp.resultado === 'pagada' && mp.rd.lotes[P] === 2);
  const s1 = opcionesCoima(rdCon(1, 100000));
  check('stock 1: mercadería deshabilitada aunque haya dinero', !s1[0].disponible && !!s1[0].motivo);
}

console.log('5. Cooldown: ya no bloquea ofertas (solo estado)');
{
  check('cooldown inicial = COIMA_CD', cooldownInicial() === 8);
  check('el cooldown baja con dt y no pasa de 0', bajarCooldown(3, 1.5) === 1.5 && bajarCooldown(0.5, 1) === 0);
}

// Ciudad sintética: todo calle abierta. Agente en su esquina; el jugador queda pegado a él para forzar la captura.
function ciudadVacia() {
  const C = new Array(N * N);
  for (let k = 0; k < C.length; k++) C[k] = { t: 'road', deco: null };
  return { C, N, seed: 0 };
}
const pl0 = (px, py) => ({ px, py, heading: 0, corre: false, spd: 0, path: [], target: null, prevPx: px, prevPy: py });
const enCaptura = (sim, p, pl) => { p.estado = 'persecucion'; p.tRuta = 999; p.x = pl.px + 0.1; p.z = pl.py; pl.prevPx = pl.px; pl.prevPy = pl.py; };
const pasarTiempo = (sim, pl, seg) => { for (let t = 0; t < seg; t += 0.05) stepAgentes(sim, pl, 0.05); };
const cuentaEv = (sim, t) => sim.eventos.filter(e => e.t === t).length;

console.log('6. Captura sin coima: termina la partida (como F2)');
{
  const sim = crearSimulacion(ciudadVacia(), { esquinas: [{ x: 30.5, z: 30.5, yaw: 0 }], rand: () => 0.5 });
  const pl = pl0(30.5, 30.9);
  enCaptura(sim, sim.agentes[0], pl);
  stepAgentes(sim, pl, 0.05);
  check('sin callback de coima: hay captura', cuentaEv(sim, 'atrapado') === 1 && sim.G.capT > 0);
  pasarTiempo(sim, pl, POLI_PAUSA_CAPT + 0.1);
  check('tras la pausa, la partida termina (evento capturado)', cuentaEv(sim, 'capturado') === 1);
}
{
  let llamadas = 0;
  const sim = crearSimulacion(ciudadVacia(), { esquinas: [{ x: 30.5, z: 30.5, yaw: 0 }], rand: () => 0.5, coima: () => { llamadas++; return false; } });
  const pl = pl0(30.5, 30.9);
  enCaptura(sim, sim.agentes[0], pl);
  stepAgentes(sim, pl, 0.05);
  check('coima rechazada: se pregunta una vez y la captura sigue', llamadas === 1 && cuentaEv(sim, 'atrapado') === 1 && sim.G.capT > 0);
  check('coima rechazada: no entra en cooldown', sim.G.coimaCd === 0);
}

console.log('7. Coima aceptada: sin captura, el agente vuelve a su esquina, cooldown solo como estado');
{
  const esq = { x: 30.5, z: 30.5, yaw: 0 };
  let econ = economiaInicial(), rd = rdCon(10, 100000), llamadas = 0;
  const sim = crearSimulacion(ciudadVacia(), {
    esquinas: [esq], rand: () => 0.5,
    coima: () => { llamadas++; const r = elegirCoima(econ, rd, 'dinero'); econ = r.econ; rd = r.rd; return r.resultado === 'pagada'; },
  });
  const pl = pl0(30.5, 30.9);
  const p = sim.agentes[0];
  enCaptura(sim, p, pl);
  stepAgentes(sim, pl, 0.05);
  check('coima aceptada: no hay captura', cuentaEv(sim, 'atrapado') === 0 && sim.G.capT === 0);
  check('coima aceptada: se descuenta el 60 % de la mercadería de la ronda', rd.dinero === 100000 - Math.round(0.6 * 10 * PRECIOS[P]), 'dinero=' + rd.dinero);
  check('coima aceptada: el agente vuelve a patrullar (regreso)', p.estado === 'regreso', p.estado);
  check('coima aceptada: evento coima y cooldown', cuentaEv(sim, 'coima') === 1 && sim.G.coimaCd > 0 && sim.G.coimaCd <= COIMA_CD);
  // Durante COIMA_CIEGO s no lo ven: ni ventas, ni carreras, ni llamados suman estrellas.
  Object.assign(p, { x: esq.x, z: esq.z, yaw: 0, estado: 'patrulla', atento: true, ruta: null, pend: 0 });
  ventaVista(sim, pl);
  pl.corre = true; corridaVista(sim, pl); pl.corre = false;
  alertarAgentes(sim, pl.px, pl.py);
  stepAgentes(sim, pl, 0.05);
  check('ciego: 0 estrellas y no lo ve, pero acude al llamado', sim.busq.nivel === 0 && !p.ve && p.acude, sim.busq.nivel + ' ' + p.estado);
  pasarTiempo(sim, pl, COIMA_CIEGO - 0.5);
  ventaVista(sim, pl);
  check('ciego: sigue sin verlo cerca de los 10 s', sim.busq.nivel === 0);
  pasarTiempo(sim, pl, 1);
  Object.assign(p, { x: esq.x, z: esq.z, yaw: 0, estado: 'patrulla', ruta: null, pend: 0 });
  ventaVista(sim, pl);
  check('pasados los 10 s vuelve a verlo', sim.G.ciegoT === 0 && sim.busq.nivel === 1);
  // Sin cooldown: aunque coimaCd esté activo, la captura vuelve a ofrecer la coima.
  sim.eventos.length = 0; sim.G.coimaCd = 5; sim.G.ciegoT = 0;
  enCaptura(sim, p, pl);
  stepAgentes(sim, pl, 0.05);
  check('con coimaCd activo igual se ofrece (la coima no tiene cooldown)', llamadas === 2 && cuentaEv(sim, 'atrapado') === 0);
}

console.log('7b. Correr dentro del cono: persecución inmediata');
{
  const nuevo = atento => {
    const sim = crearSimulacion(ciudadVacia(), { esquinas: [{ x: 30.5, z: 30.5, yaw: 0 }, { x: 31.5, z: 30.5, yaw: 0 }], rand: () => 0.5, patrulla: 1 });
    for (const p of sim.agentes) { p.atento = atento; p.tVis = 0; }
    return sim;
  };
  const sim = nuevo(true), pl = pl0(30.5, 34.5);
  pl.corre = true; stepAgentes(sim, pl, 0.05);
  check('los dos agentes que lo ven correr persiguen, aunque haya 1 estrella', sim.busq.nivel === 1 && sim.agentes.every(p => p.estado === 'persecucion'), sim.agentes.map(p => p.estado).join());
  sim.t += 10; pl.corre = false; stepAgentes(sim, pl, 0.05); pl.corre = true; stepAgentes(sim, pl, 0.05);
  check('correr otra vez ante agentes ya alertados no suma estrellas', sim.busq.nivel === 1, String(sim.busq.nivel));
  const s5 = nuevo(true), pl5 = pl0(30.5, 34.5);
  for (const p of s5.agentes) Object.assign(p, { estado: 'alerta', aviso: false, tAlerta: 1 });
  s5.busq.nivel = 2; pl5.corre = true; stepAgentes(s5, pl5, 0.05);
  check('entrar corriendo en el cono de un agente ya en alerta no suma', s5.busq.nivel === 2, String(s5.busq.nivel));
  const s2 = nuevo(true), atras = pl0(30.5, 26.5);
  atras.corre = true; stepAgentes(s2, atras, 0.05);
  check('fuera del cono no persiguen', s2.busq.nivel === 0 && s2.agentes.every(p => p.estado !== 'persecucion'));
  const s3 = nuevo(true), camina = pl0(30.5, 34.5);
  stepAgentes(s3, camina, 0.05);
  check('caminando en el cono no persiguen', s3.agentes.every(p => p.estado !== 'persecucion'));
  const s4 = nuevo(true), ciego = pl0(30.5, 34.5);
  s4.G.ciegoT = 5; ciego.corre = true; stepAgentes(s4, ciego, 0.05);
  check('tras una coima (ciegos) no persiguen', s4.agentes.every(p => p.estado !== 'persecucion'));
}

console.log('7c. Ofrecer dentro del cono alerta, sin venta');
{
  const sim = crearSimulacion(ciudadVacia(), { esquinas: [{ x: 30.5, z: 30.5, yaw: 0 }, { x: 31.5, z: 30.5, yaw: 0 }], rand: () => 0.5, patrulla: 1 });
  for (const p of sim.agentes) p.atento = true;
  ofertaVista(sim, pl0(30.5, 26.5));
  check('ofrecer fuera del cono no alerta', sim.busq.nivel === 0);
  ofertaVista(sim, pl0(30.5, 34.5));
  check('ofrecer en el cono: 1 estrella y todos los que lo ven persiguen', sim.busq.nivel === 1 && sim.agentes.every(p => p.estado === 'persecucion'), String(sim.busq.nivel));
}

console.log('7d. Ver pasar a un perseguidor suma al agente');
{
  const armar = atento => {
    const sim = crearSimulacion(ciudadVacia(), { esquinas: [{ x: 30.5, z: 30.5, yaw: 0 }, { x: 30.5, z: 34.5, yaw: 0 }], rand: () => 0.5, patrulla: 1 });
    const [a, b] = sim.agentes; a.atento = atento; a.tVis = 0; Object.assign(b, { estado: 'persecucion', tRuta: 999 });
    sim.busq.nivel = 1; sim.ultima = { x: 50.5, z: 58.5, heading: 0 };
    stepAgentes(sim, pl0(50.5, 58.5), 0.01);
    return a;
  };
  check('agente libre que ve en su cono a un perseguidor: se suma', armar(true).estado === 'persecucion');
  check('agente distraído (sin cono): no se suma', armar(false).estado === 'patrulla');
}

console.log('8. Ciudad generada: la coima no rompe la simulación');
{
  const city = generarCiudad();
  const sim = crearSimulacion(city, { coima: () => false, patrulla: 1 });
  const pl = pl0(sim.agentes[0].x, sim.agentes[0].z);
  pasarTiempo(sim, pl, 5);
  check('sin errores con patrulla 1 y coima rechazada', sim.agentes.length > 0);
}

console.log('9. Diálogo de elección (opción B): tirada primero, diálogo solo si el agente acepta');
{
  const econ = economiaInicial();
  const rd = rdCon(10, 100000);
  const ops = opcionesCoima(rd, 0);
  check('tres opciones: producto, dinero, nada', ops.map(o => o.id).join() === 'producto,dinero,nada');
  check('producto muestra 5 unidades (la mitad de 10)', ops[0].disponible && ops[0].propuesta.unidades === 5);
  check('dinero muestra 60 % del valor', ops[1].disponible && ops[1].propuesta.monto === Math.round(0.6 * 10 * PRECIOS[P]));
  check('no pagar siempre disponible; ', ops[2].disponible && ops.length === 3);
  const sd = opcionesCoima(rdCon(10, 100), 0);
  check('sin dinero suficiente: dinero deshabilitado con motivo', !sd[1].disponible && !!sd[1].motivo && sd[0].disponible);
  const sp = opcionesCoima(rdCon(0, 100000), 0);
  check('sin mercadería: producto deshabilitado con motivo', !sp[0].disponible && !!sp[0].motivo);
  check('sin ninguna opción de pago: hayOpcionDePago false', !hayOpcionDePago(rdCon(0, 0)) && hayOpcionDePago(rd));
  const e1 = elegirCoima(econ, rd, 'producto');
  check('elegir mercadería: descuenta unidades', e1.resultado === 'pagada' && e1.rd.lotes[P] === 5);
  const e2 = elegirCoima(econ, rd, 'dinero');
  check('elegir dinero: descuenta monto', e2.resultado === 'pagada' && e2.rd.dinero === 100000 - e2.oferta.monto);
  const e3 = elegirCoima(econ, rd, 'nada');
  check('no pagar: no descuenta', e3.resultado === 'nada' && e3.rd === rd);
  check('opción no disponible: no paga', elegirCoima(econ, rdCon(0, 0), 'dinero').resultado === 'no_disponible');
  check('tirada: acepta con rand < prob y decae', tirarAceptacion(() => 0.5, 0) && !tirarAceptacion(() => 0.5, 1));

  // Integración con agentes.js: 'pendiente' congela y espera resolverCoima.
  const esq = { x: 30.5, z: 30.5, yaw: 0 };
  const armar = (esquinas, cb) => crearSimulacion(ciudadVacia(), { esquinas, rand: () => 0.5, coima: cb });
  // Rechazo de la tirada: main devuelve false, sin diálogo; la captura termina la partida.
  let dialogos = 0;
  const cbMain = (acepta) => () => { if (!tirarAceptacion(() => acepta ? 0 : 0.99, 0)) return false; dialogos++; return 'pendiente'; };
  let sim = armar([esq], cbMain(false)), pl = pl0(30.5, 30.9);
  enCaptura(sim, sim.agentes[0], pl);
  stepAgentes(sim, pl, 0.05);
  check('rechazo: sin diálogo y la captura termina la partida', dialogos === 0 && !sim.G.coimaPend && cuentaEv(sim, 'atrapado') === 1);
  pasarTiempo(sim, pl, POLI_PAUSA_CAPT + 0.1);
  check('rechazo: evento capturado', cuentaEv(sim, 'capturado') === 1);
  // Aceptación: diálogo, simulación congelada, luego "no pagar" termina la partida.
  sim = armar([esq], cbMain(true)); pl = pl0(30.5, 30.9);
  enCaptura(sim, sim.agentes[0], pl);
  stepAgentes(sim, pl, 0.05);
  check('aceptación: un diálogo y captura en espera', dialogos === 1 && !!sim.G.coimaPend && sim.G.capT === 0 && cuentaEv(sim, 'atrapado') === 0);
  const t0 = sim.t; pasarTiempo(sim, pl, 2);
  check('mientras el diálogo está abierto la simulación no avanza', sim.t === t0 && cuentaEv(sim, 'capturado') === 0);
  resolverCoima(sim, false, pl);
  check('no pagar: arranca la captura', cuentaEv(sim, 'atrapado') === 1 && sim.G.capT > 0 && !sim.G.coimaPend);
  pasarTiempo(sim, pl, POLI_PAUSA_CAPT + 0.1);
  check('no pagar: la partida termina', cuentaEv(sim, 'capturado') === 1);
  // Pagar: limpia búsqueda, ceguera y cooldown.
  sim = armar([esq], cbMain(true)); pl = pl0(30.5, 30.9);
  enCaptura(sim, sim.agentes[0], pl); sim.busq.nivel = 2;
  stepAgentes(sim, pl, 0.05);
  resolverCoima(sim, true, pl);
  check('pagar: sin captura, búsqueda limpia, ceguera y cooldown', sim.busq.nivel === 0 && sim.G.ciegoT === COIMA_CIEGO && sim.G.coimaCd === COIMA_CD && cuentaEv(sim, 'coima') === 1 && sim.G.capT === 0 && sim.agentes[0].estado === 'regreso');
  // Dos capturas simultáneas: un solo diálogo.
  dialogos = 0;
  sim = armar([esq, { x: 31.5, z: 30.5, yaw: 0 }], cbMain(true)); pl = pl0(31, 30.9);
  for (const p of sim.agentes) { p.estado = 'persecucion'; p.tRuta = 999; p.x = pl.px + (p.idx ? 0.1 : -0.1); p.z = pl.py; }
  pl.prevPx = pl.px; pl.prevPy = pl.py;
  stepAgentes(sim, pl, 0.05);
  check('dos capturas simultáneas: un solo diálogo', dialogos === 1 && !!sim.G.coimaPend, 'dialogos=' + dialogos);
  stepAgentes(sim, pl, 0.05);
  check('sigue un solo diálogo en el cuadro siguiente', dialogos === 1);
  check('resolver sin decisión pendiente no hace nada', (resolverCoima(sim, false, pl), !resolverCoima(sim, false, pl)));
}

console.log('10. Fin de partida sin coima posible y sin fondos para reponer');
{
  const esq = { x: 30.5, z: 30.5, yaw: 0 };
  const rdVacio = rdCon(0, 0);
  check('sin dinero ni mercadería no hay coima posible', !hayOpcionDePago(rdVacio));
  // Callback como el de main.js: sin opción de pago devuelve false (sin tirada ni diálogo).
  const sim = crearSimulacion(ciudadVacia(), { esquinas: [esq], rand: () => 0.5, coima: () => (hayOpcionDePago(rdVacio) ? 'pendiente' : false) });
  const pl = pl0(30.5, 30.9);
  enCaptura(sim, sim.agentes[0], pl);
  stepAgentes(sim, pl, 0.05);
  check('captura sin coima posible: sin diálogo, arranca la captura', !sim.G.coimaPend && cuentaEv(sim, 'atrapado') === 1);
  pasarTiempo(sim, pl, POLI_PAUSA_CAPT + 0.1);
  check('captura sin coima posible: evento capturado (main llama finPartida)', cuentaEv(sim, 'capturado') === 1);
  // Sin fondos: la caja no alcanza para el gasto fijo y una unidad.
  const e0 = economiaInicial();
  const pobre = { ...e0, caja: costoMin(e0) - 1 };
  check('caja menor al costo mínimo: sinFondos', sinFondos(pobre) === true || sinFondos({ ...pobre, caja: 0 }) === true);
  const cr = cerrarRonda({ ...e0, caja: 0 }, rdCon(0, 0));
  check('cerrar la ronda sin fondos devuelve sin_fondos', cr.estado === 'sin_fondos', cr.estado);
  check('el motivo sin_fondos tiene el título "Sin fondos para reponer"', MOTIVOS_FIN.sin_fondos[0] === 'Sin fondos para reponer');
  check('se puede compartir un fin sin fondos con 0 puntos', typeof textoCompartir({ motivo: 'sin_fondos', puntos: 0, medalla: null, producto: null }) === 'string');
  // Ambos caminos pasan por finPartida() de main.js y la pantalla de fin siempre muestra compartir.
  const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
  check("main.js: 'capturado' y las dos salidas 'sin_fondos' llaman finPartida", /finPartida\('capturado'\)/.test(main) && (main.match(/finPartida\('sin_fondos'\)/g) ?? []).length === 2);
  check('main.js: compartir visible en todo fin', /btnFinShare'\)\.hidden = false/.test(main) && /shareRedes'\)\.hidden = false/.test(main));
}

console.log('11. Cono verde durante la ceguera por coima');
{
  const sim = crearSimulacion(ciudadVacia(), { esquinas: [{ x: 30.5, z: 30.5, yaw: 0 }], rand: () => 0.5 });
  const normal = '#ffcc00';
  check('sin ceguera el cono conserva el color del estado', colorCono(normal, sim.G.ciegoT) === normal);
  sim.G.ciegoT = COIMA_CIEGO;
  check('con ceguera activa el cono es verde', colorCono(normal, sim.G.ciegoT) === COL_CONO_CIEGO && /^#4cd964$/.test(COL_CONO_CIEGO));
  const pl = pl0(30.5, 40.5);
  pasarTiempo(sim, pl, COIMA_CIEGO + 0.5);
  check('al terminar la ceguera vuelve al color normal', sim.G.ciegoT === 0 && colorCono(normal, sim.G.ciegoT) === normal);
}

console.log('');
console.log(fallos === 0 ? `TODAS LAS PRUEBAS OK (${pasos})` : `FALLARON ${fallos} de ${pasos}`);
process.exit(fallos === 0 ? 0 : 1);
