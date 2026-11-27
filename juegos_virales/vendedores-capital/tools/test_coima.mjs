// Pruebas headless de coima.js y de la integración con agentes.js (sin navegador). Uso: node 2d/tools/test_coima.mjs
// Modo dinero limitado a la caja de la ronda, modo producto con redondeo, cooldown, aceptación determinista con un generador
// inyectado, captura sin coima (termina la partida), coima rechazada, coima aceptada (el agente vuelve a su esquina) y cooldown.
import { N, generarCiudad } from '../js/ciudad.js';
import {
  crearSimulacion, stepAgentes, POLI_PAUSA_CAPT,
} from '../js/agentes.js';
import {
  propuestaCoima, pagarCoima, ofrecerCoima, valorMercaderia, cooldownInicial, bajarCooldown, puedeOfrecer,
  COIMA_FRAC, COIMA_ACEPTA, COIMA_CD, COIMA_MIN, probAceptar,
} from '../js/coima.js';
import { PRECIOS, PRODUCTO_INICIAL } from '../js/productos.js';
import { economiaInicial } from '../js/economia.js';
import { COIMA_MODO } from '../js/config.js';

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
  // El jugador sigue ahí, pegado al agente, pero en cooldown: captura directa, sin ofrecer otra coima.
  enCaptura(sim, p, pl);
  stepAgentes(sim, pl, 0.05);
  check('en cooldown: captura directa sin nueva oferta', llamadas === 1 && cuentaEv(sim, 'atrapado') === 1);
  // Pasado el cooldown, vuelve a ofrecer.
  sim.eventos.length = 0; sim.G.capT = 0; sim.G.capAg = null; sim.G.coimaCd = 0;
  enCaptura(sim, p, pl);
  stepAgentes(sim, pl, 0.05);
  check('sin cooldown: vuelve a ofrecer', llamadas === 2);
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
