// Constantes de la 2D (jugador, venta, peatones, economía, mejoras y puntaje).
// Origen: copiadas de la 3D (`../index.html`) o definidas para la 2D; ver README, sección "Constantes copiadas de la 3D".
// Se importan desde main.js y economia.js. Los nombres se mantienen para compararlas con la 3D.
// Precios, demanda y productos viven en productos.js; la lógica de economía en economia.js.

// Jugador (celdas/s). Origen 3D: SPEED / RUN_SPEED.
export const SPEED = 4.5, RUN_SPEED = 7.5;

// Venta (ofrecer). Origen 3D: OFR_RADIO, OFR_MED_ANG, OFR_CD, OFR_PAUSA.
// Cono de ofrecer ampliado respecto de la 3D (decisión D8 del plan): base 2.25 celdas y semiángulo 90°.
export const OFR_RADIO = 2.25;                      // alcance base para ofrecer (celdas); la mejora lo sube (ver economia.js radioOfrecer)
export const OFR_RADIO_MAX = 3.75, OFR_PASO = 0.75; // tope del alcance (base + 2 niveles) y aumento por nivel de la mejora Alcance
export const OFR_MED_ANG = 90 * Math.PI / 180;      // semiángulo del cono de ofrecer (180° en total)
export const OFR_CD = 0.6;                          // segundos entre ofrecimientos
export const OFR_PAUSA = 1.5;                       // segundos que se detiene el peatón atendido

// Velocidad y energía al correr. Origen 3D: RUN_PASO_NIVEL, RUN_SPEED_TOPE, ENERGIA_MAX, CONS_*, REC_*, UMBRAL_REINICIO, RESIST_MULT.
export const RUN_PASO_NIVEL = 0.5, RUN_SPEED_TOPE = 8.5;   // mejora de velocidad: +0.5 por nivel, tope 8.5 celdas/s
export const ENERGIA_MAX = 100, CONS_CORRER = 12, CONS_MIN = 5;   // energía, consumo al correr (/s) base y piso (/s)
export const REC_QUIETO = 20, REC_CAMINA = 8, UMBRAL_REINICIO = 30;    // recuperación (/s); agotado hasta llegar a 30
export const REC_DEMORA = 1;          // s sin correr antes de empezar a recuperar
export const CONS_ARRANQUE = 4;       // energía que cuesta cada arranque de carrera
export const RESIST_MULT = [1, 0.8, 0.65, 0.5];     // multiplicador del consumo por nivel de Resistencia (0..3)

// Peatones (2D). PEATONES_N = simultáneos; PEAT_VEL = paso en celdas/s.
export const PEATONES_N = 40, PEAT_VEL = 1.4;

// Peatones: memoria por ronda (peatones.js). Origen 3D: PLAN_MEJORAS.md, "Memoria de peatones e insistencia" (MEM_*).
// Estados: N neutral, I interesado, C compró, M molesto, P no insistir (no elegible), A llamó a los agentes (no elegible).
export const MEM_COMPRA_BASE = 0.30, MEM_COMPRA_DECAY = 0.8, MEM_COMPRA_MIN = 0.05;   // I: compra = base x decay^(k-1), con piso
export const MEM_INSULTO_BASE = 0.05, MEM_INSULTO_PASO = 0.07, MEM_INSULTO_MAX = 0.50; // I: insulto = base + paso x (k-1), con tope
export const MEM_LLAMADO_DESDE = 3, MEM_LLAMADO_PASO = 0.04, MEM_LLAMADO_MAX = 0.12;   // I: llamado desde k = 3
export const MEM_CORTES = 0.20;                                                        // I: cortés fijo
export const MEM_C_COMPRA_BASE = 0.20, MEM_C_COMPRA_DECAY = 0.6, MEM_C_COMPRA_MIN = 0.10; // C: compra extra = base x decay^(kc-1), con piso
export const MEM_C_MAX_COMPRAS = 2, MEM_C_MAX_OFERTAS = 3;                             // C: compras por peatón y ofrecimientos sin compra
export const MEM_M_INSULTO = 0.6, MEM_M_LLAMADO = 0.3, MEM_M_COMPRA = 0.05, MEM_M_MAX_OFERTAS = 2; // M: probabilidades y tope
export const MEM_K_MAX = 8;                                                            // I: ofrecimientos sin compra antes de P
export const MEM_T_OLVIDO = 45;                                                        // s sin contacto: M vuelve a I
// Contagio por insulto. Valores del plan de mejoras (radio 3 celdas, +0.05 de insulto durante 10 s), no el 0.2 propuesto
// como default: el plan los fija, así que se usan esos.
export const PEAT_CONTAGIO_R = 3, PEAT_CONTAGIO_BONO = 0.05, PEAT_CONTAGIO_T = 10;
// Reciclado y aparición de peatones (default propio de la 2D): se reciclan a más de PEAT_LEJOS celdas del jugador;
// los nuevos aparecen a PEAT_SPAWN_MIN..MAX celdas de él.
export const PEAT_LEJOS = 30, PEAT_SPAWN_MIN = 12, PEAT_SPAWN_MAX = 24, PEAT_RECICLO_T = 5;   // PEAT_RECICLO_T: cada cuánto se revisa (s)

