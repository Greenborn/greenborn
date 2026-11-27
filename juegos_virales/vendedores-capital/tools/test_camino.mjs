// Pruebas headless del clic para caminar (G22): caminar.js con la ciudad generada y una ciudad sintética (sin DOM).
// Uso: node 2d/tools/test_camino.mjs
import { N, SEMILLA, generarCiudad, walkable, obstaculoEn, celdaCaminableMasCerca, celdaPeatonal } from '../js/ciudad.js';
import { planearCamino, iniciarCamino, cancelarCamino, pasoCamino, crearCamino, hayEntradaManual } from '../js/caminar.js';
import { lineaCaminable, largoRuta } from '../js/rutas.js';
import { SPEED } from '../js/config.js';

let fallos = 0;
function check(nombre, cond, extra = '') {
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}

// Ciudad sintética: todo calle, con un muro de edificios en i = 10 para j >= 5 (hueco arriba, en j < 5).
function ciudadMuro() {
  const C = new Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) C[j * N + i] = { t: 'road', deco: null };
  for (let j = 5; j < N; j++) C[j * N + 10] = { t: 'bld', deco: null };
  return { C, N, seed: 0, zona: new Uint8Array(N * N) };
}

// Recorre el camino como lo hace main.js (movimiento por ejes con colisión), sin entrada manual.
function recorrer(city, camino, pos, maxS = 60) {
  const dt = 1 / 60;
  let cuadros = 0, manual = false;
  for (let t = 0; t < maxS / dt; t++) {
    cuadros++;
    const mv = pasoCamino(camino, pos, { dx: 0, dy: 0 }, dt);
    if (mv.manual) { manual = true; break; }
    if (mv.llego) break;
    const v = SPEED * dt;
    const nx = pos.x + mv.dx * v, ny = pos.y + mv.dy * v;
    if (!obstaculoEn(city, nx, pos.y)) pos.x = nx;
    if (!obstaculoEn(city, pos.x, ny)) pos.y = ny;
  }
  return { cuadros, manual };
}

const celdaDe = p => ({ i: Math.floor(p.x), j: Math.floor(p.y) });
const igual = (a, b) => a.i === b.i && a.j === b.j;

console.log('1. El camino de clic llega a la celda destino (ciudad generada)');
const city = generarCiudad(SEMILLA);
{
  const ini = celdaPeatonal(city, N / 2, N / 2, 30);
  // Destinos caminables a distintas distancias, tomados de la propia ciudad.
  const destinos = [
    celdaPeatonal(city, ini.i + 9.5, ini.j + 0.5, 8),
    celdaPeatonal(city, ini.i - 6.5, ini.j + 7.5, 8),
    celdaPeatonal(city, ini.i + 4.5, ini.j - 12.5, 8),
  ].filter(Boolean);
  check('hay destinos caminables de prueba', destinos.length === 3);
  for (const d of destinos) {
    const plan = planearCamino(city, { x: ini.i + .5, y: ini.j + .5 }, { x: d.i + .5, y: d.j + .5 });
    check(`plan hasta (${d.i},${d.j}) existe`, !!plan);
    if (!plan) continue;
    check(`el destino del plan es la celda clicada (${d.i},${d.j})`, igual(plan.destino, d));
    const ultimo = plan.pasos[plan.pasos.length - 1];
    check(`el último paso es el destino (${d.i},${d.j})`, ultimo && igual(ultimo, d));
    check('todos los puntos de paso son caminables y se unen en línea caminable', plan.pasos.every((c, k) => {
      const prev = k === 0 ? ini : plan.pasos[k - 1];
      const contiguo = Math.max(Math.abs(c.i - prev.i), Math.abs(c.j - prev.j)) <= 1;
      return walkable(city, c.i, c.j) && (contiguo || lineaCaminable(city, prev.i + .5, prev.j + .5, c.i + .5, c.j + .5));
    }));
    // Recorrido real con colisiones: el jugador termina en la celda destino.
    const camino = crearCamino();
    iniciarCamino(camino, plan);
    const pos = { x: ini.i + .5, y: ini.j + .5 };
    const r = recorrer(city, camino, pos);
    check(`recorrido con colisiones llega a (${d.i},${d.j})`, !r.manual && igual(celdaDe(pos), d) && !camino.activo,
      `pos ${pos.x.toFixed(2)},${pos.y.toFixed(2)} en ${r.cuadros} cuadros`);
  }
}

