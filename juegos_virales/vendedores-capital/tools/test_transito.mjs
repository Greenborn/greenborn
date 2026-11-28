// Pruebas headless del tránsito (transito.js): recorrido por la calzada, aparición lejos del jugador, frenada con margen,
// atropello al cruzar sin mirar, vereda y gracia seguras, peatones, camino por clic y rendimiento.
// Uso: node 2d/tools/test_transito.mjs
import { readFile } from 'node:fs/promises';
import { generarCiudad, rng, walkable } from '../js/ciudad.js';
import { cargarCiudadReal } from '../js/ciudad_real.js';
import { crearTransito, resetTransito, stepTransito, crearAuto, enCalzada, anilloSpawn, hayPeligro, miraAlCruzar, celdaSegura } from '../js/transito.js';
import { crearCamino, iniciarCamino, pasoCamino } from '../js/caminar.js';
import { MOTIVOS_FIN } from '../js/textos.js';
import { textoCompartir } from '../js/puntaje.js';
import { TR_AUTOS, TR_SPAWN_MIN, TR_GRACIA, TR_V_ATROPELLO, SPEED } from '../js/config.js';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}
const DT = 1 / 30;

// Calle recta de 2 celdas (filas 10 y 11) de oeste a este, con veredas.
function calleRecta(N = 80) {
  const C = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) C.push({ t: j === 10 || j === 11 ? 'road' : 'side', deco: null });
  return { N, C };
}
// Un solo auto hacia el este por el carril derecho (fila 11), sin gracia.
function escenario(x = 20, vel = 5) {
  const tr = crearTransito(calleRecta(), { rnd: rng(1) });
  tr.gracia = 0;
  const a = crearAuto(tr, x, 11, [1, 0], vel);
  tr.autos.push(a);
  return { tr, a };
}
// Avanza `s` segundos; mover(pl, dt) mueve al jugador. Devuelve { atropello, eventos }.
function correr(tr, pl, s, { mover, npcs, protegido } = {}) {
  const eventos = [];
  for (let t = 0; t < s; t += DT) {
    mover?.(pl, DT);
    const r = stepTransito(tr, pl, DT, { npcs, protegido, max: tr.autos.length });
    eventos.push(...tr.eventos.splice(0));
    if (r.atropello) return { atropello: true, eventos };
  }
  return { atropello: false, eventos };
}

console.log('Frenada y atropello');
{
  const { tr, a } = escenario();
  const pl = { px: 34.5, py: 11.5 };
  const r = correr(tr, pl, 8);
  check('con margen frena antes de llegar y no atropella', !r.atropello && a.v < 0.1 && a.x + 0.8 < pl.px, `x ${a.x.toFixed(2)} v ${a.v.toFixed(2)}`);
  check('y toca bocina', r.eventos.some(e => e.t === 'bocina' || e.t === 'frenada'));
  pl.py = 13.5;
  correr(tr, pl, 2);
  check('al despejarse la calle sigue', a.v > 3, a.v.toFixed(2));
}
{
  // Cruza caminando desde la vereda de abajo, con el auto muy cerca.
  const { tr } = escenario();
  const r = correr(tr, { px: 22.4, py: 12.4 }, 2, { mover: (p, dt) => { p.py -= SPEED * dt; } });
  check('cruzar justo delante: atropello', r.atropello && r.eventos.some(e => e.t === 'atropello'));
}
{
  const { tr } = escenario();
  const r = correr(tr, { px: 29, py: 12.4 }, 3, { mover: (p, dt) => { p.py -= SPEED * dt; } });
  check('cruzar con el auto lejos: no pasa nada', !r.atropello);
}
{
  const { tr, a } = escenario();
  const r = correr(tr, { px: 24.5, py: 12.2 }, 3);
  check('en la vereda, pegado al cordón: ni atropello ni frenada', !r.atropello && a.v > 4 && !r.eventos.length);
}
{
  // Barrido de distancias al meterse y quedarse quieto: cerca mata, lejos no, con un solo umbral.
  const res = [];
  for (let d = 1.2; d <= 10; d += 0.4) { const { tr } = escenario(20, 5.4); res.push([d, correr(tr, { px: 20.5 + d, py: 11.5 }, 4).atropello]); }
  const muere = res.filter(r => r[1]).map(r => r[0]), vive = res.filter(r => !r[1]).map(r => r[0]);
  check('umbral de distancia coherente (menos de 6 celdas)', muere.length && Math.max(...muere) < Math.min(...vive) && Math.max(...muere) < 6, `muere hasta ${Math.max(...muere)}`);
}
{
  const { tr, a } = escenario();
  const r = correr(tr, { px: 21.8, py: 11.5 }, 3, { protegido: true });
  check('protegido (capturado o ronda vendida): frena en seco', !r.atropello && a.v <= TR_V_ATROPELLO);
  const e = escenario(); e.tr.gracia = TR_GRACIA;
  check('durante la gracia no atropella', !correr(e.tr, { px: 21.8, py: 11.5 }, TR_GRACIA + 3).atropello);
}
{
  const { tr, a } = escenario();
  const ped = { x: 22.2, z: 11.5 }, lejos = { px: 40, py: 30 };
  correr(tr, lejos, 1, { npcs: [[ped]] });
  check('un peatón en la calzada: el auto no le pasa por encima mientras espera', a.x + 0.8 <= ped.x + 0.3, a.x.toFixed(2));
  correr(tr, lejos, 10, { npcs: [[ped]] });
  check('si el peatón no se corre, al rato pasa (no queda clavado)', a.x > ped.x + 1, a.x.toFixed(2));
}
{
  const { tr, a } = escenario(10, 5);
  const b = crearAuto(tr, 16, 11, [1, 0], 4.2); tr.autos.push(b);
  b.vMax = 0; b.v = 0;
  correr(tr, { px: 40, py: 40 }, 2);
  check('un auto no atraviesa al de adelante', b.x - a.x >= 1.5, (b.x - a.x).toFixed(2));
}

