// Productos de la 2D: precio, demanda, estrellas de la pantalla Mercadería, nombres y orden de desbloqueo.
// Origen: 3D (`../index.html`): PRECIOS, DEMANDA, ORDEN_DESBLOQUEO, PRODUCTOS y los data-dem de #ventaMerc. Sin DOM.

// $ por unidad (precio de venta). Calibración de la 3D (2026-11-20), redondeada a $10. ESTIMACIONES SIN VERIFICAR:
//  - figuritas 290: sobre oficial de 7 figuritas a $2.000 (medios de abril-mayo 2026).
//  - empanadas 2000: docena mediana CABA ~$22.000 (dato municipal citado en feb 2026) y unidad de calidad $2.500-3.000.
//  - medias 5000: pack de 3 pares térmicas a $16.100 en Mercado Libre = ~$5.370/par.
//  - paltas 1000: kilo minorista $4.600-5.600; se asume ~200 g por unidad.
//  - churros 1500: Tortoni (mayo 2025) chocolate con 3 churros $11.500, descontando la bebida.
export const PRECIOS = { medias: 5000, empanadas: 2000, churros: 1500, figuritas: 290, paltas: 1000 };

// Multiplica el peso de "comprar" en las reacciones de los peatones (peatones.js), junto con el momento del día (jornada.js).
export const DEMANDA = { medias: 1, empanadas: 1.2, churros: 1.2, figuritas: 0.9, paltas: 0.8 };

// Estrellas de demanda que muestra la tarjeta (data-dem de la 3D: 1 a 5).
export const ESTRELLAS = { medias: 3, empanadas: 4, churros: 4, figuritas: 3, paltas: 2 };

// Desbloqueo por ronda: ronda 1 = primer producto, ronda 2 = segundo, etc.
export const ORDEN_DESBLOQUEO = ['figuritas', 'churros', 'empanadas', 'medias', 'paltas'];
export const PRODUCTO_INICIAL = ORDEN_DESBLOQUEO[0];

// Nombres para mostrar (la 3D usa los mismos en PRODUCTOS).
export const NOMBRE_PRODUCTO = { medias: 'Medias', empanadas: 'Empanadas', churros: 'Churros', figuritas: 'Figuritas', paltas: 'Paltas' };

export const PRODUCTOS = Object.keys(PRECIOS);
