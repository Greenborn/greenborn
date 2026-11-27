// Pruebas headless de agentes.js (sin navegador). Uso: node 2d/tools/test_agentes.mjs
// Estados, FOV (cono de 90°), línea de visión, alerta por correr, persecución, safar y captura.
import { N, generarCiudad, walkable } from '../js/ciudad.js';
import {
  crearSimulacion, stepAgentes, ventaVista, corridaVista, alertarAgentes, resetAgentes,
  POLI_T_PERDER, POLI_T_ALERTA, POLI_PAUSA_CAPT, POLI_BFS_FRAME, POLI_FASE,
} from '../js/agentes.js';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}

// Ciudad sintética: todo calle abierta, con edificios sólo donde se indique.
function ciudadVacia() {
  const C = new Array(N * N);
  for (let k = 0; k < C.length; k++) C[k] = { t: 'road', deco: null };
  return { C, N, seed: 0 };
}
const bloque = (city, i0, j0, i1, j1) => { for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) city.C[j * N + i] = { t: 'bld', deco: null }; };
const pl0 = (px, py, extra = {}) => ({ px, py, heading: 0, corre: false, spd: 0, path: [], target: null, prevPx: px, prevPy: py, ...extra });
const ag = (x, z, yaw = 0) => ({ x, z, yaw, esquinaBase: { x, z, yaw } });
const paso = (sim, pl, seg, dt = 0.05) => { for (let t = 0; t < seg; t += dt) stepAgentes(sim, pl, dt); };
const eventos = (sim, t) => sim.eventos.filter(e => e.t === t).length;

console.log('1. Ciudad generada');
{
  const a = generarCiudad(), b = generarCiudad();
  let iguales = true;
  for (let k = 0; k < a.C.length; k++) if (a.C[k].t !== b.C[k].t || a.C[k].deco !== b.C[k].deco) { iguales = false; break; }
  check('misma semilla, misma ciudad', iguales);
  let sidewalks = 0; for (const c of a.C) if (c.t === 'side') sidewalks++;
  check('hay veredas', sidewalks > 1000, 'side=' + sidewalks);
  const sim = crearSimulacion(a);
  check('hay agentes en esquinas de vereda', sim.agentes.length >= 6, 'n=' + sim.agentes.length);
  check('cada agente nace sobre celda caminable', sim.agentes.every(p => walkable(a, Math.floor(p.x), Math.floor(p.z))));
}

console.log('2. Estados y FOV (ciudad abierta)');
{
  const city = ciudadVacia();
  const sim = crearSimulacion(city, { esquinas: [ag(30.5, 30.5, 0)], rand: () => 0.5 });
  const p = sim.agentes[0];
  check('nace en patrulla', p.estado === 'patrulla');
  ventaVista(sim, pl0(30.5, 36.5));                   // dentro del cono (frente, 6 celdas)
  check('venta vista dentro del cono pasa a persecucion', p.estado === 'persecucion', p.estado);
  check('la venta habilita la ventana de captura', p.ventaT > 0);
  check('el evento persecucion se registra', eventos(sim, 'persecucion') >= 1);
  resetAgentes(sim);
  ventaVista(sim, pl0(30.5 + 6 * Math.sin(60 * Math.PI / 180), 30.5 + 6 * Math.cos(60 * Math.PI / 180)));
  check('jugador fuera del cono de 90° (60° a un lado) no es visto', p.estado === 'patrulla', p.estado);
  resetAgentes(sim);
  ventaVista(sim, pl0(30.5, 30.5 - 6));               // detrás del agente
  check('jugador a la espalda no es visto', p.estado === 'patrulla', p.estado);
  resetAgentes(sim);
  ventaVista(sim, pl0(30.5, 30.5 + 9));               // fuera de POLI_RADIO (8) en patrulla
  check('jugador más allá de POLI_RADIO no es visto', p.estado === 'patrulla', p.estado);
}