console.log('Camino por clic');
{
  const { tr } = escenario(20, 5);
  check('peligro delante del auto; no en la vereda ni lejos', hayPeligro(tr, 22.5, 11.5) && !hayPeligro(tr, 22.5, 12.5) && !hayPeligro(tr, 34.5, 11.5));
  const cam = crearCamino(), pl = { px: 24.5, py: 12.5 };
  iniciarCamino(cam, { destino: { i: 24, j: 8 }, pasos: [{ i: 24, j: 8 }] });
  let espero = false;
  const mira = (dx, dy) => miraAlCruzar(tr, pl, dx, dy);
  const r = correr(tr, pl, 8, { mover: (p, dt) => {
    const q = pasoCamino(cam, { x: p.px, y: p.py }, { dx: 0, dy: 0 }, dt, mira);
    espero ||= !!q.espera;
    p.px += q.dx * SPEED * dt; p.py += q.dy * SPEED * dt;
  } });
  check('espera a que pase, cruza y llega', espero && !r.atropello && Math.abs(pl.py - 8.5) < 0.3 && !cam.activo, `${espero} ${pl.py.toFixed(2)}`);
}

console.log('Fin de partida');
check('motivo y texto de compartir propios', MOTIVOS_FIN.atropello?.[0] === '¡Te atropellaron!' && /atropellaron/.test(textoCompartir({ motivo: 'atropello', puntos: 1 })));

