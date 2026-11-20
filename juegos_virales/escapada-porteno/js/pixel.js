'use strict';

/* Arte pixel generado por código: no hay imágenes externas.
   Sprites y tiles se dibujan píxel a píxel desde matrices de caracteres. */

const TAM_TILE = 16;

function crearPRNG(semilla) {
  let s = (semilla >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

function crearLienzo(ancho, alto) {
  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = alto;
  return c;
}

function dibujarFilas(ctx, filas, paleta) {
  filas.forEach((fila, y) => {
    for (let x = 0; x < fila.length; x++) {
      const color = paleta[fila[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  });
}

function spriteDesdeFilas(filas, paleta) {
  const c = crearLienzo(filas[0].length, filas.length);
  dibujarFilas(c.getContext('2d'), filas, paleta);
  return c;
}

/* ---------- Artículos (8 x 8) ---------- */
const SPRITES_ARTICULO = {
  palta: {
    paleta: { g: '#2e6b2e', G: '#7cc04a', b: '#5a3a1a' },
    filas: [
      '...gg...',
      '..gGGg..',
      '.gGGGGg.',
      '.gGbbGg.',
      '.gGbbGg.',
      '.gGGGGg.',
      '..gGGg..',
      '...gg...',
    ],
  },
  media: {
    paleta: { w: '#f5f5f5', b: '#2d4fa8', r: '#d94a4a' },
    filas: [
      '..bbbb..',
      '..wwww..',
      '..rrrr..',
      '..wwww..',
      '..wwww..',
      '.wwwwww.',
      '.wwwwww.',
      '.bbbbbb.',
    ],
  },
  empanada: {
    paleta: { e: '#d9952b', c: '#8a4b1a', d: '#f0c674' },
    filas: [
      '........',
      '..cccc..',
      '.ceeeec.',
      'ceedeeec',
      'ceeeeeec',
      'cccccccc',
      '........',
      '........',
    ],
  },
  churro: {
    paleta: { c: '#b5651d', S: '#f4e3c1' },
    filas: [
      '......cc',
      '.....cSc',
      '....cSc.',
      '...cSc..',
      '..cSc...',
      '.cSc....',
      'cc......',
      '........',
    ],
  },
};

/* ---------- Tiles (16 x 16) ---------- */
function generarTiles() {
  const rnd = crearPRNG(7331);
  const pix = (ctx, x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };
  const rect = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const circulo = (ctx, cx, cy, r, c) => {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if (x * x + y * y <= r * r) pix(ctx, cx + x, cy + y, c);
  };
  const manchas = (ctx, colores, n) => {
    for (let i = 0; i < n; i++)
      pix(ctx, Math.floor(rnd() * 16), Math.floor(rnd() * 16), colores[Math.floor(rnd() * colores.length)]);
  };
  const lienzo = (dibujar) => {
    const c = crearLienzo(16, 16);
    dibujar(c.getContext('2d'));
    return c;
  };
  const acera = (ctx) => {
    rect(ctx, 0, 0, 16, 16, '#d9d0bf');
    manchas(ctx, ['#c9bfac', '#e8e1d3'], 30);
    rect(ctx, 0, 15, 16, 1, '#bfb49f');
    rect(ctx, 15, 0, 1, 16, '#bfb49f');
  };

  const t = {};
  t['.'] = lienzo(acera);
  t['='] = lienzo(ctx => {
    rect(ctx, 0, 0, 16, 16, '#4b4d57');
    manchas(ctx, ['#55575f', '#41434b', '#5d5f68'], 40);
  });
  t['#'] = lienzo(ctx => {
    rect(ctx, 0, 0, 16, 16, '#8a5f55');
    rect(ctx, 0, 0, 16, 1, '#6b463f');
    manchas(ctx, ['#7d544b', '#97685d'], 20);
    for (const [x, y] of [[2, 3], [9, 3], [2, 10], [9, 10]]) {
      rect(ctx, x, y, 5, 5, '#2e3b4a');
      rect(ctx, x + 1, y + 1, 3, 3, '#bfe3f2');
    }
  });
  t['p'] = lienzo(ctx => {
    rect(ctx, 0, 0, 16, 16, '#6fbf5a');
    manchas(ctx, ['#5aa84a', '#8fd873', '#64b150'], 60);
  });
  t['h'] = lienzo(ctx => {
    rect(ctx, 0, 0, 16, 16, '#6fbf5a');
    manchas(ctx, ['#5aa84a', '#8fd873'], 30);
    circulo(ctx, 8, 9, 6, '#2f7d3a');
    circulo(ctx, 6, 7, 3, '#4f9f48');
    circulo(ctx, 10, 11, 2, '#25692f');
  });
  t['T'] = lienzo(ctx => {
    acera(ctx);
    rect(ctx, 7, 10, 2, 6, '#6b4a2e');
    circulo(ctx, 8, 6, 5, '#2f7d3a');
    circulo(ctx, 6, 4, 2, '#4f9f48');
  });
  t['K'] = lienzo(ctx => {
    rect(ctx, 0, 0, 16, 16, '#c46b3c');
    manchas(ctx, ['#b65e33', '#d27a4c'], 20);
    for (let x = 0; x < 16; x++) rect(ctx, x, 0, 1, 5, (x % 4 < 2) ? '#d2453b' : '#f4f1e8');
    rect(ctx, 0, 5, 16, 1, '#8f2f27');
    rect(ctx, 2, 7, 12, 6, '#2b2b2b');
    rect(ctx, 3, 8, 10, 4, '#f0e6c8');
    rect(ctx, 0, 13, 16, 3, '#a9562e');
  });
  t['B'] = lienzo(ctx => {
    acera(ctx);
    rect(ctx, 2, 7, 12, 2, '#a8743d');
    rect(ctx, 2, 9, 12, 1, '#7d5226');
    rect(ctx, 3, 10, 1, 4, '#444444');
    rect(ctx, 12, 10, 1, 4, '#444444');
  });
  t['C'] = lienzo(ctx => {
    acera(ctx);
    rect(ctx, 7, 7, 2, 9, '#555555');
    rect(ctx, 4, 1, 8, 6, '#f2c94c');
    rect(ctx, 4, 1, 8, 1, '#333333');
    rect(ctx, 4, 6, 8, 1, '#333333');
    rect(ctx, 5, 3, 6, 1, '#333333');
    rect(ctx, 5, 4, 4, 1, '#333333');
  });
  return t;
}
