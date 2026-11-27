// Pruebas headless de peatones.js y jornada.js (sin navegador). Uso: node 2d/tools/test_peatones.mjs
// Memoria por ronda (transiciones de N, I, C, M, P, A), DEMANDA y momento en la compra, contagio por insulto en radio,
// reinicio por ronda y reciclado, y cambio de momento del día según el tiempo de la ronda.
import { generarCiudad } from '../js/ciudad.js';
import {
  crearPeaton, memNueva, reiniciarMemoria, esElegible, probsReaccion, elegirReaccion, reaccionPara,
  aplicarReaccion, contagiarInsulto, ajustarPeatones, stepPeatones, multDemanda,
} from '../js/peatones.js';
import { JORNADA, MOMENTO_INICIAL, TRAMO, momentoEn, cantidadPeatones, jornadaPorId, mezclarColor, acercarLuz } from '../js/jornada.js';
import { PEATONES_N, DURACION_RONDA, MEM_T_OLVIDO, MEM_K_MAX, PEAT_CONTAGIO_BONO, PEAT_CONTAGIO_T, PEAT_LEJOS } from '../js/config.js';
import { DEMANDA } from '../js/productos.js';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}
const cerca = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
const prob = (pr, id) => (pr.find(e => e[0] === id) ?? [id, 0])[1];

// Generador determinista (LCG) para sortear sin azar real.
function rngSemilla(s) {
  let x = s >>> 0;
  return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; };
}

// Peatón de prueba con memoria nueva en (x, z).
const peat = (x = 10.5, z = 10.5) => ({ x, z, ruta: null, k: 0, pausa: 0, color: '#fff', tRuta: 1, mem: memNueva() });

const city = generarCiudad();
const jugador = { x: 60, z: 60 };

console.log('Transiciones de memoria');
{
  const p = peat();
  check('peatón nuevo arranca en N con k=0', p.mem.est === 'N' && p.mem.k === 0);
  check('N elegible', esElegible(p));

  aplicarReaccion(p, 'ignorar', 0);
  check('N tras ignorar pasa a I con k=1', p.mem.est === 'I' && p.mem.k === 1);
  aplicarReaccion(p, 'cortes', 1);
  check('I tras cortés suma k (k=2)', p.mem.est === 'I' && p.mem.k === 2);

  aplicarReaccion(p, 'comprar1', 2, 1);
  check('I tras compra pasa a C y reinicia kc', p.mem.est === 'C' && p.mem.kc === 0 && p.mem.compras === 1);
  aplicarReaccion(p, 'ignorar', 3); aplicarReaccion(p, 'ignorar', 4);
  check('C con 2 ofrecimientos sin compra sigue en C (kc=2)', p.mem.est === 'C' && p.mem.kc === 2);
  aplicarReaccion(p, 'ignorar', 5);
  check('C con 3 ofrecimientos sin compra pasa a P (no insistir)', p.mem.est === 'P');
  check('P no es elegible', !esElegible(p));

  const q = peat();
  aplicarReaccion(q, 'insultar', 0);
  check('insulto pasa a M', q.mem.est === 'M');
  aplicarReaccion(q, 'ignorar', 1); aplicarReaccion(q, 'ignorar', 2);
  check('M con 2 ofrecimientos sin insulto sigue en M', q.mem.est === 'M' && q.mem.km === 2);
  aplicarReaccion(q, 'ignorar', 3);
  check('M con 3 ofrecimientos sin insulto pasa a P', q.mem.est === 'P');

  const r = peat();
  aplicarReaccion(r, 'llamado', 0);
  check('llamado pasa a A y A no es elegible', r.mem.est === 'A' && !esElegible(r));

  const s = peat();
  aplicarReaccion(s, 'comprar2', 0, 2);
  check('comprar2 con 2 unidades: compras=2 llega al tope y pasa a P', s.mem.est === 'P' && s.mem.compras === 2);

  const t = peat();
  aplicarReaccion(t, 'comprar1', 0, 1);
  check('una compra de 1 unidad deja a C elegible', t.mem.est === 'C' && esElegible(t));
  aplicarReaccion(t, 'comprar1', 1, 1);
  check('segunda compra de 1 unidad (compras=2) pasa a P', t.mem.est === 'P');

  const u = peat();
  for (let i = 0; i < MEM_K_MAX; i++) aplicarReaccion(u, 'ignorar', i);
  check('I sin compra llega a MEM_K_MAX y pasa a P', u.mem.est === 'P', 'est=' + u.mem.est + ' k=' + u.mem.k);

  // Decaimiento M -> I tras MEM_T_OLVIDO s sin contacto (se aplica al elegir reacción).
  const v = peat();
  aplicarReaccion(v, 'insultar', 100);
  const pr1 = probsReaccion(v, { producto: 'medias', tiempo: 100 + MEM_T_OLVIDO - 1 });
  check('M antes de 45 s sigue en M (insultar alto)', prob(pr1, 'insultar') > 0.5);
  reaccionPara(v, { producto: 'medias', tiempo: 100 + MEM_T_OLVIDO, rnd: () => 0.999 });
  check('M tras 45 s sin contacto vuelve a I', v.mem.est === 'I' && v.mem.k >= 1, 'est=' + v.mem.est);
}

