// Barrios de la ciudad 2D (G27, decisión D2). Sin DOM, para poder probarlo en Node.
//
// Nombres, colores y perfiles visuales copiados de BARRIOS de la 3D (vendedores_capital/index.html). Se dejan fuera
// el rectángulo de la 3D (la 2D reparte la grilla en 3 x 3) y los parámetros de juego de la 3D (peatones, agentes,
// demanda y elementos), que la 2D todavía no usa.
//
// Regla de zona (zonaDe): la ciudad de n x n celdas se parte en una grilla de 3 x 3 bloques iguales.
//   columna = floor(i * 3 / n)  (i = celda en x)
//   fila    = floor(j * 3 / n)  (j = celda en z)
//   barrio  = fila * 3 + columna  (índice dentro de BARRIOS, de 0 a 8; 0 = arriba a la izquierda)
// Con n = 132 cada bloque tiene 44 x 44 celdas. El centro (columna 1, fila 1) es Microcentro, índice 4.
//
// Perfil visual (sólo ambiente, no cambia la geometría): col, pisos, pal, calle, adoq, vereda, arbolesVereda,
// especies, farol, decoV, autos, estilo y hito. En la 2D hoy se usan col (colores de zona y minimapa); el resto queda
// como dato para las fases de identidad visual.

export const GRILLA = 3;                 // bloques por lado
export const ZONA_CENTRO = 4;            // índice del barrio central (Microcentro)

export const BARRIOS = [
  { nombre: 'Parque',      col: '#9be3a1', pisos: null, pal: null, calle: '#2a2c31', adoq: false, vereda: null, arbolesVereda: true,
    especies: null, farol: 'comun', decoV: { banco: 0.02, cantero: 0.012 }, autos: null, estilo: ['base'], hito: 'glorieta' },
  { nombre: 'Recoleta',    col: '#74c0fc', pisos: [3, 4], pal: 'francesa', calle: '#2a2c31', adoq: false, vereda: null, arbolesVereda: true,
    especies: ['jacaranda', 'jacaranda', 'platano', 'roble', 'ceibo'], farol: 'comun',
    decoV: { banco: 0.025, cantero: 0.02, kiosk: 0.006 }, autos: null, estilo: ['francesa'], hito: 'plazaArbol' },
  { nombre: 'Belgrano',    col: '#8fd3ff', pisos: [3, 4], pal: 'walls', calle: '#2a2c31', adoq: false, vereda: null, arbolesVereda: true,
    especies: ['roble', 'fresno', 'pino', 'platano', 'abedul'], farol: 'papel',
    decoV: { banco: 0.02, cantero: 0.012, kiosk: 0.006 }, autos: null, estilo: ['torre', 'casona', 'casona'], hito: 'arco' },
  { nombre: 'Almagro',     col: '#b8b0ff', pisos: [3, 4], pal: 'walls', calle: '#2a2c31', adoq: false, vereda: null, arbolesVereda: true,
    especies: ['platano', 'fresno', 'naranjo', 'jacaranda'], farol: 'comun',
    decoV: { mesa: 0.03, kiosk: 0.01, banco: 0.01 }, autos: null, estilo: ['chorizo'], hito: null },
  { nombre: 'Microcentro', col: '#ffd24a', pisos: [14, 17], pal: 'vidrio', calle: '#2a2c31', adoq: false, vereda: null, arbolesVereda: true,
    especies: ['platano', 'platano', 'fresno', 'alamo'], farol: 'comun',
    decoV: { kiosk: 0.014, subte: 0.012, mantero: 0.012, banco: 0.008 },
    autos: ['#fab005', '#fab005', '#343a40', '#343a40', '#f1f3f5', '#1c7ed6'], estilo: ['vidrio'], hito: null },
  { nombre: 'Centro',      col: '#74a9e0', pisos: null, pal: null, calle: '#2f2c29', adoq: true, vereda: '#b9ae98', arbolesVereda: false,
    especies: ['platano', 'fresno', 'platano'], farol: 'comun',
    decoV: { kiosk: 0.012, subte: 0.01, mantero: 0.01, banco: 0.015 },
    autos: ['#f1f3f5', '#343a40', '#fab005', '#8d8d8d', '#c92a2a', '#1c7ed6'], estilo: ['recova'], hito: 'cupula' },
  { nombre: 'La Boca',     col: '#3ddc97', pisos: [1, 2], pal: 'caminito', calle: '#2a2c31', adoq: false, vereda: null, arbolesVereda: true,
    especies: ['alamo', 'sauce', 'ceibo', 'cipres'], farol: 'comun',
    decoV: { mantero: 0.012, banco: 0.012, kiosk: 0.006 },
    autos: ['#e03131', '#fab005', '#20c997', '#f1f3f5', '#1c7ed6', '#e8590c'], estilo: ['chapa'], hito: 'transbordador' },
  { nombre: 'San Telmo',   col: '#d9a25e', pisos: [2, 3], pal: 'colonial', calle: '#33302a', adoq: true, vereda: '#b9ae98', arbolesVereda: false,
    especies: ['platano', 'naranjo', 'platano', 'ceibo'], farol: 'colonial',
    decoV: { mantero: 0.018, banco: 0.012, mesa: 0.012, kiosk: 0.006 },
    autos: ['#8d8d8d', '#f1f3f5', '#343a40', '#c9a77c', '#1c7ed6', '#c92a2a'], estilo: ['colonial'], hito: 'iglesia' },
  { nombre: 'Barracas',    col: '#ff7a3d', pisos: [1, 2], pal: 'chapa', calle: '#2a2c31', adoq: false, vereda: null, arbolesVereda: true,
    especies: ['alamo', 'pino', 'cipres', 'alamo', 'seco'], farol: 'comun',
    decoV: { banco: 0.006, kiosk: 0.005 },
    autos: ['#f1f3f5', '#8d8d8d', '#343a40', '#1c7ed6', '#c92a2a', '#f1f3f5'], estilo: ['galpon'], hito: 'chimeneas' },
];