console.log('3. Línea de visión (edificio entre medio)');
{
  const city = ciudadVacia();
  bloque(city, 30, 33, 30, 33);                       // un edificio de una celda entre agente y jugador
  const sim = crearSimulacion(city, { esquinas: [ag(30.5, 30.5, 0)], rand: () => 0.5 });
  ventaVista(sim, pl0(30.5, 36.5));
  check('edificio en la línea bloquea la visión', sim.agentes[0].estado === 'patrulla', sim.agentes[0].estado);
}

console.log('4. corridaVista (llamada directa): alerta y luego persecucion');
{
  const city = ciudadVacia();
  const sim = crearSimulacion(city, { esquinas: [ag(30.5, 30.5, 0)], rand: () => 0.5 });
  const p = sim.agentes[0];
  const pl = pl0(30.5, 35.5, { corre: true });
  corridaVista(sim, pl);
  check('correr visto pasa a alerta', p.estado === 'alerta', p.estado);
  const t0 = p.tAlerta;
  check('la alerta dura POLI_T_ALERTA', Math.abs(t0 - POLI_T_ALERTA) < 1e-9, 'tAlerta=' + t0);
  // Mientras esté en alerta el jugador sigue quieto (sin correr): tras POLI_T_ALERTA pasa a persecución.
  pl.corre = false;
  paso(sim, pl, POLI_T_ALERTA + 0.2);
  check('tras POLI_T_ALERTA pasa a persecucion', p.estado === 'persecucion', p.estado);
}

console.log('5. Safar: sin ser visto POLI_T_PERDER s y lejos');
{
  const city = ciudadVacia();
  const sim = crearSimulacion(city, { esquinas: [ag(30.5, 30.5, 0)], rand: () => 0.5 });
  const p = sim.agentes[0];
  p.estado = 'persecucion'; p.tRuta = 999; p.ruta = null; p.tVis = 999; p.x = 34.5;   // persigue pero sin ruta: se queda en su lugar (lejos de su esquina)
  const pl = pl0(30.5, 50.5);                          // a 20 celdas: más allá de POLI_DIST_SAFAR y de visión de persecucion
  paso(sim, pl, POLI_T_PERDER - 0.5);
  check('antes de POLI_T_PERDER no zafó', sim.escapes === 0, 'escapes=' + sim.escapes);
  paso(sim, pl, 1);
  check('tras POLI_T_PERDER zafó', sim.escapes === 1 && eventos(sim, 'zafe') === 1, 'escapes=' + sim.escapes);
  check('el perseguidor vuelve a regreso', p.estado === 'regreso', p.estado);
  paso(sim, pl, 1);
  check('tras zafar, en regreso hacia su esquina (x disminuye)', p.x < 34.5, 'x=' + p.x);
}

console.log('6. Captura: distancia < POLI_CAPTURA y fin de partida');
{
  const city = ciudadVacia();
  const sim = crearSimulacion(city, { esquinas: [ag(30.5, 30.5, 0)], rand: () => 0.5 });
  const p = sim.agentes[0];
  p.estado = 'persecucion'; p.tRuta = 999; p.ruta = null; p.tVis = 999; p.ve = true;
  const pl = pl0(30.5, 30.8, { prevPx: 30.5, prevPy: 30.8 });
  stepAgentes(sim, pl, 0.05);
  check('agente a 0.3 celdas captura', eventos(sim, 'atrapado') === 1 && sim.G.capT > 0);
  check('captura congela al jugador', pl.spd === 0 && pl.path.length === 0);
  paso(sim, pl, POLI_PAUSA_CAPT + 0.1);
  check('tras la pausa termina con capturado', eventos(sim, 'capturado') === 1);
}
{
  // Tunneling: el jugador cruza la distancia de captura en un solo paso (prev lejos, actual lejos pero el tramo pasa cerca).
  const city = ciudadVacia();
  const sim = crearSimulacion(city, { esquinas: [ag(30.5, 30.5, 0)], rand: () => 0.5 });
  const p = sim.agentes[0];
  p.estado = 'persecucion'; p.tRuta = 999; p.ruta = null; p.tVis = 999;
  const pl = pl0(30.5 + 1.0, 30.5, { prevPx: 30.5 - 1.0, prevPy: 30.5 });   // cruza sobre el agente
  stepAgentes(sim, pl, 0.05);
  check('captura por tramo recorrido (sin tunneling)', eventos(sim, 'atrapado') === 1);
}