console.log('Probabilidades de reacción');
{
  for (const est of ['N', 'I', 'C', 'M']) {
    const p = peat();
    if (est === 'I') { aplicarReaccion(p, 'ignorar', 0); aplicarReaccion(p, 'ignorar', 1); }
    if (est === 'C') aplicarReaccion(p, 'comprar1', 0, 1);
    if (est === 'M') aplicarReaccion(p, 'insultar', 0);
    const pr = probsReaccion(p, { producto: 'empanadas', dem: 1, tiempo: 1 });
    const tot = pr.reduce((s, e) => s + e[1], 0);
    check(`las probabilidades de ${est} suman 1`, cerca(tot, 1, 1e-9), 'suma=' + tot);
    check(`ninguna probabilidad de ${est} es negativa`, pr.every(e => e[1] >= 0));
  }
  const sinStock = peat();
  check('sin producto la reacción es ignorar', reaccionPara(sinStock, { producto: null, tiempo: 0 }) === 'ignorar');
  check('sin producto la memoria no cambia', sinStock.mem.est === 'N' && sinStock.mem.k === 0);
  check('sin producto la distribución es solo ignorar', probsReaccion(sinStock, { producto: null })[0][0] === 'ignorar');
}

console.log('DEMANDA y momento del día en la compra');
{
  check('multDemanda usa DEMANDA del producto', cerca(multDemanda('empanadas', 1), DEMANDA.empanadas));
  check('multDemanda multiplica por el momento', cerca(multDemanda('paltas', 0.7), DEMANDA.paltas * 0.7));

  // Estado N con medias (DEMANDA 1): total 100 => comprar1 = 20/100.
  const p = peat();
  const medias = probsReaccion(p, { producto: 'medias', dem: 1 });
  check('N con medias: comprar1 = 0.20 (DEMANDA 1)', cerca(prob(medias, 'comprar1'), 0.2), String(prob(medias, 'comprar1')));
  // Empanadas (1.2): 24 / (24 + 9.6 + 72) = 24 / 105.6.
  const emp = probsReaccion(p, { producto: 'empanadas', dem: 1 });
  check('N con empanadas: comprar1 = 24/105.6', cerca(prob(emp, 'comprar1'), 24 / 105.6, 1e-9), String(prob(emp, 'comprar1')));
  const palt = probsReaccion(p, { producto: 'paltas', dem: 1 });
  check('paltas (DEMANDA 0.8) compran menos que empanadas (1.2)', prob(palt, 'comprar1') < prob(emp, 'comprar1'));
  // Momento mañana (0.7) baja la compra respecto de mediodía (1.3).
  const man = probsReaccion(p, { producto: 'empanadas', dem: jornadaPorId('manana').dem });
  const med = probsReaccion(p, { producto: 'empanadas', dem: jornadaPorId('mediodia').dem });
  check('mañana compra menos que mediodía con el mismo producto', prob(man, 'comprar1') < prob(med, 'comprar1'));

  // Estado I: comprar1 escala con DEMANDA (medias 1 vs empanadas 1.2) con la misma memoria.
  const i1 = peat(), i2 = peat();
  for (const q of [i1, i2]) { aplicarReaccion(q, 'ignorar', 0); }
  const cMed = prob(probsReaccion(i1, { producto: 'medias' }), 'comprar1');
  const cEmp = prob(probsReaccion(i2, { producto: 'empanadas' }), 'comprar1');
  check('estado I: la compra escala con DEMANDA (empanadas > medias)', cEmp > cMed, `${cEmp} vs ${cMed}`);

  // Muestreo: la frecuencia de comprar1 con empanadas se acerca a 24/105.6.
  const rnd = rngSemilla(12345);
  let c1 = 0; const M = 20000;
  for (let k = 0; k < M; k++) if (elegirReaccion(emp, rnd) === 'comprar1') c1++;
  const frec = c1 / M;
  check('muestreo: frecuencia de comprar1 con empanadas ~ 0.2273 (±0.01)', Math.abs(frec - 24 / 105.6) < 0.01, 'frec=' + frec.toFixed(4));
}

