// Pruebas de integración sin DOM: estrellas, perseguidores y vehículos dentro de agentes.js, agentes en cada esquina con
// activación por cercanía, última posición vista, patrullas por calles en el mapa real y costo de un paso con 5 estrellas.
// Uso: node 2d/tools/test_integracion.mjs
import { readFile } from 'node:fs/promises';
import { N, generarCiudad } from '../js/ciudad.js';
import { cargarCiudadReal, esquinasReales, celdaCaminableMasCerca, obstaculoEn } from '../js/ciudad_real.js';
import {
  crearSimulacion, stepAgentes, ventaVista, alertarAgentes, resetAgentes, sentirVenta, POLI_VEL_ALERTA, activarAgentes, comprometido,
  fraccionAtentos, radioVista, velPersecucion, manzanasConVereda,
} from '../js/agentes.js';
import { respuesta, BUSQ_CD, BUSQ_MAX_ACTIVOS, BUSQ_R_ACTIVA } from '../js/busqueda.js';
import { HELI_T_ESCENA } from '../js/vehiculos.js';
import { stepEnergia } from '../js/energia.js';
import { RUTA_NODOS_FRAME } from '../js/config.js';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}
let semilla = 99;
const rnd = () => (semilla = (semilla * 1664525 + 1013904223) >>> 0) / 4294967296;
const vacia = () => ({ C: Array.from({ length: N * N }, () => ({ t: 'road', deco: null })), N, seed: 0 });
const jug = (px, py, extra = {}) => ({ px, py, prevPx: px, prevPy: py, heading: 0, corre: false, spd: 0, ...extra });
const paso = (sim, pl, seg, dt = 0.05) => { for (let t = 0; t < seg - 1e-9; t += dt) stepAgentes(sim, pl, dt); };
const nComp = sim => sim.agentes.filter(comprometido).length;
const nEv = (sim, t) => sim.eventos.filter(e => e.t === t).length;
// 12 agentes en fila mirando hacia +z; el jugador arranca delante del primero.
const fila = () => Array.from({ length: 12 }, (_, k) => ({ x: 20.5 + k * 7, z: 40.5, yaw: 0 }));

console.log('1. Estrellas por venta y cantidad exacta de perseguidores y vehículos');
{
  const sim = crearSimulacion(vacia(), { esquinas: fila(), rand: rnd }), pl = jug(20.5, 45.5);
  check('sin vista no hay estrellas', (ventaVista(sim, jug(20.5, 20.5)), sim.busq.nivel === 0));
  for (let n = 1; n <= 5; n++) {
    ventaVista(sim, pl);
    check(`venta vista: ${n} estrella(s)`, sim.busq.nivel === n, String(sim.busq.nivel));
    ventaVista(sim, pl);
    check(`  cooldown: la misma venta no suma otra`, sim.busq.nivel === n);
    stepAgentes(sim, pl, 1e-4);
    const q = respuesta(n);
    check(`  ${q.agentes} a pie, ${q.patrullas} patrulla(s), heli ${q.heli}`, nComp(sim) === q.agentes && sim.patrullas.length === q.patrullas && !!sim.heli === q.heli,
      `${nComp(sim)} / ${sim.patrullas.length} / ${!!sim.heli}`);
    sim.t += BUSQ_CD; sim.G.capT = 0;
  }
  let max = 0, min = 99;
  for (let k = 0; k < 20; k++) { pl.px = 20.5 + k; pl.prevPx = pl.px; stepAgentes(sim, pl, 0.02); if (sim.G.capT > 0) break; max = Math.max(max, nComp(sim)); min = Math.min(min, nComp(sim)); }
  check('durante la persecución hay al menos 4 a pie y nunca más de 12 (se suman los que los ven)', min >= 4 && max <= 12, min + '..' + max);
  alertarAgentes(sim, pl.px, pl.py);
  check('un llamado con estrellas activas no suma perseguidores y envía un solo agente', nComp(sim) === 4 && sim.agentes.filter(a => a.aviso).length === 1);
}

