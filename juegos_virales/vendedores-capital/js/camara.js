// Cámara ortogonal cenital: sigue al jugador con suavizado, zoom con rueda y rotación de la vista en pasos de 45 grados
// (Q y R, o botones en pantalla). Sin DOM salvo el canvas que recibe el zoom.
// zoom = píxeles de pantalla por celda. rot = giro de la vista en radianes, en [0, 2π).
// Convención: con rot = 0, +x va a la derecha y +z (y de la grilla) va hacia abajo. Con rot > 0 la vista gira en sentido horario.
export const ZOOM_MIN = 10, ZOOM_MAX = 60, ZOOM_INI = 28;
export const PASO_ROT = Math.PI / 4;   // 45 grados por pulsación

const TAU = Math.PI * 2;
const normRot = a => ((a % TAU) + TAU) % TAU;

export function crearCamara() {
  return { x: 0, y: 0, zoom: ZOOM_INI, w: 800, h: 600, rot: 0 };
}

// Acerca o aleja (factor > 1 acerca). Se limita a [ZOOM_MIN, ZOOM_MAX].
export function zoomPor(cam, factor) {
  cam.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, cam.zoom * factor));
}

// Gira la vista `pasos` veces de 45 grados (negativo = izquierda, positivo = derecha).
export function girarPor(cam, pasos) {
  cam.rot = normRot(cam.rot + pasos * PASO_ROT);
}

// Sigue el punto (px, py) con suavizado exponencial; con snap=true va directo (al empezar o reiniciar).
export function seguir(cam, px, py, dt, snap = false) {
  if (snap) { cam.x = px; cam.y = py; return; }
  const k = 1 - Math.exp(-dt * 8);
  cam.x += (px - cam.x) * k;
  cam.y += (py - cam.y) * k;
}

// Conversión de celdas a píxeles de pantalla y viceversa, con la rotación de la vista.
export const aPantalla = (cam, x, y) => {
  const c = Math.cos(cam.rot), s = Math.sin(cam.rot), dx = x - cam.x, dy = y - cam.y;
  return [(dx * c - dy * s) * cam.zoom + cam.w / 2, (dx * s + dy * c) * cam.zoom + cam.h / 2];
};
export const aMundo = (cam, sx, sy) => {
  const c = Math.cos(cam.rot), s = Math.sin(cam.rot);
  const rx = (sx - cam.w / 2) / cam.zoom, ry = (sy - cam.h / 2) / cam.zoom;
  return [cam.x + rx * c + ry * s, cam.y - rx * s + ry * c];
};

// Vector de dirección (fx, fz) en celdas, girado a la vista: devuelve el vector en píxeles de pantalla (sin escala).
export const dirPantalla = (cam, fx, fz) => {
  const c = Math.cos(cam.rot), s = Math.sin(cam.rot);
  return [fx * c - fz * s, fx * s + fz * c];
};

// Rectángulo visible en celdas (círculo que contiene la pantalla, con margen de r + 2 celdas), para no dibujar fuera de pantalla.
export function visible(cam, x, z, r = 0) {
  const R = Math.hypot(cam.w, cam.h) / cam.zoom / 2 + r + 2;
  return Math.hypot(x - cam.x, z - cam.y) <= R;
}