export const ZONAS_NOMBRE = BARRIOS.map(b => b.nombre);

// Barrio (índice 0..8) de la celda (i, j) en una ciudad de n x n celdas. Regla en la cabecera de este archivo.
export function zonaDe(i, j, n) {
  const c = Math.min(GRILLA - 1, Math.floor(i * GRILLA / n));
  const f = Math.min(GRILLA - 1, Math.floor(j * GRILLA / n));
  return f * GRILLA + c;
}

// Centro geométrico del bloque del barrio z, en celdas (x = i, z = j), para elegir la posición inicial.
export function centroideBarrio(z, n) {
  const col = z % GRILLA, fila = Math.floor(z / GRILLA);
  return { i: (col + 0.5) * n / GRILLA, j: (fila + 0.5) * n / GRILLA };
}

// ---------- Ciudad real (OpenStreetMap, ver ciudad_real.js) ----------
// Los barrios reales del recorte toman el perfil visual de un barrio de BARRIOS con aspecto parecido. Donde dos barrios
// comparten perfil se cambia el color (col) para que se distingan en el minimapa y en el HUD.
export const PERFIL_REAL = {
  'San Nicolás':   { base: 'Microcentro' },
  'Monserrat':     { base: 'Centro' },
  'San Telmo':     { base: 'San Telmo' },
  'Recoleta':      { base: 'Recoleta' },
  'Retiro':        { base: 'Belgrano', col: '#9fd8c4' },
  'Puerto Madero': { base: 'Microcentro', col: '#5fd0e6', pal: 'vidrio', pisos: [8, 12] },
  'Balvanera':     { base: 'Almagro' },
};

// Perfiles para una lista de nombres reales (índice = zona de la ciudad real). Un nombre desconocido usa 'Parque'.
export function perfilesReales(nombres) {
  return nombres.map(nombre => {
    const p = PERFIL_REAL[nombre] ?? { base: 'Parque' };
    const base = BARRIOS.find(b => b.nombre === p.base) ?? BARRIOS[0];
    const { base: _b, ...extra } = p;
    return { ...base, ...extra, nombre, perfil: base.nombre };
  });
}

// Perfiles de la ciudad que se juega: los reales si la ciudad los trae, si no los 9 de la grilla.
export const perfilesDe = city => city?.perfiles ?? BARRIOS;