const real = await cargarCiudadReal({ leerJson: async u => JSON.parse(await readFile(u, 'utf8')), leerBin: u => readFile(u) });
for (const [nombre, city] of [['procedural', generarCiudad()], ['real', real]]) {
  console.log('Ciudad ' + nombre);
  const tr = crearTransito(city, { rnd: rng(7) });
  const centro = celdaSegura(city, city.N / 2, city.N / 2, 40);
  check('hay lugar fuera de la calzada para empezar', centro && walkable(city, centro.i, centro.j) && city.C[centro.j * city.N + centro.i].t !== 'road');
  const pl = { px: centro.i + .5, py: centro.j + .5 };
  const vistos = new Set();
  let fuera = 0, cerca = Infinity, golpe = false, quietos = 0, muestras = 0, aLaVista = 0, ms = 0, frames = 0;
  for (let t = 0; t < 180; t += DT) {
    const t0 = performance.now();
    golpe ||= stepTransito(tr, pl, DT, { vista: 14 }).atropello;
    ms += performance.now() - t0; frames++;
    for (const a of tr.autos) {
      if (!vistos.has(a)) { vistos.add(a); cerca = Math.min(cerca, Math.hypot(a.x - pl.px, a.z - pl.py)); }
      // Las diagonales de las calles torcidas pueden rozar la esquina de una celda: se mira que la celda o una vecina sea calle.
      if (![[0, 0], [.5, 0], [-.5, 0], [0, .5], [0, -.5]].some(([dx, dz]) => enCalzada(tr, a.x + dx, a.z + dz))) fuera++;
      muestras++; if (a.v < 0.3) quietos++;
    }
    if (tr.autos.some(a => Math.hypot(a.x - pl.px, a.z - pl.py) < 12)) aLaVista++;
  }
  check('los autos no salen de la calzada', fuera === 0, String(fuera));
  check('aparecen lejos del jugador', cerca >= TR_SPAWN_MIN - 0.5 && anilloSpawn(14).min >= TR_SPAWN_MIN, cerca.toFixed(1));
  check('hay tránsito y no pasa del tope', tr.autos.length >= TR_AUTOS * 0.7 && tr.autos.length <= TR_AUTOS, String(tr.autos.length));
  check('el tránsito fluye', quietos / muestras < 0.15, (quietos / muestras).toFixed(3));
  check('quieto en la vereda nunca lo atropellan', !golpe);
  check('pasan autos cerca (al menos 25 % del tiempo)', aLaVista / frames > 0.25, (aLaVista / frames).toFixed(2));
  check('menos de 1 ms por paso en promedio', ms / frames < 1, (ms / frames).toFixed(3));
  console.log(`    a menos de 12 celdas ${(100 * aLaVista / frames).toFixed(0)} %, quietos ${(100 * quietos / muestras).toFixed(1)} %, ${(ms / frames).toFixed(3)} ms/paso, ${vistos.size} autos`);
  resetTransito(tr);
  check('reinicio: sin autos y con gracia', !tr.autos.length && tr.gracia === TR_GRACIA);

  // Balance: cruzar una calle a pie, sin mirar (teclado) y mirando (como el camino por clic).
  const cruzar = mirando => {
    let cruces = 0, muertes = 0;
    const r = rng(11);
    resetTransito(tr);
    for (let t = 0; t < 30; t += DT) stepTransito(tr, pl, DT, { vista: 14 });
    for (let k = 0; k < 400; k++) {
      // Calle horizontal de 2 a 4 celdas con vereda de los dos lados, cerca del jugador.
      let c = null;
      for (let n = 0; n < 4000 && !c; n++) {
        const i = Math.floor(pl.px + (r() - .5) * 30), j = Math.floor(pl.py + (r() - .5) * 30);
        const t = d => city.C[(j + d) * city.N + i]?.t;
        if (t(0) !== 'side' || t(1) !== 'road') continue;
        for (let w = 2; w <= 5; w++) if (t(w) === 'side') { c = { i, j, w }; break; }
      }
      if (!c) break;
      const p = { px: c.i + .5, py: c.j + .5 };
      tr.gracia = 0;
      cruces++;
      for (let t = 0; p.py < c.j + c.w + .5 && t < 15; t += DT) {
        if (!(mirando && miraAlCruzar(tr, p, 0, 1))) p.py += SPEED * DT;
        if (stepTransito(tr, p, DT, { vista: 14 }).atropello) { muertes++; break; }
      }
      const vereda = { px: p.px, py: c.j + .5 };
      for (let s = 0, e = r() * 2; s < e; s += DT) stepTransito(tr, vereda, DT, { vista: 14 });
    }
    console.log(`    cruces ${mirando ? 'mirando' : 'sin mirar'}: ${muertes} atropellos en ${cruces} (${(100 * muertes / cruces).toFixed(1)} %)`);
    return muertes / cruces;
  };
  const sinMirar = cruzar(false), mirando = cruzar(true);
  check('cruzar sin mirar es riesgoso pero no fatal siempre', sinMirar > 0.01 && sinMirar < 0.35, String(sinMirar));
  check('mirando (camino por clic) casi no hay atropellos', mirando <= 0.01 && mirando < sinMirar, String(mirando));
}

console.log('');
console.log(fallos === 0 ? `TODAS LAS PRUEBAS OK (${pasos})` : `FALLARON ${fallos} de ${pasos}`);
process.exit(fallos === 0 ? 0 : 1);
