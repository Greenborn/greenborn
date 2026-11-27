// Pruebas headless del cono de ofrecer (sin DOM ni canvas). Uso: node 2d/tools/test_ofrecer.mjs
// Alcance base 2.25 y +0.75 por nivel de la mejora Alcance (3.0 y 3.75), semiángulo de 90°, línea de visión que bloquea
// el objetivo detrás de un edificio, selección del peatón más cercano dentro del cono y pistas de una sola vez.
import { N } from '../js/ciudad.js';
import { OFR_RADIO, OFR_RADIO_MAX, OFR_PASO, OFR_MED_ANG } from '../js/config.js';
import { economiaInicial, radioOfrecer } from '../js/economia.js';
import { buscarObjetivoOfrecer, memNueva } from '../js/peatones.js';
import { cargarPistas, pistaVista, marcarPista, pistaUnaVez, CLAVE_PISTAS } from '../js/pistas.js';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}
const cerca = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// Ciudad sintética abierta (todo calle), con edificios opcionales en celdas [i, j].
function ciudad(edificios = []) {
  const C = Array.from({ length: N * N }, () => ({ t: 'road', deco: null, rCol: 0 }));
  for (const [i, j] of edificios) C[j * N + i] = { t: 'bld', deco: null, rCol: 0 };
  return { C, zona: new Uint8Array(N * N) };
}

// Jugador en (10.5, 10.5) mirando hacia +z (heading 0 = forward (sin 0, cos 0) = (0, 1)).
const jugador = () => ({ px: 10.5, py: 10.5, heading: 0 });
// Peatón elegible en (x, z), con pausa y memoria por defecto.
const peat = (x, z, extra = {}) => ({ x, z, pausa: 0, mem: memNueva(), ...extra });
// Mejora de Alcance al nivel n (el resto en 0).
const econAlcance = n => ({ ...economiaInicial(), mejoras: { ...economiaInicial().mejoras, alcance: n } });

// Almacenamiento simulado (como localStorage, con getItem/setItem).
function almacen(lanza = false) {
  const m = new Map();
  return {
    getItem: k => { if (lanza) throw new Error('sin acceso'); return m.has(k) ? m.get(k) : null; },
    setItem: (k, v) => { if (lanza) throw new Error('sin acceso'); m.set(k, String(v)); },
    m,
  };
}

console.log('Alcance de ofrecer');
check('base de la 2D: OFR_RADIO = 2.25 celdas (D8)', cerca(OFR_RADIO, 2.25));
check('tope del alcance: 3.75 (base + 2 niveles)', cerca(OFR_RADIO_MAX, 3.75));
check('paso por nivel: 0.75', cerca(OFR_PASO, 0.75));
check('sin mejora: radio 2.25', cerca(radioOfrecer(econAlcance(0)), 2.25), String(radioOfrecer(econAlcance(0))));
check('nivel 1 de Alcance: radio 3.0', cerca(radioOfrecer(econAlcance(1)), 3.0), String(radioOfrecer(econAlcance(1))));
check('nivel 2 de Alcance: radio 3.75', cerca(radioOfrecer(econAlcance(2)), 3.75), String(radioOfrecer(econAlcance(2))));
check('cada nivel suma 0.75', cerca(radioOfrecer(econAlcance(1)) - radioOfrecer(econAlcance(0)), 0.75) && cerca(radioOfrecer(econAlcance(2)) - radioOfrecer(econAlcance(1)), 0.75));
check('el tope no supera 3.75 aunque el nivel sea mayor', cerca(radioOfrecer(econAlcance(9)), 3.75));

console.log('Semiángulo del cono');
check('semiángulo de 90 grados', cerca(OFR_MED_ANG * 180 / Math.PI, 90, 1e-9), String(OFR_MED_ANG * 180 / Math.PI));

