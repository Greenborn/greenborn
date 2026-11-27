// Pruebas headless de personaje.js (sin navegador ni DOM). Uso: node 2d/tools/test_personaje.mjs
// Valores por defecto válidos, "Al azar" siempre válido con un generador inyectado, validación que rechaza valores inválidos,
// frames de tamaño fijo, vista según el heading y persistencia con storage simulado (incluida la clave corrupta).
import {
  CLAVE_PERSONAJE, ANCHO_SPRITE, ALTO_SPRITE, CUADROS, OPCIONES_PERSONAJE, PERSONAJE_DEFECTO,
  personajeValido, completarPersonaje, personajeAlAzar, vistaDesde, spriteJugador, cargarPersonaje, guardarPersonaje,
} from '../js/personaje.js';

let fallos = 0, pasos = 0;
function check(nombre, cond, extra = '') {
  pasos++;
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}

// Storage simulado con la misma interfaz que localStorage.
function storageSim(inicial = {}) {
  const m = new Map(Object.entries(inicial));
  return {
    m,
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
  };
}
const storageRoto = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };

// Generador determinista (LCG) para las pruebas de "Al azar".
function rngSemilla(s) {
  let x = s >>> 0;
  return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; };
}

const HEX = /^#[0-9a-f]{6}$/;

console.log('1. Valores por defecto');
{
  check('el personaje por defecto es válido', personajeValido(PERSONAJE_DEFECTO));
  check('completar(null) devuelve el personaje por defecto', JSON.stringify(completarPersonaje(null)) === JSON.stringify(PERSONAJE_DEFECTO));
  check('completar no modifica el objeto por defecto', completarPersonaje({ accesorio: 'gorra' }) !== PERSONAJE_DEFECTO && PERSONAJE_DEFECTO.accesorio === 'ninguno');
  const cats = Object.keys(OPCIONES_PERSONAJE).sort().join(',');
  check('hay categorías de piel, pelo, ropa, accesorio y calzado', cats === 'accesorio,calzado,peloColor,peloEstilo,piel,ropa', cats);
  check('las opciones de color son hex válidos', ['piel', 'peloColor', 'ropa', 'calzado'].every(k => OPCIONES_PERSONAJE[k].every(c => HEX.test(c))));
  check('los accesorios son sin accesorio, gorra y lentes', OPCIONES_PERSONAJE.accesorio.join() === 'ninguno,gorra,lentes');
}

console.log('2. Al azar');
{
  let todosValidos = true;
  for (let s = 1; s <= 300; s++) if (!personajeValido(personajeAlAzar(rngSemilla(s)))) { todosValidos = false; break; }
  check('300 semillas dan personajes válidos', todosValidos);
  check('rng que devuelve 0 elige la primera opción', JSON.stringify(personajeAlAzar(() => 0)) === JSON.stringify(Object.fromEntries(Object.keys(OPCIONES_PERSONAJE).map(k => [k, OPCIONES_PERSONAJE[k][0]]))));
  check('rng que devuelve casi 1 elige la última opción', personajeAlAzar(() => 0.999999).ropa === OPCIONES_PERSONAJE.ropa.at(-1));
  check('rng que devuelve NaN igual da un personaje válido', personajeValido(personajeAlAzar(() => NaN)));
  check('rng que devuelve fuera de rango igual da un personaje válido', personajeValido(personajeAlAzar(() => 7)) && personajeValido(personajeAlAzar(() => -3)));
  check('rng que lanza error: el error no se traga en silencio pero el resto del personaje sigue siendo válido con defecto', (() => { try { personajeAlAzar(() => { throw new Error('x'); }); return false; } catch (e) { return personajeValido(completarPersonaje(null)); } })());
}