console.log('7b. Llamado: siempre acude al menos un agente');
{
  const city = ciudadVacia();
  const sim = crearSimulacion(city, { esquinas: [ag(30.5, 30.5, 0), ag(90.5, 90.5, 0)], rand: () => 0.5, patrulla: 1 });
  alertarAgentes(sim, 60.5, 30.5);
  const [a, b] = sim.agentes;
  check('sin nadie cerca, va el más cercano', a.estado === 'alerta' && a.aviso && b.estado === 'patrulla', a.estado + ' ' + b.estado);
  const lejos = { px: 5.5, py: 110.5, heading: 0, corre: false, prevPx: 5.5, prevPy: 110.5 };
  let min = Infinity;
  for (let t = 0; t < 14; t += 0.05) { stepAgentes(sim, lejos, 0.05); min = Math.min(min, Math.hypot(a.x - 60.5, a.z - 30.5)); }
  check('llega hasta el lugar del transeúnte', min < 1.5, min.toFixed(2));
  const s2 = crearSimulacion(city, { esquinas: [ag(30.5, 30.5, 0), ag(90.5, 90.5, 0)], rand: () => 0.5, patrulla: 1 });
  s2.busq.nivel = 1; s2.agentes[1].estado = 'persecucion';
  alertarAgentes(s2, 40.5, 30.5);
  check('con estrellas también va un agente libre', s2.agentes[0].estado === 'alerta' && s2.agentes[0].acude);
}

console.log('7. Llamado de un peaton (alertarAgentes)');
{
  const city = ciudadVacia();
  const sim = crearSimulacion(city, { esquinas: [ag(30.5, 30.5, 0), ag(90.5, 90.5, 0)], rand: () => 0.5 });
  alertarAgentes(sim, 32.5, 30.5);
  check('el agente cercano (< POLI_R_AVISO) pasa a alerta de aviso', sim.agentes[0].estado === 'alerta' && sim.agentes[0].aviso);
  check('el agente lejano no se mueve', sim.agentes[1].estado === 'patrulla');
}

console.log('8. Patrulla en ciudad generada: se mantienen en celdas caminables');
{
  const city = generarCiudad();
  const sim = crearSimulacion(city, { rand: Math.random });
  // Jugador a 35 celdas de la primera esquina (sin ver a nadie: fuera de cono y de alcance).
  const b = sim.agentes[0];
  const pl = pl0(b.x + 35, b.z);
  let fueraDeCamino = 0, pasosTot = 0;
  for (let t = 0; t < 60; t += 0.05) {
    stepAgentes(sim, pl, 0.05);
    for (const p of sim.agentes) {
      if (p.estado !== 'patrulla') continue;
      pasosTot++;
      if (!walkable(city, Math.floor(p.x), Math.floor(p.z))) fueraDeCamino++;
    }
  }
  check('patrulla: ningún agente pisa celda no caminable', fueraDeCamino === 0, 'fuera=' + fueraDeCamino + ' de ' + pasosTot);
  check('patrulla: no hay persecución sin jugador visto', sim.agentes.every(p => p.estado === 'patrulla'), sim.agentes.map(p => p.estado).join(','));
}

console.log('9. Tope de BFS por paso');
{
  const city = ciudadVacia();
  const esq = [];
  for (let k = 0; k < 12; k++) esq.push(ag(30.5 + k * 0.5, 30.5, 0));
  const sim = crearSimulacion(city, { esquinas: esq, rand: () => 0.5 });
  for (const p of sim.agentes) { p.estado = 'persecucion'; p.tRuta = 0; p.tVis = 999; }
  const pl = pl0(60.5, 60.5);
  stepAgentes(sim, pl, 0.05);
  const conRuta = sim.agentes.filter(p => p.ruta !== null).length;
  check('no más de POLI_BFS_FRAME rutas nuevas por paso', conRuta <= POLI_BFS_FRAME, 'con ruta=' + conRuta);
}