// Jornada (jornada.js): duración de la ronda (s) dividida en tres tramos iguales. Default propio de la 2D; la ronda no tiene tope de tiempo.
export const DURACION_RONDA = 120;

// Economía por rondas. Origen 3D: STOCK_BASE/PASO/MAX, COSTO_FRAC, CARRITO_BONO, CAP_MAX, CONOC_DESC.
// Caja inicial, costos de mejoras y desbloqueos están en economia.js.
export const STOCK_BASE = 30, STOCK_PASO = 2, STOCK_MAX = 40;   // tope de stock: 30 en la ronda 1, +2 por ronda, máximo 40
export const COSTO_FRAC = 0.5;                      // costo por unidad = 50 % del precio de venta
export const GASTO_RONDA = 600, GASTO_PASO = 300;   // gasto fijo al reponer: GASTO_RONDA + GASTO_PASO x (ronda - 1), $
export const MEJ_INFLA = 0.15;                      // las mejoras suben: costo x (1 + MEJ_INFLA x (ronda - 1))
export const CARRITO_BONO = [0, 2, 5];              // capacidad extra por nivel de Carrito
export const CAP_MAX = STOCK_MAX + CARRITO_BONO[2]; // tope absoluto de unidades por reposición (45)
export const CONOC_DESC = [0, 0.10, 0.20];          // descuento sobre el costo unitario por nivel de Conocimiento de proveedores

// Puntaje (puntaje.js). Origen 3D: PTS_VENTA, PTS_ESCAPE, PTS_BONUS_SIGILO, PTS_BONUS_TIEMPO, T_BONUS_BASE, T_BONUS_POR_U.
// PTS_VENTA pasa de 50 (F0, propio de la 2D) a 100 por unidad, como la 3D.
export const PTS_VENTA = 100, PTS_ESCAPE = 300, PTS_BONUS_SIGILO = 500, PTS_BONUS_TIEMPO = 500;
// T_BONUS de la ronda = T_BONUS_BASE + T_BONUS_POR_U x unidades compradas en la ronda. El bonus de tiempo baja linealmente de PTS_BONUS_TIEMPO a 0 en ese tiempo.
export const T_BONUS_BASE = 120, T_BONUS_POR_U = 6;
// El bonus de tiempo máximo crece con la ronda: PTS_BONUS_TIEMPO x (1 + BONUS_TIEMPO_ESCALA x (ronda - 1)).
export const BONUS_TIEMPO_ESCALA = 0.25;
// Medallas: puntaje mínimo de cada una (medalla() en puntaje.js). Origen 3D: medalla() en js/ui.js.
export const MEDALLA_MIN = { bronce: 8000, plata: 20000, oro: 40000 };