console.log('3. Validación');
{
  check('null no es válido', !personajeValido(null));
  check('un número no es válido', !personajeValido(5));
  check('un objeto vacío no es válido', !personajeValido({}));
  check('un color fuera de la lista no es válido', !personajeValido({ ...PERSONAJE_DEFECTO, piel: '#000000' }));
  check('un estilo de pelo desconocido no es válido', !personajeValido({ ...PERSONAJE_DEFECTO, peloEstilo: 'afro' }));
  check('un accesorio desconocido no es válido', !personajeValido({ ...PERSONAJE_DEFECTO, accesorio: 'sombrero' }));
  check('un valor no string no es válido', !personajeValido({ ...PERSONAJE_DEFECTO, calzado: 3 }));
  const mezcla = completarPersonaje({ piel: '#nope', accesorio: 'lentes', ropa: 42 });
  check('completar conserva lo válido y reemplaza lo inválido', mezcla.accesorio === 'lentes' && mezcla.piel === PERSONAJE_DEFECTO.piel && mezcla.ropa === PERSONAJE_DEFECTO.ropa);
  check('completar produce un personaje válido', personajeValido(mezcla));
}

console.log('4. Frames del sprite');
{
  const personajes = [
    PERSONAJE_DEFECTO,
    { piel: '#4a2c17', peloColor: '#c9a227', peloEstilo: 'largo', ropa: '#ecf0f1', accesorio: 'gorra', calzado: '#f5f5f5' },
    { piel: '#f6d1b1', peloColor: '#8a8a8a', peloEstilo: 'rapado', ropa: '#8e44ad', accesorio: 'lentes', calzado: '#7b4a2a' },
  ];
  const headings = [0, Math.PI / 2, Math.PI, -Math.PI / 2, 3];
  let dimOk = true, pixOk = true, count = 0;
  for (const p of personajes) for (const h of headings) for (const c of CUADROS) {
    const s = spriteJugador(p, h, c);
    count++;
    if (s.ancho !== ANCHO_SPRITE || s.alto !== ALTO_SPRITE || s.pixeles.length !== ALTO_SPRITE) dimOk = false;
    if (s.pixeles.some(f => f.length !== ANCHO_SPRITE)) dimOk = false;
    for (const f of s.pixeles) for (const px of f) if (px !== null && !HEX.test(px)) pixOk = false;
  }
  check(`todos los frames (${count}) tienen tamaño fijo ${ANCHO_SPRITE}x${ALTO_SPRITE}`, dimOk);
  check('cada píxel es null o un hex #rrggbb', pixOk);
  check('vista de frente con heading 0 y de espaldas con heading PI', vistaDesde(0) === 'frente' && vistaDesde(Math.PI) === 'espalda');
  check('vistaDesde reconoce el lado en un rango de headings', headings.map(vistaDesde).join() === 'frente,frente,espalda,frente,espalda');
  const quieto = JSON.stringify(spriteJugador(PERSONAJE_DEFECTO, 0, 'quieto').pixeles);
  const p1 = JSON.stringify(spriteJugador(PERSONAJE_DEFECTO, 0, 'paso1').pixeles);
  const p2 = JSON.stringify(spriteJugador(PERSONAJE_DEFECTO, 0, 'paso2').pixeles);
  check('los dos cuadros de caminata difieren del quieto y entre sí', quieto !== p1 && p1 !== p2 && quieto !== p2);
  check('un cuadro desconocido se dibuja como quieto', JSON.stringify(spriteJugador(PERSONAJE_DEFECTO, 0, 'salto').pixeles) === quieto);
  const frenteGorra = spriteJugador({ ...PERSONAJE_DEFECTO, accesorio: 'gorra' }, 0).pixeles;
  const espaldaGorra = spriteJugador({ ...PERSONAJE_DEFECTO, accesorio: 'gorra' }, Math.PI).pixeles;
  check('la gorra se dibuja de frente y de espaldas', frenteGorra[0][4] !== null && espaldaGorra[0][4] !== null && frenteGorra[0][4] === espaldaGorra[0][4]);
  const lentes = spriteJugador({ ...PERSONAJE_DEFECTO, accesorio: 'lentes' }, 0).pixeles;
  const sinLentes = spriteJugador(PERSONAJE_DEFECTO, 0).pixeles;
  check('los lentes cambian el rostro de frente', JSON.stringify(lentes[3]) !== JSON.stringify(sinLentes[3]));
  check('los lentes no se ven de espaldas', JSON.stringify(spriteJugador({ ...PERSONAJE_DEFECTO, accesorio: 'lentes' }, Math.PI).pixeles) === JSON.stringify(spriteJugador(PERSONAJE_DEFECTO, Math.PI).pixeles));
  check('la ropa elegida aparece en el torso', spriteJugador({ ...PERSONAJE_DEFECTO, ropa: '#e74c3c' }, 0).pixeles[8][5] === '#e74c3c');
}