console.log('2. Correr a la vista');
{
  const sim = crearSimulacion(vacia(), { esquinas: fila(), rand: rnd }), pl = jug(20.5, 45.5, { corre: true });
  stepAgentes(sim, pl, 0.05);
  check('empezar a correr a la vista suma 1', sim.busq.nivel === 1 && nEv(sim, 'estrella') === 1);
  paso(sim, pl, 0.5);
  check('seguir corriendo no suma', sim.busq.nivel === 1);
  pl.corre = false; stepAgentes(sim, pl, 0.01); sim.t += BUSQ_CD; pl.corre = true; stepAgentes(sim, pl, 0.01);
  check('volver a arrancar ante agentes ya alertados no suma', sim.busq.nivel === 1, String(sim.busq.nivel));
  pl.corre = false; stepAgentes(sim, pl, 0.01); sim.t += BUSQ_CD;
  for (const a of sim.agentes) Object.assign(a, { estado: 'patrulla', ...a.esquinaBase, ruta: null, pend: 0, tVis: 0 });
  pl.corre = true; stepAgentes(sim, pl, 0.01);
  check('arrancar ante un agente no alertado (pasado el cooldown) suma 1', sim.busq.nivel === 2, String(sim.busq.nivel));
  const s2 = crearSimulacion(vacia(), { esquinas: fila(), rand: rnd });
  stepAgentes(s2, jug(20.5, 20.5, { corre: true }), 0.05);
  check('correr sin que lo vean no suma', s2.busq.nivel === 0);
}

console.log('3. Llamado de peatón');
{
  const sim = crearSimulacion(vacia(), { esquinas: [{ x: 20.5, z: 40.5, yaw: 0 }, { x: 26.5, z: 40.5, yaw: 0 }, { x: 32.5, z: 40.5, yaw: 0 }], rand: rnd });
  alertarAgentes(sim, 26.5, 46.5);
  check('el llamado no suma estrellas ni perseguidores', sim.busq.nivel === 0 && nComp(sim) === 0 && sim.agentes.every(a => a.aviso));
  const pl = jug(26.5, 45.5);
  paso(sim, pl, 0.3);
  check('si uno que acude lo ve: 1 sola estrella y 1 perseguidor', sim.busq.nivel === 1 && nComp(sim) === 1, sim.busq.nivel + ' / ' + nComp(sim));
  paso(sim, pl, 0.1);
  check('los demás vuelven a su esquina, salvo el enviado al lugar', sim.agentes.filter(a => a.aviso).every(a => a.acude) && sim.agentes.filter(a => a.aviso).length <= 1);
}

{
  const sim = crearSimulacion(vacia(), { esquinas: [{ x: 60.5, z: 40.5, yaw: 0 }], rand: () => 0.5 });
  alertarAgentes(sim, 20.5, 40.5);
  const a = sim.agentes[0], pl = jug(55.5, 40.5);   // en el camino, antes de que llegue al lugar
  paso(sim, pl, 0.4);
  check('quien acude persigue al jugador apenas lo ve', a.estado === 'persecucion' && !a.acude && sim.busq.nivel === 1, a.estado + ' ' + sim.busq.nivel);
}

{
  const sim = crearSimulacion(vacia(), { esquinas: [{ x: 40.5, z: 40.5, yaw: 0 }, { x: 90.5, z: 40.5, yaw: 0 }], rand: () => 0.5 });
  sentirVenta(sim, 20.5, 40.5);
  const [a, b] = sim.agentes;
  check('una venta atrae a los cercanos, sin alerta ni estrellas', a.estado === 'patrulla' && a.curiosea && !a.aviso && !b.curiosea && sim.busq.nivel === 0);
  const pl = jug(-500, -500);
  paso(sim, pl, 0.2); const x0 = a.x; paso(sim, pl, 1);
  check('van caminando hacia el lugar', Math.abs((x0 - a.x) - POLI_VEL_ALERTA) < 0.3, (x0 - a.x).toFixed(2));
  let min = Infinity;
  for (let t = 0; t < 10; t += 0.05) { stepAgentes(sim, pl, 0.05); min = Math.min(min, Math.hypot(a.x - 20.5, a.z - 40.5)); }
  check('llegan y después vuelven, sin ponerse en alerta', min < 1.5 && !a.curiosea && a.estado !== 'alerta', min.toFixed(2) + ' ' + a.estado);
}