// Opciones de la pantalla Opciones (clave guardada -> valor). Ver ajustes.js.
// zoom: píxeles por celda al empezar una partida (medio = ZOOM_INI de camara.js).
export const ZOOM_OPCIONES = { cerca: 40, medio: 28, lejos: 16 };
// distancia: solo se guarda por ahora (sin efecto en el render).
export const DISTANCIA_OPCIONES = ['corta', 'media', 'larga'];
// fps: límite de cuadros por segundo del bucle de main.js.
export const FPS_OPCIONES = [30, 45, 60];
export const CONTROLES_OPCIONES = ['joystick', 'flechas'];   // controles en pantalla en táctil: joystick (defecto) o pad de flechas

// Coima al capturar (coima.js). Origen 3D: COIMA_FRAC, COIMA_ACEPTA, COIMA_CD (defaults de la 3D).
// modo 'dinero': paga COIMA_FRAC del valor de la mercadería, limitado al dinero de la ronda.
// opción 'producto': entrega la mitad del stock del producto activo, ceil(stock / 2), siempre queda 1. El jugador elige en el diálogo.
export const COIMA_FRAC = 0.6, COIMA_ACEPTA = 0.55, COIMA_CD = 8;
export const COIMA_DECAE = 0.6;       // la aceptación se multiplica por esto con cada coima aceptada en la partida
export const COIMA_CIEGO = 10;       // s tras una coima aceptada en los que los agentes y las patrullas no te ven
export const COIMA_MIN = 500;         // modo dinero: sin al menos $500 para pagar no hay coima

// Modelos visuales y marcas en el canvas (render.js, G23, G24, G35). Colores en hex, como el resto de config.js.
// Agentes: chaleco del color de su estado (mismo código de colores que la 3D) y gorra oscura sobre la cabeza.
export const AG_COL = { patrulla: '#ffd33b', regreso: '#ffd33b', alerta: '#ff912b', persecucion: '#e03030', distraido: '#a9adb8' };
// Vehículos ficticios (render.js y minimapa.js): sin logos ni colores de fuerzas reales.
export const VEH_COL = '#7b46b5', VEH_LUZ = '#ff9f1c', HELI_COL = '#3f8f7a';
export const AG_GORRA = '#1d1e24', PIEL = '#e0b68a';   // gorra de los agentes y piel de la cabeza (agentes y transeúntes)
// Transeúntes: la ropa es uno de COLORES_PEAT (peatones.js). Indicador de memoria: letra en una pastilla de este color.
export const MEM_COL = { N: '#9aa0ab', I: '#3fbf6a', C: '#4aa3ff', M: '#e03030', P: '#a275d6', A: '#ff7ad9' };
// Flecha sobre el peatón objetivo de ofrecer (G23).
export const OBJ_OFR_COL = '#ffd33b';

// --- Pathfinding de agentes (rutas.js, agentes.js). Bloque agregado: no cambia el balance, solo cómo se calcula y sigue la ruta.
export const RUTA_NODOS_FRAME = 4000;   // nodos de A* expandidos por frame entre todos los agentes (presupuesto compartido)
export const RUTA_MAX_NODOS = 200000;   // tope de expansiones de una búsqueda (si se pasa, no hay camino)
export const RUTA_MARGEN = 0.12;        // celdas de aire a cada lado al validar un atajo en línea recta (suavizado)
export const RUTA_UMBRAL_OBJ = 2;       // celdas que tiene que moverse el objetivo para recalcular la ruta de un perseguidor
export const RUTA_ATASCO_T = 0.6, RUTA_ATASCO_D = 0.25;   // s sin avanzar RUTA_ATASCO_D celdas siguiendo ruta: atascado, recalcula
export const SEP_RADIO = 0.7, SEP_FUERZA = 6;   // separación entre agentes activos: distancia mínima (celdas) y rigidez del empuje (1/s)
export const INTERCEPT_T_MAX = 1.2;     // s máximos de anticipación al predecir la posición futura del jugador
