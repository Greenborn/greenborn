// Textos de burbujas y tabla de reacciones de los peatones al ofrecer (2D).
// Origen: 3D (`../index.html`). La reacción 'llamado' reemplaza a la de la 3D que usa la palabra prohibida.

// Peso relativo (se normaliza); 'n' = unidades que compra; 'demanda' = el peso de compra se multiplica por DEMANDA del producto
// activo y por el momento del día (peatones.js).
export const REACCIONES = [
  { id: 'ignorar', peso: 30 },
  { id: 'comprar1', peso: 20, n: 1, demanda: true },
  { id: 'comprar2', peso: 8, n: 2, demanda: true },
  { id: 'insultar', peso: 14 },
  { id: 'cortes', peso: 20 },
  { id: 'llamado', peso: 8 },
];

// Frases de las burbujas por tipo de reacción.
export const TEXTOS = {
  insultar: ['😠 ¡Dejame en paz!', '😠 ¡Salí de acá!', '😠 ¡Qué pesado!'],
  cortes: ['🙂 No, gracias', '🙂 Hoy no, gracias', '🙂 Quizás otro día'],
  llamado: ['📞 ¡Ya avisé, no te muevas!'],
  compra: ['🛒 ¡Lo llevo!', '🛒 Dame dos'],
};

// Textos de la pantalla Mercadería (#pantallaMercaderia) y Mejoras (#pantallaMejoras). Origen: 3D (#ventaMerc, #ventaMej).
export const TEXTOS_VENTA = {
  titulo: '¿Qué vas a vender?',
  ayuda: 'Elegí un producto para salir a la calle. Más estrellas = más gente quiere comprarlo.',
  reponer: 'Reponer y salir a la calle',
  reiniciar: 'Reiniciar',
  volverPersonaje: '← Volver al personaje',
  irMejoras: 'Mejoras del vendedor →',
  volverMercaderia: '← Volver a la mercadería',
  tituloMejoras: 'Mejoras del vendedor',
  ayudaMejoras: 'Se conservan entre rondas; se reinician al empezar una partida nueva.',
  avisoSinFondos: 'No te alcanza para el gasto fijo y una unidad de mercadería. Empezás de cero con la caja inicial.',
  avisoElegir: 'Elegí cuánto comprar de al menos un producto desbloqueado.',
};

// Nombre y descripción de cada mejora (botón de la pantalla Mejoras). Claves = MEJORAS de economia.js.
export const MEJORAS_TEXTO = {
  carrito: { nombre: 'Carrito', desc: 'Aumenta la cantidad máxima de unidades (+2 y +5) y la variedad: de 1 tipo de producto a 2 y 3.' },
  alcance: { nombre: 'Alcance de ofrecer', desc: 'Ofrecés a más distancia.' },
  velocidad: { nombre: 'Velocidad al correr', desc: 'Corrés más rápido para escapar.' },
  resistencia: { nombre: 'Resistencia (energía)', desc: 'La energía dura más al correr.' },
  proveedores: { nombre: 'Conocimiento de proveedores', desc: 'Todas las compras salen más baratas (−10 % y −20 %).' },
};

// Título y texto de motivo de la pantalla de fin, por motivo de finPartida (main.js).
export const MOTIVOS_FIN = {
  capturado: ['¡Te atraparon!', 'Te quitaron la mercadería.'],
  sin_fondos: ['Sin fondos para reponer', 'No te alcanza para el gasto fijo y una unidad de mercadería. Se acabó la partida.'],
};