console.log('Contagio por insulto en radio');
{
  const objetivo = peat(20, 20);
  const cerc = peat(22, 20);      // 2 celdas: dentro de 3
  const borde = peat(23, 20);     // 3 celdas: dentro (<= 3)
  const lejos = peat(25, 20);     // 5 celdas: fuera
  const peds = [objetivo, cerc, borde, lejos];
  const n = contagiarInsulto(peds, objetivo, 50);
  check('contagio afecta a los vecinos dentro de 3 celdas', n === 2 && cerc.mem.contagio === 50 && borde.mem.contagio === 50, 'n=' + n);
  check('contagio no afecta a los peatones fuera del radio', lejos.mem.contagio === -Infinity);
  check('contagio no afecta al peatón insultado', objetivo.mem.contagio === -Infinity);

  // Con contagio activo, insultar sube en PEAT_CONTAGIO_BONO y el ignorar baja lo mismo (N, mismo producto).
  const base = peat(), conC = peat();
  conC.mem.contagio = 50;
  const pBase = probsReaccion(base, { producto: 'medias', tiempo: 51 });
  const pCont = probsReaccion(conC, { producto: 'medias', tiempo: 51 });
  check('el contagio sube insultar en el bono', cerca(prob(pCont, 'insultar') - prob(pBase, 'insultar'), PEAT_CONTAGIO_BONO, 1e-9),
    String(prob(pCont, 'insultar') - prob(pBase, 'insultar')));
  check('el contagio baja ignorar en el mismo bono', cerca(prob(pBase, 'ignorar') - prob(pCont, 'ignorar'), PEAT_CONTAGIO_BONO, 1e-9));

  // Fuera de PEAT_CONTAGIO_T s el bono deja de aplicar.
  const tarde = probsReaccion(conC, { producto: 'medias', tiempo: 50 + PEAT_CONTAGIO_T });
  check('tras PEAT_CONTAGIO_T s el contagio deja de aplicar', cerca(prob(tarde, 'insultar'), prob(pBase, 'insultar'), 1e-9));

  // Un peatón en M no recibe el bono (el insulto ya está).
  const enM = peat(); aplicarReaccion(enM, 'insultar', 0); enM.mem.contagio = 50;
  const pM = probsReaccion(enM, { producto: 'medias', tiempo: 51 });
  check('en M el contagio no se aplica (insultar sigue en 0.6)', cerca(prob(pM, 'insultar'), 0.6, 1e-9), String(prob(pM, 'insultar')));
}

console.log('Reinicio por ronda y reciclado');
{
  const peds = [];
  for (let k = 0; k < 6; k++) peds.push(crearPeaton(city, { rnd: rngSemilla(k + 1) }));
  for (const p of peds) { aplicarReaccion(p, 'insultar', 10); aplicarReaccion(p, 'ignorar', 11); }
  check('antes del reinicio hay peatones en M e I', peds.every(p => p.mem.est !== 'N'));
  reiniciarMemoria(peds);
  check('reiniciarMemoria deja a todos en N con k=0', peds.every(p => p.mem.est === 'N' && p.mem.k === 0 && p.mem.km === 0));
  check('el reinicio borra contagio y tUlt', peds.every(p => p.mem.contagio === -Infinity && p.mem.tUlt === -Infinity));

  // Reciclado: un peatón lejos del jugador se reemplaza y la memoria nueva es N.
  const lejano = peat(jugador.x + PEAT_LEJOS + 10, jugador.z);
  lejano.mem.est = 'P';
  const grupo = [lejano, peat(jugador.x + 2, jugador.z)];
  grupo[1].mem.est = 'M';
  const rec = ajustarPeatones(grupo, city, 2, jugador, rngSemilla(7));
  check('peatón lejos se recicla (cuenta 1)', rec === 1, 'rec=' + rec);
  check('el reciclado descarta la memoria anterior (ya no es P)', grupo[0] !== lejano && grupo[0].mem.est === 'N');
  check('el peatón cercano conserva su memoria (M)', grupo[1].mem.est === 'M');
}