console.log('4. Zafar y reinicios');
{
  const sim = crearSimulacion(vacia(), { esquinas: fila(), rand: rnd }), pl = jug(20.5, 45.5);
  for (let n = 0; n < 5; n++) { ventaVista(sim, pl); sim.t += BUSQ_CD; }
  stepAgentes(sim, pl, 0.01);
  Object.assign(pl, { px: 120.5, py: 120.5, prevPx: 120.5, prevPy: 120.5 });
  for (const a of sim.agentes) a.ve = false;
  sim.heli.x = 20; sim.heli.z = 40; sim.heli.t = 0.1;
  for (const v of sim.patrullas) { v.x = 10.5; v.z = 10.5; v.ruta = null; }
  let t = 0; for (; t < 30 && !nEv(sim, 'zafe'); t += 0.05) stepAgentes(sim, pl, 0.05);
  check('zafar deja 0 estrellas, sin vehículos ni perseguidores', sim.busq.nivel === 0 && !sim.patrullas.length && !sim.heli && nComp(sim) === 0 && sim.escapes === 1, 't=' + t.toFixed(1));
  check('el evento de zafar dice el nivel', sim.eventos.find(e => e.t === 'zafe')?.nivel === 5);
  check('a 5 estrellas cuesta al menos 8 s', t >= 7.9, t.toFixed(1));
  for (let n = 0; n < 5; n++) { sim.t += BUSQ_CD; ventaVista(sim, jug(sim.agentes[0].x, sim.agentes[0].z + 3)); }
  sim.agentes[0].yaw = 0;
  for (let n = 0; n < 5; n++) { sim.t += BUSQ_CD; ventaVista(sim, jug(sim.agentes[0].x, sim.agentes[0].z + 3)); }
  stepAgentes(sim, pl, 0.01);
  resetAgentes(sim);
  check('resetAgentes limpia todo', sim.busq.nivel === 0 && !sim.patrullas.length && !sim.heli && !sim.heliUsado && nComp(sim) === 0 && !sim.eventos.length && sim.rutas.pendientes() === 0);
}

console.log('5. Última posición vista');
{
  const city = vacia();
  for (let i = 0; i < 80; i++) city.C[50 * N + i] = { t: 'bld', deco: null };     // muro con pasos a la derecha de x = 80
  const sim = crearSimulacion(city, { esquinas: [{ x: 20.5, z: 40.5, yaw: 0 }], rand: rnd }), pl = jug(20.5, 45.5);
  ventaVista(sim, pl); paso(sim, pl, 0.1);
  Object.assign(pl, { px: 60.5, py: 90.5, prevPx: 60.5, prevPy: 90.5 });          // desaparece detrás del muro
  const a = sim.agentes[0]; a.ve = false; a.tVis = 0; sim.G.coimaCd = 0;
  paso(sim, pl, 0.6);
  check('la última posición vista queda donde lo vieron', Math.hypot(sim.ultima.x - 20.5, sim.ultima.z - 45.5) < 0.5, JSON.stringify(sim.ultima));
  paso(sim, pl, 3);
  const dU = Math.hypot(a.x - 20.5, a.z - 45.5), dJ = Math.hypot(a.x - pl.px, a.z - pl.py);
  check('el agente va (y busca) cerca de la última posición vista, no del jugador', dU < 14 && dJ > 30, `a ${dU.toFixed(1)} de la vista, ${dJ.toFixed(1)} del jugador`);
}

console.log('6. Dificultad por ronda y energía');
{
  check('atentos 60 % en ronda 1, +5 % por ronda, tope 100 %', fraccionAtentos(1) === 0.6 && Math.abs(fraccionAtentos(3) - 0.7) < 1e-9 && fraccionAtentos(20) === 1);
  check('visión 8 a 9.5 y velocidad 5.5 a 6', radioVista(1) === 8 && radioVista(20) === 9.5 && velPersecucion(1) === 5.5 && velPersecucion(20) === 6);
  const pl = { energia: 100, agotado: false, corre: false };
  stepEnergia(pl, 0.5, { quiere: true, mueve: true, consumo: 12 });
  check('arrancar cuesta 4 más el consumo', pl.energia === 90, String(pl.energia));
  stepEnergia(pl, 0.5, { quiere: false, mueve: true, consumo: 12 });
  check('no recupera antes de 1 s sin correr', pl.energia === 90);
  stepEnergia(pl, 1, { quiere: false, mueve: true, consumo: 12 });
  check('después recupera 8/s caminando', pl.energia === 98, String(pl.energia));
}

