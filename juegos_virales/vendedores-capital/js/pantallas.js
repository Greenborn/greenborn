// Router de pantallas (overlays del DOM de index.html). Sin lógica de juego.
// Cada pantalla se identifica por nombre y apunta al id de su overlay.
// Para agregar una pantalla: sumarla a PANTALLAS y usar mostrar(nombre) / ocultar(nombre).
// irA(destino, cuando, paso) cambia de pantalla con un fundido corto (#fundido) y actualiza la nav de pasos (#pasos).

const PANTALLAS = {
  aviso: 'pantallaAviso',
  titulo: 'pantallaTitulo',
  personaje: 'pantallaPersonaje',
  mercaderia: 'pantallaMercaderia',
  seleccion: 'pantallaSeleccion',
  mejoras: 'pantallaMejoras',
  opciones: 'pantallaOpciones',
  ayuda: 'pantallaAyuda',
  pausa: 'pantallaPausa',
  fin: 'pantallaFin',
};

const FUNDIDO_MS = 230;   // duración del fundido a negro (coincide con la transición de juego2d.css)
let navegando = false;

const el = nombre => {
  const id = PANTALLAS[nombre];
  if (!id) throw new Error('Pantalla desconocida: ' + nombre);
  return document.getElementById(id);
};

// Muestra la pantalla indicada (quita el atributo hidden).
export function mostrar(nombre) {
  el(nombre).hidden = false;
}

// Oculta la pantalla indicada (pone el atributo hidden).
export function ocultar(nombre) {
  el(nombre).hidden = true;
}

export function estaVisible(nombre) {
  return !el(nombre).hidden;
}

// Oculta todos los overlays del router.
export function ocultarTodas() {
  for (const nombre of Object.keys(PANTALLAS)) ocultar(nombre);
}

// Nav de pasos (1 Personaje, 2 Mercadería, 3 ¡A vender!). paso = 'personaje' | 'venta' | 'mapa' | null (oculta).
export function pasoNav(paso) {
  const nav = document.getElementById('pasos');
  if (!nav) return;
  nav.hidden = !paso;
  nav.querySelectorAll('[data-paso]').forEach(s => s.classList.toggle('on', s.dataset.paso === paso));
}

const sinMovimiento = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

// Cambia de pantalla: fundido, oculta los overlays, corre `cuando` (si hay) y muestra `destino` (null = sin overlay, el juego).
// Mientras hay un cambio en curso, las llamadas nuevas se ignoran.
export function irA(destino, cuando, paso = null) {
  if (navegando) return;
  const cambiar = () => {
    ocultarTodas();
    if (cuando) cuando();
    pasoNav(paso);
    if (destino) mostrar(destino);
  };
  if (sinMovimiento()) { cambiar(); return; }
  navegando = true;
  const f = document.getElementById('fundido');
  f.classList.add('on');
  setTimeout(() => { cambiar(); f.classList.remove('on'); navegando = false; }, FUNDIDO_MS);
}