console.log('2. Un destino no caminable se reemplaza por la caminable más cercana');
{
  const edif = (() => {
    for (let j = 2; j < N - 2; j++) for (let i = 2; i < N - 2; i++) if (city.C[j * N + i].t === 'bld') return { i, j };
    return null;
  })();
  check('hay un edificio en la ciudad generada', !!edif);
  const clic = { x: edif.i + .5, y: edif.j + .5 };
  const origen = celdaPeatonal(city, N / 2, N / 2, 30);
  const plan = planearCamino(city, { x: origen.i + .5, y: origen.j + .5 }, clic);
  const esperado = celdaCaminableMasCerca(city, clic.x, clic.y, 6);
  check('el plan existe', !!plan);
  check('el destino es caminable', plan && walkable(city, plan.destino.i, plan.destino.j));
  check('el destino es la caminable más cercana al clic', plan && esperado && igual(plan.destino, esperado),
    plan ? `${plan.destino.i},${plan.destino.j} vs ${esperado && esperado.i},${esperado && esperado.j}` : 'sin plan');
  // Clic fuera de la ciudad: no hay plan.
  check('clic fuera de la ciudad no da plan', planearCamino(city, { x: 5.5, y: 5.5 }, { x: -3, y: 4 }) === null);
}

console.log('3. Un camino con una celda bloqueada en el medio se rodea');
{
  const muro = ciudadMuro();
  // Desde (5,20) hasta (15,20): el muro en i = 10 corta de j = 5 hacia abajo; hay que subir a j = 4.
  // Con 8 direcciones y rectas suavizadas el rodeo mide entre la recta ideal por el hueco (~33) y los 42 de 4 direcciones.
  const plan = planearCamino(muro, { x: 5.5, y: 20.5 }, { x: 15.5, y: 20.5 });
  check('plan existe con el muro', !!plan);
  if (plan) {
    const largo = largoRuta({ i: 5, j: 20 }, plan.pasos);
    check('el camino da un rodeo corto', largo > 32 && largo <= 42, 'largo: ' + largo.toFixed(1));
    check('ningún paso cae en la celda bloqueada', plan.pasos.every(c => !(c.i === 10 && c.j >= 5)));
    check('el camino pasa por el hueco (sube hasta j < 5)', plan.pasos.some(c => c.j < 5));
    const camino = crearCamino();
    iniciarCamino(camino, plan);
    const pos = { x: 5.5, y: 20.5 };
    const r = recorrer(muro, camino, pos);
    check('el recorrido con colisiones llega al otro lado del muro', igual(celdaDe(pos), { i: 15, j: 20 }) && !r.manual,
      `pos ${pos.x.toFixed(2)},${pos.y.toFixed(2)}`);
  }
}

console.log('4. La entrada manual cancela el camino');
{
  const muro = ciudadMuro();
  const camino = crearCamino();
  iniciarCamino(camino, planearCamino(muro, { x: 5.5, y: 20.5 }, { x: 15.5, y: 20.5 }));
  check('el camino arranca activo', camino.activo);
  const pos = { x: 5.5, y: 20.5 };
  const mv1 = pasoCamino(camino, pos, { dx: 0, dy: 0 }, 1 / 60);
  check('sin entrada, el camino sigue y da una dirección', !mv1.manual && (mv1.dx !== 0 || mv1.dy !== 0) && camino.activo);
  const manual = { dx: 0, dy: -1 };
  check('hayEntradaManual detecta el teclado / joystick', hayEntradaManual(manual) && !hayEntradaManual({ dx: 0, dy: 0 }));
  const mv2 = pasoCamino(camino, pos, manual, 1 / 60);
  check('con entrada manual el paso lo marca como manual', mv2.manual === true);
  check('la entrada manual se devuelve tal cual', mv2.dx === 0 && mv2.dy === -1);
  check('la entrada manual deja el camino inactivo', !camino.activo && camino.pasos.length === 0 && camino.destino === null);
  check('después, sin entrada, no hay camino', (() => { const m = pasoCamino(camino, pos, { dx: 0, dy: 0 }, 1 / 60); return !m.manual && m.dx === 0 && m.dy === 0; })());
}

console.log('5. Casos borde');
{
  const muro = ciudadMuro();
  const plan0 = planearCamino(muro, { x: 5.5, y: 5.5 }, { x: 5.2, y: 5.9 });
  check('clic en la propia celda: plan sin pasos', plan0 && plan0.pasos.length === 0);
  const c0 = crearCamino();
  iniciarCamino(c0, plan0);
  check('plan sin pasos no deja el camino activo', !c0.activo);
  cancelarCamino(c0);
  check('cancelarCamino limpia el estado', !c0.activo && c0.pasos.length === 0);
  const camino = crearCamino();
  iniciarCamino(camino, planearCamino(muro, { x: 5.5, y: 20.5 }, { x: 15.5, y: 20.5 }));
  // Trabado: el jugador no se mueve durante más de TRABADO_S; el camino se cancela.
  const pos = { x: 5.5, y: 20.5 };
  let cancelado = false;
  for (let t = 0; t < 60 && !cancelado; t++) {
    const mv = pasoCamino(camino, pos, { dx: 0, dy: 0 }, 1 / 60);
    if (mv.llego) cancelado = !camino.activo;
  }
  check('sin avanzar (trabado) el camino se cancela solo', cancelado && !camino.activo);
}

console.log(fallos ? `\nFallas: ${fallos}` : '\nTodas las pruebas de caminar pasaron.');
process.exitCode = fallos ? 1 : 0;