console.log('Cantidad de peatones y momento del día');
{
  check('mañana tiene 60 % de PEATONES_N', cantidadPeatones(jornadaPorId('manana')) === Math.round(PEATONES_N * 0.6));
  check('mediodía tiene 100 % de PEATONES_N', cantidadPeatones(jornadaPorId('mediodia')) === PEATONES_N);
  check('tarde tiene 80 % de PEATONES_N', cantidadPeatones(jornadaPorId('tarde')) === Math.round(PEATONES_N * 0.8));
  check('noche no está en el ciclo (JORNADA sin noche)', !JORNADA.some(j => j.id === 'noche'));
  check('la ronda arranca en mañana', MOMENTO_INICIAL === 'manana' && momentoEn(0).id === 'manana');
  check('TRAMO es la duración de la ronda dividida en 3', cerca(TRAMO, DURACION_RONDA / 3));
  check('cambio a mediodía a los TRAMO s', momentoEn(TRAMO - 0.01).id === 'manana' && momentoEn(TRAMO).id === 'mediodia');
  check('cambio a tarde a los 2 TRAMO s', momentoEn(2 * TRAMO - 0.01).id === 'mediodia' && momentoEn(2 * TRAMO).id === 'tarde');
  check('tras la ronda queda en tarde', momentoEn(DURACION_RONDA + 500).id === 'tarde');

  // Simulación del bucle de main: avanzar tRonda y contar cambios de momento y de peatones.
  const peds = [];
  for (let k = 0; k < cantidadPeatones(jornadaPorId(MOMENTO_INICIAL)); k++) peds.push(crearPeaton(city, { rnd: rngSemilla(k + 3) }));
  let actual = MOMENTO_INICIAL, cambios = [], tRonda = 0;
  const dt = 0.05;
  for (let s = 0; s < 3000 && tRonda < DURACION_RONDA + 10; s++) {
    tRonda += dt;
    const m = momentoEn(tRonda);
    if (m.id !== actual) {
      actual = m.id;
      cambios.push([m.id, Math.round(tRonda * 100) / 100]);
      ajustarPeatones(peds, city, cantidadPeatones(m), jugador, rngSemilla(s + 1));
    }
  }
  check('el ciclo de la ronda pasa por mediodía y tarde, en ese orden', cambios.map(c => c[0]).join(',') === 'mediodia,tarde', JSON.stringify(cambios));
  check('el cambio a mediodía ocurre cerca de TRAMO', cambios[0] && Math.abs(cambios[0][1] - TRAMO) < 0.1, JSON.stringify(cambios));
  check('tras el cambio a tarde hay cantidadPeatones(tarde) peatones', peds.length === cantidadPeatones(jornadaPorId('tarde')), 'n=' + peds.length);

  // Luz: la transición se acerca al objetivo sin saltar.
  const ini = { cielo: '#000000', niebla: '#000000' }, obj = { cielo: '#ffffff', niebla: '#ffffff' };
  check('mezclarColor a mitad de camino', mezclarColor('#000000', '#ffffff', 0.5) === '#808080', mezclarColor('#000000', '#ffffff', 0.5));
  const paso1 = acercarLuz(ini, obj, 0.05);
  check('la luz avanza poco en un cuadro (sin salto)', paso1.cielo !== '#000000' && paso1.cielo !== '#ffffff');
  let L = ini;
  for (let k = 0; k < 200; k++) L = acercarLuz(L, obj, 0.05);
  check('la luz llega al objetivo tras unos segundos', L.cielo === '#ffffff' && L.niebla === '#ffffff', L.cielo);
}

console.log('Movimiento');
{
  const p = peat(10.5, 10.5);
  stepPeatones([p], city, 0.5, rngSemilla(9));
  check('stepPeatones no saca al peatón de la celda inicial en un paso corto sin ruta', Number.isFinite(p.x) && Number.isFinite(p.z));
  const pausado = peat(10.5, 10.5); pausado.pausa = 1;
  stepPeatones([pausado], city, 0.5, rngSemilla(9));
  check('un peatón en pausa no se mueve y la pausa baja', pausado.x === 10.5 && cerca(pausado.pausa, 0.5));
}

console.log('');
if (fallos) {
  console.log(`FALLARON ${fallos} de ${pasos} pruebas`);
  process.exitCode = 1;
} else {
  console.log(`TODAS LAS PRUEBAS OK (${pasos})`);
}
