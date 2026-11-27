// Pruebas headless de busqueda.js y vehiculos.js (sin navegador). Uso: node 2d/tools/test_busqueda.mjs
import {
  BUSQ_MAX, BUSQ_CD, crearBusqueda, sumarEstrella, respuesta, safarParams, ptsEscapeMult, stepBusqueda, perderEstrellas,
  hudEstrellas, indiceEsquinas, esquinasCerca, esquinasDeCruces, asignarPerseguidores,
} from '../js/busqueda.js';
import {
  rutaCalle, calleCerca, crearPatrulla, stepPatrulla, crearHeli, stepHeli, HELI_R, HELI_T_ESCENA, VEH_VEL_RECTA,
} from '../js/vehiculos.js';
import { generarCiudad, walkable, N, CICLO, MANZANA } from '../js/ciudad.js';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}

console.log('1. Estrellas');
{
  const b = crearBusqueda();
  check('empieza en 0', b.nivel === 0);
  check('venta vista suma 1', sumarEstrella(b, 'venta', 0) && b.nivel === 1);
  check('misma venta en el mismo instante no suma', !sumarEstrella(b, 'venta', 0.5) && b.nivel === 1);
  check('otro motivo sí suma', sumarEstrella(b, 'corrida', 0.5) && b.nivel === 2);
  check('pasado el cooldown vuelve a sumar', sumarEstrella(b, 'venta', BUSQ_CD) && b.nivel === 3);
  check('motivo desconocido no suma', !sumarEstrella(b, 'otro', 10));
  for (let t = 10; t < 40; t += BUSQ_CD) sumarEstrella(b, 'venta', t);
  check('tope 5', b.nivel === BUSQ_MAX);
  check('HUD: 5 encendidas', hudEstrellas(b, 40).encendidas === 5 && hudEstrellas(b, 40).total === 5);
  check('HUD parpadea justo al subir', hudEstrellas(b, b.tSubida + 0.1).parpadea && !hudEstrellas(b, b.tSubida + 5).parpadea);
}

console.log('2. Respuesta por nivel');
{
  check('1: 1 agente', respuesta(1).agentes === 1 && respuesta(1).patrullas === 0 && !respuesta(1).heli);
  check('2: 2 agentes', respuesta(2).agentes === 2 && respuesta(2).patrullas === 0);
  check('3: 4 agentes y 1 patrulla', respuesta(3).agentes === 4 && respuesta(3).patrullas === 1 && !respuesta(3).heli);
  check('4: 4 agentes y 2 patrullas', respuesta(4).agentes === 4 && respuesta(4).patrullas === 2 && !respuesta(4).heli);
  check('5: más helicóptero', respuesta(5).agentes === 4 && respuesta(5).patrullas === 2 && respuesta(5).heli);
  check('fuera de rango se acota', respuesta(9).heli && respuesta(-1).agentes === 0);
  check('puntos por zafar x nivel', ptsEscapeMult(1) === 1 && ptsEscapeMult(3) === 2 && ptsEscapeMult(5) === 3);
}

console.log('3. Zafar escalado');
{
  const s1 = safarParams(1, 5, 12), s5 = safarParams(5, 5, 12);
  check('nivel 1 = base', s1.tPerder === 5 && s1.dist === 12);
  check('nivel 5 cuesta más', s5.tPerder > s1.tPerder && s5.dist > s1.dist, JSON.stringify(s5));
  const b = crearBusqueda(); sumarEstrella(b, 'venta', 0);
  let r = null;
  for (let t = 0; t < 4.9 && !r; t += 0.1) r = stepBusqueda(b, 0.1, { visto: false, dMin: 20 }, 5, 12);
  check('antes de tPerder no zafa', r === null && b.nivel === 1);
  for (let t = 0; t < 1 && !r; t += 0.1) r = stepBusqueda(b, 0.1, { visto: false, dMin: 20 }, 5, 12);
  check('zafa y vuelve a 0', r?.evento === 'zafe' && r.nivel === 1 && b.nivel === 0);
  const h = crearBusqueda(); sumarEstrella(h, 'venta', 0);
  let rh = null;
  for (let t = 0; t < 20 && !rh; t += 0.1) rh = stepBusqueda(h, 0.1, { visto: false, dMin: 20, heliVe: true }, 5, 12);
  check('en el círculo del helicóptero no zafa', rh === null && h.nivel === 1);
  let rc = null;
  for (let t = 0; t < 20 && !rc; t += 0.1) rc = stepBusqueda(h, 0.1, { visto: false, dMin: 8 }, 5, 12);
  check('cerca de un perseguidor no zafa', rc === null);
  perderEstrellas(h);
  check('captura: perderEstrellas deja 0', h.nivel === 0);
}

