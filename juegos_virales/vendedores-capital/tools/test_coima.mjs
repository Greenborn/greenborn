// Pruebas headless de coima.js y de la integración con agentes.js (sin navegador). Uso: node 2d/tools/test_coima.mjs
// Modo dinero limitado a la caja de la ronda, modo producto con redondeo, cooldown, aceptación determinista con un generador
// inyectado, captura sin coima (termina la partida), coima rechazada, coima aceptada (el agente vuelve a su esquina) y cooldown.
import { N, generarCiudad } from '../js/ciudad.js';
import {
  crearSimulacion, stepAgentes, ventaVista, corridaVista, alertarAgentes, POLI_PAUSA_CAPT,
} from '../js/agentes.js';
import {
  propuestaCoima, pagarCoima, ofrecerCoima, valorMercaderia, cooldownInicial, bajarCooldown, puedeOfrecer,
  COIMA_FRAC, COIMA_ACEPTA, COIMA_CD, COIMA_MIN, probAceptar,
} from '../js/coima.js';
import { PRECIOS, PRODUCTO_INICIAL } from '../js/productos.js';
import { economiaInicial } from '../js/economia.js';
import { COIMA_MODO, COIMA_CIEGO } from '../js/config.js';

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
  check('modo por defecto: dinero', COIMA_MODO === 'dinero', COIMA_MODO);
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

console.log('3. Modo producto: 60 % de las unidades, redondeo hacia arriba, siempre queda 1');
{
  const casos = [[0, null], [1, null], [2, 1], [3, 2], [5, 3], [10, 6], [11, 7]];
  for (const [up, esperado] of casos) {
    const r = propuestaCoima(rdCon(up), 'producto');
    const got = r ? r.unidades : null;
    check(`stock ${up} -> entrega ${esperado ?? 'nada'}`, got === esperado, 'obtenido=' + got);
    if (r) {
      const pago = pagarCoima(economiaInicial(), rdCon(up), r);
      check(`stock ${up}: queda al menos 1 unidad`, pago.rd.lotes[P] >= 1, 'queda=' + pago.rd.lotes[P]);
    }
  }
  check('modo producto no usa el dinero', propuestaCoima(rdCon(4, 0), 'producto')?.unidades === 3);
}

console.log('4. Aceptación determinista con generador inyectado');
{
  const econ = economiaInicial();
  const rd = rdCon(10, 2000);
  const ac = ofrecerCoima(econ, rd, () => 0.54, 'dinero');
  check('rand < COIMA_ACEPTA: acepta', ac.aceptada === true);
  check('aceptada: se descuenta del dinero de la ronda', ac.rd.dinero === 2000 - ac.oferta.monto);
  const re = ofrecerCoima(econ, rd, () => 0.55, 'dinero');
  check('rand = COIMA_ACEPTA: rechaza', re.aceptada === false && re.oferta !== null);
  check('rechazada: la ronda queda igual', re.rd === rd && re.econ === econ);
  check('rand 0 acepta y 0.999 rechaza', ofrecerCoima(econ, rd, () => 0).aceptada && !ofrecerCoima(econ, rd, () => 0.999).aceptada);
  const sinNada = ofrecerCoima(econ, rdCon(0, 0), () => 0);
  check('sin dinero ni producto: no hay oferta (la captura sigue)', sinNada.oferta === null && sinNada.aceptada === false);
  const modoProd = ofrecerCoima(econ, rdCon(4, 0), () => 0, 'producto');
  check('modo producto aceptado: descuenta unidades', modoProd.aceptada && modoProd.rd.lotes[P] === 1);
}

console.log('4b. Mínimo y decaimiento');
{
  check('menos de $500 vendidos en la ronda: no hay coima', propuestaCoima(rdCon(10, COIMA_MIN - 1), 'dinero') === null && propuestaCoima(rdCon(10, COIMA_MIN), 'dinero')?.monto === 500);
  check('la aceptación decae x0.6 por coima aceptada', probAceptar(0) === 0.55 && Math.abs(probAceptar(1) - 0.33) < 1e-9);
  check('con 1 aceptada, rand 0.4 ya rechaza', !ofrecerCoima(economiaInicial(), rdCon(10, 2000), () => 0.4, 'dinero', 1).aceptada);
}

console.log('5. Cooldown');
{
  check('cooldown inicial = COIMA_CD', cooldownInicial() === 8);
  check('con cooldown activo no se ofrece', puedeOfrecer(0.1) === false);
  check('sin cooldown se ofrece', puedeOfrecer(0) === true);
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

console.log('7. Coima aceptada: sin captura, el agente vuelve a su esquina, cooldown y sin nueva oferta');
{
  const esq = { x: 30.5, z: 30.5, yaw: 0 };
  let econ = economiaInicial(), rd = rdCon(10, 100000), llamadas = 0;
  const sim = crearSimulacion(ciudadVacia(), {
    esquinas: [esq], rand: () => 0.5,
    coima: () => { llamadas++; const r = ofrecerCoima(econ, rd, () => 0); econ = r.econ; rd = r.rd; return r.aceptada; },
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
  check('ciego: 0 estrellas, no lo ve y no atiende llamados', sim.busq.nivel === 0 && !p.ve && p.estado === 'patrulla', sim.busq.nivel + ' ' + p.estado);
  pasarTiempo(sim, pl, COIMA_CIEGO - 0.5);
  ventaVista(sim, pl);
  check('ciego: sigue sin verlo cerca de los 10 s', sim.busq.nivel === 0);
  pasarTiempo(sim, pl, 1);
  Object.assign(p, { x: esq.x, z: esq.z, yaw: 0, estado: 'patrulla', ruta: null, pend: 0 });
  ventaVista(sim, pl);
  check('pasados los 10 s vuelve a verlo', sim.G.ciegoT === 0 && sim.busq.nivel === 1);
  // Cooldown (forzado, sin ceguera): captura directa, sin ofrecer otra coima.
  sim.eventos.length = 0; sim.G.coimaCd = 1;
  enCaptura(sim, p, pl);
  stepAgentes(sim, pl, 0.05);
  check('en cooldown: captura directa sin nueva oferta', llamadas === 1 && cuentaEv(sim, 'atrapado') === 1);
  // Pasado el cooldown, vuelve a ofrecer.
  sim.eventos.length = 0; sim.G.capT = 0; sim.G.capAg = null; sim.G.coimaCd = 0;
  enCaptura(sim, p, pl);
  stepAgentes(sim, pl, 0.05);
  check('sin cooldown: vuelve a ofrecer', llamadas === 2);
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

console.log('8. Ciudad generada: la coima no rompe la simulación');
{
  const city = generarCiudad();
  const sim = crearSimulacion(city, { coima: () => false, patrulla: 1 });
  const pl = pl0(sim.agentes[0].x, sim.agentes[0].z);
  pasarTiempo(sim, pl, 5);
  check('sin errores con patrulla 1 y coima rechazada', sim.agentes.length > 0);
}

console.log('');
console.log(fallos === 0 ? `TODAS LAS PRUEBAS OK (${pasos})` : `FALLARON ${fallos} de ${pasos}`);
process.exit(fallos === 0 ? 0 : 1);