console.log('10. Patrulla 1 (esquina): quietos en su esquina con barrido de cabeza');
{
  const esq = [{ x: 30.5, z: 30.5, yaw: 0 }, { x: 25.5, z: 30.5, yaw: Math.PI / 2 }];
  const pl = pl0(45.5, 30.5);                              // a 15 celdas, fuera del cono (está al costado, no al frente)
  const s1 = crearSimulacion(ciudadVacia(), { esquinas: esq, rand: () => 0.5, patrulla: 1 });
  let desp = 0, giro = false;
  for (let t = 0; t < 60; t += 0.05) {
    stepAgentes(s1, pl, 0.05);
    for (const p of s1.agentes) {
      desp = Math.max(desp, Math.hypot(p.x - p.esquinaBase.x, p.z - p.esquinaBase.z));
      if (Math.abs(p.yaw - p.esquinaBase.yaw) > 0.1) giro = true;
    }
  }
  check('patrulla 1: ningún agente se mueve de su esquina', desp < 1e-9, 'desp=' + desp.toFixed(4));
  check('patrulla 1: barre la cabeza (el yaw cambia)', giro);
  check('patrulla 1: sin persecución si nadie la ve', s1.agentes.every(p => p.estado === 'patrulla'));

  let semilla = 12345;                                     // generador que varía (con 0.5 siempre se elige la propia esquina)
  const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  const s2 = crearSimulacion(ciudadVacia(), { esquinas: esq, rand: azar });
  check('patrulla por defecto es 2 (POLI_FASE)', s2.patrulla === 2 && POLI_FASE === 2, 'patrulla=' + s2.patrulla);
  let camino = 0;
  for (let t = 0; t < 60; t += 0.05) {                     // control: en patrulla 2 sí camina
    stepAgentes(s2, pl, 0.05);
    for (const p of s2.agentes) camino = Math.max(camino, Math.hypot(p.x - p.esquinaBase.x, p.z - p.esquinaBase.z));
  }
  check('patrulla 2 camina por la vereda (control)', camino > 0.5, 'max=' + camino.toFixed(2));

  // Alerta y persecución igual que el modo 2: corre visto a 3 celdas de frente.
  const s3 = crearSimulacion(ciudadVacia(), { esquinas: [{ x: 30.5, z: 30.5, yaw: 0 }], rand: () => 0.5, patrulla: 1 });
  const pl3 = pl0(30.5, 33.5, { corre: true });
  stepAgentes(s3, pl3, 0.05);
  check('patrulla 1: correr visto dispara persecución en el acto', s3.agentes[0].estado === 'persecucion', s3.agentes[0].estado);
  for (let t = 0; t < POLI_T_ALERTA + 0.3; t += 0.05) stepAgentes(s3, pl3, 0.05);
  check('patrulla 1: sigue persiguiendo', s3.agentes[0].estado === 'persecucion', s3.agentes[0].estado);
  check('patrulla 1: la persecución deja el evento', s3.perseguido === true);
}

console.log('11. Reinicio de la patrulla al empezar partida (resetAgentes)');
{
  const esq = [{ x: 30.5, z: 30.5, yaw: 0 }];
  const s = crearSimulacion(ciudadVacia(), { esquinas: esq, rand: () => 0.5 });
  resetAgentes(s, 1);
  check('resetAgentes(sim, 1) cambia a patrulla 1', s.patrulla === 1);
  resetAgentes(s);
  check('resetAgentes sin patrulla conserva la elegida', s.patrulla === 1);
}

console.log('');
console.log(fallos === 0 ? `TODAS LAS PRUEBAS OK (${pasos})` : `FALLARON ${fallos} de ${pasos}`);
process.exit(fallos === 0 ? 0 : 1);
