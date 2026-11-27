// Pruebas headless de la ciudad por barrios y de la cámara con giro (sin navegador). Uso: node 2d/tools/test_ciudad.mjs
// Misma semilla, misma ciudad; zonaDe reparte las 132 x 132 celdas en 9 barrios; cada barrio tiene celdas caminables y una
// posición inicial caminable dentro de su zona; la cámara gira 45 grados por paso y vuelve al inicio tras 8 pasos.
import { N, SEMILLA, generarCiudad, walkable, zonaEn, celdaCaminableMasCerca } from '../js/ciudad.js';
import { BARRIOS, ZONAS_NOMBRE, ZONA_CENTRO, GRILLA, zonaDe, centroideBarrio } from '../js/barrios.js';
import { crearCamara, girarPor, aPantalla, aMundo, PASO_ROT } from '../js/camara.js';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}
const TAU = Math.PI * 2;
const mismoAngulo = (a, b) => { const d = ((a - b) % TAU + TAU) % TAU; return Math.min(d, TAU - d) < 1e-9; };

console.log('1. Misma semilla, misma ciudad');
{
  const a = generarCiudad(SEMILLA), b = generarCiudad(SEMILLA);
  let difieren = 0;
  for (let q = 0; q < N * N; q++) {
    const x = a.C[q], y = b.C[q];
    if (x.t !== y.t || x.deco !== y.deco || x.rCol !== y.rCol || a.zona[q] !== b.zona[q]) difieren++;
  }
  check('dos generaciones con la misma semilla dan celdas y barrios idénticos', difieren === 0, difieren + ' celdas distintas');
  const c = generarCiudad(SEMILLA + 1);
  let distintas = 0;
  for (let q = 0; q < N * N; q++) if (a.C[q].t !== c.C[q].t) distintas++;
  check('otra semilla da otra ciudad (la semilla sí se usa)', distintas > 0);
  check('la generación no depende del orden de las llamadas', generarCiudad(SEMILLA).C[5000].t === a.C[5000].t);
}

console.log('2. Reparto en 9 barrios (zonaDe)');
{
  const city = generarCiudad(SEMILLA);
  check('hay 9 barrios con nombre distinto', ZONAS_NOMBRE.length === 9 && new Set(ZONAS_NOMBRE).size === 9);
  check('BARRIOS tiene la misma longitud que los nombres', BARRIOS.length === ZONAS_NOMBRE.length);
  check('la grilla es de 3 x 3', GRILLA === 3);
  check('el barrio central es Microcentro (índice 4)', ZONA_CENTRO === 4 && ZONAS_NOMBRE[ZONA_CENTRO] === 'Microcentro', ZONAS_NOMBRE[ZONA_CENTRO]);
  check('las esquinas caen en los barrios esperados', zonaDe(0, 0, N) === 0 && zonaDe(N - 1, 0, N) === 2 && zonaDe(0, N - 1, N) === 6 && zonaDe(N - 1, N - 1, N) === 8);
  const cuenta = new Array(9).fill(0);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) cuenta[zonaDe(i, j, N)]++;
  check('zonaDe devuelve los 9 barrios (cada uno aparece)', cuenta.every(n => n > 0), cuenta.join(','));
  check('cada barrio ocupa 44 x 44 celdas (132 / 3)', cuenta.every(n => n === 44 * 44), cuenta.join(','));
  let coincide = true;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (zonaEn(city, i, j) !== zonaDe(i, j, N)) { coincide = false; break; }
  check('city.zona coincide con zonaDe en todas las celdas', coincide);
  let mal = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const z = zonaDe(i, j, N);
    const esperadaCol = Math.floor(i * 3 / N), esperadaFil = Math.floor(j * 3 / N);
    if (z !== esperadaFil * 3 + esperadaCol) mal++;
  }
  check('la regla es fila * 3 + columna', mal === 0, mal + ' celdas');
}

console.log('3. Cada barrio tiene celdas caminables y posición inicial caminable');
{
  const city = generarCiudad(SEMILLA);
  for (let z = 0; z < 9; z++) {
    let caminables = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (zonaDe(i, j, N) === z && walkable(city, i, j)) caminables++;
    check(`barrio ${z} (${ZONAS_NOMBRE[z]}) tiene celdas caminables`, caminables > 0, String(caminables));
    const cen = centroideBarrio(z, N);
    const c = celdaCaminableMasCerca(city, cen.i, cen.j, 60);
    check(`posición inicial de ${ZONAS_NOMBRE[z]} es caminable y está en su barrio`,
      !!c && walkable(city, c.i, c.j) && zonaEn(city, c.i, c.j) === z, JSON.stringify(c));
  }
}

console.log('4. Cámara: giro de 45 grados y vuelta al inicio');
{
  const cam = crearCamara();
  cam.w = 800; cam.h = 600;
  check('la vista empieza sin giro', cam.rot === 0);
  for (let k = 0; k < 8; k++) girarPor(cam, 1);
  check('8 pasos de 45 grados (360) vuelven al inicio', mismoAngulo(cam.rot, 0), String(cam.rot));
  girarPor(cam, -1);
  check('un paso a la izquierda desde 0 queda en 315 grados', mismoAngulo(cam.rot, 7 * PASO_ROT), String(cam.rot));
  for (let k = 0; k < 7; k++) girarPor(cam, -1);   // ya hubo un paso a la izquierda: 8 en total
  check('8 pasos a la izquierda también vuelven al inicio', mismoAngulo(cam.rot, 0), String(cam.rot));
  cam.x = 30; cam.y = 40; cam.zoom = 28;
  for (let k = 0; k < 3; k++) girarPor(cam, 1);
  const [sx, sy] = aPantalla(cam, 33.7, 38.2);
  const [mx, my] = aMundo(cam, sx, sy);
  check('aMundo invierte aPantalla con giro', Math.abs(mx - 33.7) < 1e-9 && Math.abs(my - 38.2) < 1e-9, mx + ',' + my);
  cam.rot = 0;
  const [px, py] = aPantalla(cam, 33, 41);
  check('sin giro, la celda (33, 41) cae a (+3, +1) celdas del centro', Math.abs(px - (400 + 3 * 28)) < 1e-9 && Math.abs(py - (300 + 28)) < 1e-9, px + ',' + py);
}

console.log('');
console.log(fallos === 0 ? `TODAS LAS PRUEBAS OK (${pasos})` : `FALLARON ${fallos} de ${pasos}`);
process.exit(fallos === 0 ? 0 : 1);
