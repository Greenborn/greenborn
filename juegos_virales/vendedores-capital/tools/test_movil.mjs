// Pruebas headless de la experiencia móvil (sin DOM): joystick, asignación de dedos, orientación y alto visible.
// Uso: node 2d/tools/test_movil.mjs
import { vectorJoystick, enZonaJoystick, centroFlotante, crearAsignador } from '../js/controles.js';
import { medidasVisibles, variablesViewport, decidirVertical, dprLimitado, validarPrefs, esIOS, PREFS_MOVIL_DEFECTO } from '../js/viewport.js';

let fallos = 0;
function check(nombre, cond, extra = '') {
  if (cond) console.log('  ok   - ' + nombre);
  else { fallos++; console.log('  FALLA - ' + nombre + (extra ? ' (' + extra + ')' : '')); }
}
const cerca = (a, b, e = 1e-6) => Math.abs(a - b) < e;

console.log('Joystick');
let v = vectorJoystick(0.1 * 50, 0, 50);
check('dentro de la zona muerta da 0', v.vx === 0 && v.vy === 0);
v = vectorJoystick(0.12 * 50, 0, 50);
check('en el borde de la zona muerta da 0', cerca(v.vx, 0));
v = vectorJoystick(200, 0, 50);
check('fuera del radio se limita a 1', cerca(Math.hypot(v.vx, v.vy), 1) && cerca(v.kx, 50));
v = vectorJoystick(30, 40, 50);
check('en el borde exacto la magnitud es 1', cerca(Math.hypot(v.vx, v.vy), 1));
check('conserva la dirección', cerca(v.vx / v.vy, 30 / 40));
v = vectorJoystick(0, -0.335 * 50, 50);
check('entre la zona muerta y el pleno escala lineal', cerca(v.vy, -0.5, 1e-3), v.vy);
v = vectorJoystick(0, -0.6 * 50, 50);
check('pasado el 55 % del radio camina a velocidad plena', cerca(v.vy, -1), v.vy);
v = vectorJoystick(0, 0, 0);
check('radio 0 no da NaN', v.vx === 0 && v.vy === 0);

console.log('Zona del joystick flotante');
check('cuarto inferior izquierdo entra', enZonaJoystick(100, 300, 640, 360));
check('mitad derecha no entra', !enZonaJoystick(400, 300, 640, 360));
check('mitad superior no entra', !enZonaJoystick(100, 100, 640, 360));
let c = centroFlotante(5, 355, 60, 640, 360);
check('flotante: la base entra entera (esquina)', c.x === 68 && c.y === 292, JSON.stringify(c));
c = centroFlotante(200, 250, 60, 640, 360);
check('flotante: lejos del borde, centro en el dedo', c.x === 200 && c.y === 250);

console.log('Asignación de dedos');
const a = crearAsignador(['joy']);
check('primer dedo toma el joystick', a.tomar(1, 'joy'));
check('segundo dedo no toma el joystick ocupado', !a.tomar(2, 'joy'));
check('segundo dedo toma Ofrecer a la vez (multitoque)', a.tomar(2, 'btnOfrecer'));
check('tercer dedo también en Ofrecer', a.tomar(3, 'btnOfrecer') && a.dedos('btnOfrecer').length === 2);
check('un dedo no toma dos controles', !a.tomar(2, 'btnCorrer'));
check('de(id) devuelve el control', a.de(1) === 'joy' && a.de(9) === null);
check('soltar libera el joystick', a.soltar(1) === 'joy' && a.tomar(4, 'joy'));
a.limpiar();
check('limpiar suelta todo', a.tamano === 0);

console.log('Orientación');
check('táctil vertical muestra la capa', decidirVertical({ tactil: true, ancho: 360, alto: 640 }));
check('táctil vertical 412x915', decidirVertical({ tactil: true, ancho: 412, alto: 915 }));
for (const [w, h] of [[568, 320], [640, 360], [732, 412], [760, 360], [800, 360], [854, 480], [915, 412], [960, 540], [1280, 720]])
  check(`apaisado ${w}x${h} sin capa`, !decidirVertical({ tactil: true, ancho: w, alto: h }));
check('escritorio nunca muestra la capa', !decidirVertical({ tactil: false, ancho: 360, alto: 640 }));
check('casi cuadrado no se traba en vertical', !decidirVertical({ tactil: true, ancho: 600, alto: 620 }));

console.log('Alto visible');
let m = medidasVisibles({ innerWidth: 640, innerHeight: 360, vv: { width: 640, height: 300 } });
check('visualViewport manda sobre innerHeight', m.alto === 300 && m.ancho === 640);
m = medidasVisibles({ innerWidth: 640, innerHeight: 360, vv: null });
check('sin visualViewport usa innerHeight', m.alto === 360);
check('nunca menos de 1', medidasVisibles({}).alto === 1);
let vars = variablesViewport({ ancho: 640, alto: 360 });
check('--alto-visible en px', vars['--alto-visible'] === '360px');
check('--vh-real es 1 %', vars['--vh-real'] === '3.60px');
check('escala 0.8 en 320 de alto', variablesViewport({ ancho: 568, alto: 320 })['--ui-escala'] === '0.800');
check('escala 1 desde 540 de alto', variablesViewport({ ancho: 960, alto: 540 })['--ui-escala'] === '1.000');

console.log('Calidad y preferencias');
check('DPR limitado a 2', dprLimitado(3.5) === 2);
check('DPR baja = 1', dprLimitado(3, 'baja') === 1);
check('DPR inválido = 1', dprLimitado(NaN) === 1);
check('prefs inválidas vuelven a defecto', JSON.stringify(validarPrefs({ joystick: 'x', vibrar: 'si', calidad: 3 })) === JSON.stringify(PREFS_MOVIL_DEFECTO));
check('prefs válidas se respetan', validarPrefs({ joystick: 'fijo', vibrar: false, calidad: 'baja' }).joystick === 'fijo');
check('iOS detectado', esIOS('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)') && esIOS('', 'MacIntel', 5) && !esIOS('Android', 'Linux', 5));

console.log(fallos ? `\n${fallos} fallas` : '\nTodo ok');
process.exit(fallos ? 1 : 0);