console.log('Selección del objetivo');
const R = 2.25;
{
  // Dentro del cono y a 2 celdas al frente: es el objetivo.
  const p = peat(10.5, 12.5);
  check('peatón al frente dentro del alcance es el objetivo', buscarObjetivoOfrecer([p], ciudad(), jugador(), R, OFR_MED_ANG) === p);
}
{
  // Ángulo 95 grados (fuera de 90) a distancia 2: no entra.
  const a = 95 * Math.PI / 180;
  const p = peat(10.5 + 2 * Math.sin(a), 10.5 + 2 * Math.cos(a));
  check('peatón a 95 grados (fuera del cono de 90) no es objetivo', buscarObjetivoOfrecer([p], ciudad(), jugador(), R, OFR_MED_ANG) === null);
}
{
  // Ángulo 85 grados (dentro de 90) a distancia 2: entra.
  const a = 85 * Math.PI / 180;
  const p = peat(10.5 + 2 * Math.sin(a), 10.5 + 2 * Math.cos(a));
  check('peatón a 85 grados (dentro del cono de 90) es objetivo', buscarObjetivoOfrecer([p], ciudad(), jugador(), R, OFR_MED_ANG) === p);
}
{
  // Distancia 2.5: fuera del alcance base 2.25, pero entra con el nivel 1 (3.0).
  const p = peat(10.5, 13.0);
  check('peatón a 2.5 celdas queda fuera con alcance base', buscarObjetivoOfrecer([p], ciudad(), jugador(), R, OFR_MED_ANG) === null);
  check('peatón a 2.5 celdas entra con alcance nivel 1 (3.0)', buscarObjetivoOfrecer([p], ciudad(), jugador(), radioOfrecer(econAlcance(1)), OFR_MED_ANG) === p);
  check('peatón a 2.5 celdas entra con nivel 2 (3.75)', buscarObjetivoOfrecer([p], ciudad(), jugador(), radioOfrecer(econAlcance(2)), OFR_MED_ANG) === p);
}
{
  // Detrás del jugador: no es objetivo aunque esté cerca.
  const p = peat(10.5, 8.5);
  check('peatón detrás del jugador no es objetivo', buscarObjetivoOfrecer([p], ciudad(), jugador(), R, OFR_MED_ANG) === null);
}
{
  // Elige el más cercano dentro del cono, no el primero de la lista.
  const lejos = peat(10.5, 12.4), cerc = peat(10.5 + 0.4, 11.8);   // lejos: 1.9 celdas; cerc: 1.36 celdas
  check('elige el más cercano dentro del cono (no el primero de la lista)', buscarObjetivoOfrecer([lejos, cerc], ciudad(), jugador(), R, OFR_MED_ANG) === cerc);
}
{
  // El más cercano fuera del cono no gana frente a uno dentro del cono más lejano.
  const fuera = peat(10.5 + 1.2, 10.5 - 0.4);      // ángulo mayor a 90 grados, muy cerca
  const dentro = peat(10.5, 12.5);                 // al frente, más lejos
  check('un peatón fuera del cono, aunque más cerca, no es elegido', buscarObjetivoOfrecer([fuera, dentro], ciudad(), jugador(), R, OFR_MED_ANG) === dentro);
}
{
  // Peatón no elegible (en pausa o en estado P) se saltea.
  const pausado = peat(10.5, 11.8, { pausa: 1 });
  const otro = peat(10.5, 12.5);
  check('un peatón en pausa no es objetivo; se elige el siguiente', buscarObjetivoOfrecer([pausado, otro], ciudad(), jugador(), R, OFR_MED_ANG) === otro);
}
{
  const en_p = peat(10.5, 11.8); en_p.mem.est = 'P';
  check('un peatón en estado P no es objetivo', buscarObjetivoOfrecer([en_p], ciudad(), jugador(), R, OFR_MED_ANG) === null);
}

console.log('Línea de visión');
{
  // Edificio en la celda (10, 11) entre el jugador (10.5, 10.5) y el peatón (10.5, 12.5).
  const p = peat(10.5, 12.5);
  check('edificio entre jugador y peatón bloquea el objetivo', buscarObjetivoOfrecer([p], ciudad([[10, 11]]), jugador(), R, OFR_MED_ANG) === null);
  const q = peat(10.5, 12.5);
  check('sin edificio en la línea, el mismo peatón sí es objetivo', buscarObjetivoOfrecer([q], ciudad([[3, 3]]), jugador(), R, OFR_MED_ANG) === q);
}
{
  // Con un peatón tapado por el edificio y otro libre dentro del cono, se elige el libre.
  // (Con el edificio en (10, 11), cualquier punto del cono más allá de la fila 11 queda tapado; el libre está en la celda del jugador.)
  const tapado = peat(10.5, 12.5), libre = peat(10.7, 10.9);
  const sel = buscarObjetivoOfrecer([tapado, libre], ciudad([[10, 11]]), jugador(), R, OFR_MED_ANG);
  check('con un peatón tapado por un edificio y otro libre en el cono, se elige el libre', sel === libre, sel ? 'otro peatón' : 'null');
}

console.log('Pistas de tutorial (localStorage 2d_pistas)');
{
  check('la clave es 2d_pistas', CLAVE_PISTAS === '2d_pistas');
  const st = almacen();
  check('sin nada guardado, la pista no está vista', pistaVista('venta', st) === false);
  check('la primera vez la pista se muestra', pistaUnaVez('venta', 'Texto', st) === true);
  check('la segunda vez no se muestra', pistaUnaVez('venta', 'Texto', st) === false);
  check('queda guardada en 2d_pistas', st.m.has('2d_pistas') && cargarPistas(st).venta === true);
  check('otra pista no queda marcada por error', pistaVista('ofrecer', st) === false);
  marcarPista('agente', st);
  check('marcarPista guarda la pista', cargarPistas(st).agente === true);
}
{
  const roto = almacen(true);
  check('con almacenamiento que falla, no rompe y muestra la pista una vez por sesión',
    pistaUnaVez('corre', 'Texto', roto) === true && pistaUnaVez('corre', 'Texto', roto) === false);
}
{
  const basura = { getItem: () => '{no es json', setItem: () => {} };
  check('un valor corrupto en 2d_pistas se trata como vacío', Object.keys(cargarPistas(basura)).length === 0);
}

console.log('');
if (fallos) {
  console.log(`FALLARON ${fallos} de ${pasos} pruebas`);
  process.exitCode = 1;
} else {
  console.log(`TODAS LAS PRUEBAS OK (${pasos})`);
}