console.log('6b. El más cercano acude corriendo a un llamado');
{
  const sim = crearSimulacion(vacia(), { esquinas: [{ x: 60.5, z: 40.5, yaw: 0 }, { x: 30.5, z: 40.5, yaw: 0 }], rand: rnd }), pl = jug(-500, -500);
  alertarAgentes(sim, 20.5, 40.5);
  const a = sim.agentes.find(p => p.acude);
  check('acude el más cercano', a?.idx === 1);
  paso(sim, pl, 0.2);
  const x0 = a.x; paso(sim, pl, 1);
  check('va corriendo', Math.abs((x0 - a.x) - velPersecucion(sim.ronda)) < 0.3, (x0 - a.x).toFixed(2));
}

console.log('7. Mapa real: un agente por esquina con pool');
const real = await cargarCiudadReal({ leerJson: async u => JSON.parse(await readFile(u, 'utf8')), leerBin: async u => await readFile(u) });
{
  const todas = esquinasReales(real);
  check('un agente por cada esquina del mapa', real.esquinas.length === todas.length && todas.length > 600, String(real.esquinas.length));
  const sim = crearSimulacion(real, { rand: rnd });
  check('al crear no se simula ninguno lejano', sim.pool && sim.agentes.length === 0);
  const c = celdaCaminableMasCerca(real, 300, 300, 30), pl = jug(c.i + .5, c.j + .5);
  activarAgentes(sim, pl);
  const lejos = a => Math.hypot(a.esquinaBase.x - pl.px, a.esquinaBase.z - pl.py);
  check('solo los cercanos, con tope', sim.agentes.length > 0 && sim.agentes.length <= BUSQ_MAX_ACTIVOS && sim.agentes.every(a => lejos(a) <= BUSQ_R_ACTIVA), String(sim.agentes.length));
  const esperadas = sim.esquinas.filter(e => Math.hypot(e.x - pl.px, e.z - pl.py) <= BUSQ_R_ACTIVA).length;
  check('todos los puntos cercanos tienen su agente', sim.agentes.length === Math.min(esperadas, BUSQ_MAX_ACTIVOS), sim.agentes.length + ' de ' + esperadas);
  const d = celdaCaminableMasCerca(real, 100, 100, 30); Object.assign(pl, { px: d.i + .5, py: d.j + .5, prevPx: d.i + .5, prevPy: d.j + .5 });
  paso(sim, pl, 1);
  check('al moverse lejos se sueltan los de antes y aparecen los nuevos', sim.agentes.length > 0 && sim.agentes.every(a => lejos(a) <= BUSQ_R_ACTIVA + 5), String(sim.agentes.length));
}

console.log('8. Mapa real: 5 estrellas, patrullas por calles y rendimiento');
{
  const sim = crearSimulacion(real, { rand: rnd, ronda: 6 });
  let maxMs = 0, suma = 0, n = 0, fueraV = 0, fueraA = 0, exactos = true, movidas = 0, heliMax = 0, heliT = 0, nodos = 0;
  for (let corrida = 0; corrida < 8; corrida++) {
    resetAgentes(sim, 2, 6);
    const c = celdaCaminableMasCerca(real, 120 + rnd() * 360, 120 + rnd() * 360, 60), pl = jug(c.i + .5, c.j + .5);
    activarAgentes(sim, pl);
    sim.busq.nivel = 5; sim.ultima = { x: pl.px, z: pl.py, heading: 0 };
    let ang = rnd() * 6.28; const ini = new Map();
    for (let f = 0; f < 1200; f++) {
      pl.prevPx = pl.px; pl.prevPy = pl.py;
      const nx = pl.px + Math.sin(ang) * 6 / 60, ny = pl.py + Math.cos(ang) * 6 / 60;
      if (!obstaculoEn(real, nx, ny)) { pl.px = nx; pl.py = ny; } else ang = rnd() * 6.28;
      pl.heading = ang;
      const t0 = performance.now(); stepAgentes(sim, pl, 1 / 60); const ms = performance.now() - t0;
      if (corrida || f > 60) { maxMs = Math.max(maxMs, ms); suma += ms; n++; }
      if (sim.G.capT > 0) { sim.G.capT = 0; sim.G.capAg = null; Object.assign(pl, { prevPx: pl.px, prevPy: pl.py }); for (const v of sim.patrullas) { v.x = -50; } sim.patrullas.length = 0; for (const a of sim.agentes) if (Math.hypot(a.x - pl.px, a.z - pl.py) < 2) { a.estado = 'patrulla'; a.x = a.esquinaBase.x; a.z = a.esquinaBase.z; } }
      if (sim.busq.nivel < 5) { sim.busq.nivel = 5; sim.ultima ??= { x: pl.px, z: pl.py, heading: 0 }; }
      else if (f > 1 && sim.G.capT === 0 && nComp(sim) > 12) exactos = false;
      for (const v of sim.patrullas) {
        if (real.C[Math.floor(v.z) * real.N + Math.floor(v.x)].t !== 'road') fueraV++;
        if (!ini.has(v)) ini.set(v, [v.x, v.z]); else movidas = Math.max(movidas, Math.hypot(v.x - ini.get(v)[0], v.z - ini.get(v)[1]));
      }
      for (const a of sim.agentes) if (obstaculoEn(real, a.x, a.z) && a.estado !== 'patrulla') fueraA++;
      if (sim.heli) heliMax = Math.max(heliMax, HELI_T_ESCENA - sim.heli.t);
    }
    nodos = Math.max(nodos, sim.rutas.stats.maxFrame + 0, sim.rutasCalle.stats.maxFrame);
  }
  check('nunca más de 12 perseguidores a pie', exactos);
  check('las patrullas solo pisan calles', fueraV === 0, String(fueraV));
  check('las patrullas se desplazan', movidas > 10, movidas.toFixed(1));
  check('el helicóptero no pasa de su tiempo en escena', heliMax <= HELI_T_ESCENA + 0.05, heliMax.toFixed(1));
  check('presupuesto de A* respetado', nodos <= RUTA_NODOS_FRAME, String(nodos));
  console.log(`  stepAgentes, mapa real, 5 estrellas, ${n} pasos: media ${(suma / n).toFixed(3)} ms, máximo ${maxMs.toFixed(3)} ms (agentes con celda ocupada: ${fueraA})`);
  check('paso medio < 3 ms y máximo < 25 ms', suma / n < 3 && maxMs < 25);
}