console.log('5. Persistencia (storage simulado)');
{
  const vacio = storageSim();
  check('sin clave guardada, carga el personaje por defecto', JSON.stringify(cargarPersonaje(vacio)) === JSON.stringify(PERSONAJE_DEFECTO));
  check('clave con JSON corrupto: carga el personaje por defecto', JSON.stringify(cargarPersonaje(storageSim({ [CLAVE_PERSONAJE]: '{roto' }))) === JSON.stringify(PERSONAJE_DEFECTO));
  check('clave con "null": carga el personaje por defecto', JSON.stringify(cargarPersonaje(storageSim({ [CLAVE_PERSONAJE]: 'null' }))) === JSON.stringify(PERSONAJE_DEFECTO));
  check('clave con un número: carga el personaje por defecto', JSON.stringify(cargarPersonaje(storageSim({ [CLAVE_PERSONAJE]: '17' }))) === JSON.stringify(PERSONAJE_DEFECTO));
  const parcial = cargarPersonaje(storageSim({ [CLAVE_PERSONAJE]: JSON.stringify({ piel: '#c68642', accesorio: 'cosa' }) }));
  check('clave parcial: usa lo válido y completa el resto', parcial.piel === '#c68642' && parcial.accesorio === 'ninguno' && personajeValido(parcial));
  check('storage que falla al leer: no lanza y carga el defecto', JSON.stringify(cargarPersonaje(storageRoto)) === JSON.stringify(PERSONAJE_DEFECTO));
  check('sin storage (null): no lanza y carga el defecto', JSON.stringify(cargarPersonaje(null)) === JSON.stringify(PERSONAJE_DEFECTO));

  const s = storageSim();
  const elegido = { piel: '#8d5524', peloColor: '#b5532a', peloEstilo: 'largo', ropa: '#27ae60', accesorio: 'gorra', calzado: '#2c3e50' };
  check('guardar un personaje válido devuelve true', guardarPersonaje(elegido, s) === true);
  check('se escribe bajo la clave 2d_personaje', s.m.has('2d_personaje') && CLAVE_PERSONAJE === '2d_personaje');
  check('la ida y vuelta conserva el personaje', JSON.stringify(cargarPersonaje(s)) === JSON.stringify(elegido));
  const antes = s.m.get(CLAVE_PERSONAJE);
  check('guardar un personaje inválido devuelve false y no toca lo guardado', guardarPersonaje({ piel: 'x' }, s) === false && s.m.get(CLAVE_PERSONAJE) === antes);
  check('guardar con storage que falla devuelve false sin lanzar', guardarPersonaje(elegido, storageRoto) === false);
  check('guardar y cargar en un storage nuevo tras clave corrupta', (() => { const t = storageSim({ [CLAVE_PERSONAJE]: 'xx' }); guardarPersonaje(elegido, t); return JSON.stringify(cargarPersonaje(t)) === JSON.stringify(elegido); })());
}

console.log(`\nTotal: ${pasos} pruebas, ${fallos} fallas.`);
process.exit(fallos === 0 ? 0 : 1);