console.log('4. Activación por cercanía');
{
  const city = generarCiudad();
  const esq = esquinasDeCruces(city, CICLO, MANZANA, walkable);
  check('una esquina por cruce interior (5 x 5)', esq.length === 25, String(esq.length));
  check('todas caminables', esq.every(e => walkable(city, Math.floor(e.x), Math.floor(e.z))));
  const idx = indiceEsquinas(esq);
  const cerca = esquinasCerca(idx, 66, 66, 30, 100);
  const bruto = esq.map((e, i) => [i, Math.hypot(e.x - 66, e.z - 66)]).filter(e => e[1] <= 30).map(e => e[0]);
  check('consulta por cubetas = fuerza bruta', cerca.length === bruto.length && bruto.every(i => cerca.includes(i)), cerca.length + ' vs ' + bruto.length);
  check('ordenadas por distancia', cerca.every((i, k) => k === 0 || Math.hypot(esq[i].x - 66, esq[i].z - 66) >= Math.hypot(esq[cerca[k - 1]].x - 66, esq[cerca[k - 1]].z - 66)));
  check('respeta el tope', esquinasCerca(idx, 66, 66, 200, 5).length === 5);
  // Muchas esquinas (mapa grande): la consulta solo mira las cubetas vecinas.
  const muchas = []; for (let j = 0; j < 60; j++) for (let i = 0; i < 60; i++) muchas.push({ x: i * 10, z: j * 10 });
  const t0 = process.hrtime.bigint();
  for (let k = 0; k < 1000; k++) esquinasCerca(indiceEsquinas.cache ??= indiceEsquinas(muchas), 300, 300, 40, 24);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  check('3600 esquinas: 1000 consultas en menos de 300 ms', ms < 300, ms.toFixed(1) + ' ms');
  const ags = [{ x: 0, z: 0, estado: 'patrulla' }, { x: 5, z: 0, estado: 'patrulla' }, { x: 1, z: 0, estado: 'persecucion' }];
  const asig = asignarPerseguidores(ags, { x: 6, z: 0 }, 2);
  check('asigna el más cercano que falta', asig.length === 1 && asig[0] === ags[1]);
  check('si ya hay suficientes no asigna', asignarPerseguidores(ags, { x: 0, z: 0 }, 1).length === 0);
}

console.log('5. Patrulla y helicóptero');
{
  const city = generarCiudad();
  const a = calleCerca(city, 21, 5), b = calleCerca(city, 21, 120);
  const r = rutaCalle(city, a, b);
  check('ruta por calles existe', !!r && r.length > 50);
  check('la ruta solo pisa calles', r.every(c => city.C[c.j * N + c.i].t === 'road'));
  const v = crearPatrulla(city, 21, 10);
  check('la patrulla nace en la calle', city.C[Math.floor(v.z) * N + Math.floor(v.x)].t === 'road');
  const pl = { px: 21.5, py: 60.5, heading: 0 };
  let nunca = true, z0 = v.z;
  for (let t = 0; t < 2; t += 0.05) { stepPatrulla(v, city, pl, 0.05); if (city.C[Math.floor(v.z) * N + Math.floor(v.x)].t !== 'road') nunca = false; }
  check('nunca sale de la calle', nunca);
  check('en recta va más rápido que un agente a pie (5.5)', (v.z - z0) / 2 > 5.5, ((v.z - z0) / 2).toFixed(2));
  check('no supera VEH_VEL_RECTA', (v.z - z0) / 2 <= VEH_VEL_RECTA + 1e-6);
  // Giro: ruta en L, mide la demora.
  const g = crearPatrulla(city, 21, 40); let giros = 0;
  for (let t = 0; t < 4; t += 0.05) { stepPatrulla(g, city, { px: 60.5, py: 42.5, heading: Math.PI / 2 }, 0.05); if (g.tGiro > 0) giros++; }
  check('al girar baja la velocidad (tGiro activo)', giros > 0);
  let cap = false;
  const c = crearPatrulla(city, 21, 50);
  for (let t = 0; t < 6 && !cap; t += 0.05) cap = stepPatrulla(c, city, { px: 21.5, py: 56.5, heading: Math.PI }, 0.05).captura;
  check('jugador quieto en la calle: la patrulla lo alcanza', cap);
  const vr = crearPatrulla(city, 21, 50); let capV = false;
  for (let t = 0; t < 6 && !capV; t += 0.05) capV = stepPatrulla(vr, city, { px: 19.5, py: 56.5, heading: 0 }, 0.05).captura;
  check('jugador en la vereda: la patrulla no captura', !capV);
  const h = crearHeli(0, 0);
  check('lejos: el helicóptero no ve', !stepHeli(h, { px: 50, py: 0 }, 0.01));
  for (let t = 0; t < 10; t += 0.1) stepHeli(h, { px: 50, py: 0 }, 0.1);
  check('se acerca y te ve', h.ve);
  const pl2 = { px: 50, py: 0 };
  for (let t = 0; t < 8; t += 0.1) { pl2.px += 7.5 * 0.1; stepHeli(h, pl2, 0.1); }
  const h2 = crearHeli(0, 0);
  for (let t = 0; t < HELI_T_ESCENA + 1; t += 0.5) stepHeli(h2, { px: 0, py: 0 }, 0.5);
  check('se retira a los HELI_T_ESCENA s', !h2.activo && !h2.ve);
  check('corriendo se sale del círculo', !h.ve, Math.hypot(pl2.px - h.x, pl2.py - h.z).toFixed(1) + ' > ' + HELI_R);
}

console.log(`\n${pasos - fallos}/${pasos} ok`);
process.exit(fallos ? 1 : 0);