console.log('8b. Policías fijos');
{
  const sim = crearSimulacion(real, { rand: rnd });
  const fijos = sim.esquinas.filter(e => e.fijo), resto = sim.esquinas.length - fijos.length;
  check('25 % más de policías, fijos', Math.abs(fijos.length - resto * 0.25) <= 1, fijos.length + ' / ' + resto);
  const zonas = new Array(36).fill(0);
  for (const e of sim.esquinas) zonas[Math.floor(e.z / real.N * 6) * 6 + Math.floor(e.x / real.N * 6)]++;
  check('reparto uniforme: cada sector de 500 m tiene una cantidad pareja', Math.min(...zonas) >= Math.max(...zonas) * 0.65, Math.min(...zonas) + '..' + Math.max(...zonas));
  check('los fijos están en vereda', fijos.every(e => real.C[Math.floor(e.z) * real.N + Math.floor(e.x)].t === 'side'));
  const s2 = crearSimulacion(generarCiudad(), { rand: rnd }), pl = jug(-500, -500);
  paso(s2, pl, 30);
  check('los fijos no se mueven de su lugar', s2.agentes.filter(a => a.fijo).every(a => a.x === a.esquinaBase.x && a.z === a.esquinaBase.z));
}

console.log('8c. Un policía por manzana como mínimo');
{
  const sim = crearSimulacion(real, { rand: rnd }), hay = new Set(sim.esquinas.map(e => Math.floor(e.z) * real.N + Math.floor(e.x)));
  const sin = manzanasConVereda(real).filter(m => !m.veredas.some(v => hay.has(v.j * real.N + v.i))).length;
  check('ninguna manzana queda sin policía', sin === 0, String(sin));
}

console.log('9. Ciudad procedural de respaldo');
{
  const sim = crearSimulacion(generarCiudad(), { rand: rnd });
  check('procedural: grilla uniforme de 49 policías, 10 fijos, todos activos', sim.agentes.length === 49 && sim.agentes.filter(a => a.fijo).length === 10 && !sim.pool, String(sim.agentes.length));
  const a = sim.agentes[0], pl = jug(a.x, a.z + 0.9);
  sim.busq.nivel = 5; sim.ultima = { x: pl.px, z: pl.py, heading: 0 };
  paso(sim, pl, 0.05);
  check('5 estrellas en la procedural: patrullas y helicóptero', sim.patrullas.length === 2 && !!sim.heli && nComp(sim) === 4, `${sim.patrullas.length} / ${nComp(sim)}`);
}

console.log('');
console.log(fallos === 0 ? `TODAS LAS PRUEBAS OK (${pasos})` : `FALLARON ${fallos} de ${pasos}`);
process.exit(fallos === 0 ? 0 : 1);
