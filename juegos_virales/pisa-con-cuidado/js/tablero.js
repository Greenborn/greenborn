'use strict';

/* Lógica pura del tablero (sin DOM). Cada celda es vereda o plaza y puede
   tener caca de perro. La pista de una celda es cuántas cacas hay en sus
   8 vecinos, como en el buscaminas clásico. */

(function (raiz) {
  const VECINOS_8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  const VECINOS_4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  function dentro(t, x, y) {
    return x >= 0 && y >= 0 && x < t.ancho && y < t.alto;
  }

  function idx(t, x, y) {
    return y * t.ancho + x;
  }

  function celda(t, x, y) {
    return t.celdas[idx(t, x, y)];
  }

  function vecinos(t, x, y, direcciones) {
    const out = [];
    for (const [dx, dy] of direcciones) {
      const nx = x + dx, ny = y + dy;
      if (dentro(t, nx, ny)) out.push({ x: nx, y: ny });
    }
    return out;
  }

  function pista(t, x, y) {
    let n = 0;
    for (const v of vecinos(t, x, y, VECINOS_8)) {
      if (celda(t, v.x, v.y).caca) n++;
    }
    return n;
  }

  // Resuelve el tablero solo con deducción lógica, como lo haría el jugador:
  // - una baldosa revelada muestra su pista (al pisarla, o como vecina de una pista 0);
  // - con esas pistas se deduce qué vecinos son seguros y cuáles son caca;
  // - solo se pisan baldosas que se saben seguras y alcanzables desde donde estás.
  // Si llega a la salida, el nivel tiene un camino que no requiere adivinar.
  function resoluble(t) {
    const N = t.ancho * t.alto;
    const pistas = t.celdas.map((c) => pista(t, c.x, c.y));
    const revelada = new Uint8Array(N); // pista conocida
    const segura = new Uint8Array(N);   // se sabe que no tiene caca
    const mina = new Uint8Array(N);     // se deduce que tiene caca
    const pisada = new Uint8Array(N);
    const ver = (x, y) => idx(t, x, y);

    function revelar(x0, y0) {
      const pila = [[x0, y0]];
      while (pila.length) {
        const [x, y] = pila.pop();
        const i = ver(x, y);
        if (revelada[i]) continue;
        revelada[i] = 1;
        if (pistas[i] === 0) {
          for (const v of vecinos(t, x, y, VECINOS_8)) {
            segura[ver(v.x, v.y)] = 1;
            pila.push([v.x, v.y]);
          }
        }
      }
    }

    function deducir() {
      let cambio = true;
      while (cambio) {
        cambio = false;
        for (let i = 0; i < N; i++) {
          if (!revelada[i]) continue;
          const x = i % t.ancho, y = Math.floor(i / t.ancho);
          let minas = 0;
          const desconocidas = [];
          for (const v of vecinos(t, x, y, VECINOS_8)) {
            const j = ver(v.x, v.y);
            if (mina[j]) minas++;
            else if (!segura[j]) desconocidas.push(j);
          }
          if (!desconocidas.length) continue;
          if (minas === pistas[i]) {
            for (const j of desconocidas) { segura[j] = 1; cambio = true; }
          } else if (minas + desconocidas.length === pistas[i]) {
            for (const j of desconocidas) { mina[j] = 1; cambio = true; }
          }
        }
      }
    }

    // Arranca en la casa, que es segura por construcción.
    const inicio = ver(t.inicio.x, t.inicio.y);
    segura[inicio] = 1;
    pisada[inicio] = 1;
    revelar(t.inicio.x, t.inicio.y);
    let pos = { x: t.inicio.x, y: t.inicio.y };

    for (let paso = 0; paso < N * 2; paso++) {
      deducir();
      if (pisada[ver(t.salida.x, t.salida.y)]) return true;
      // Buscar, desde la posición actual y solo por baldosas seguras, una no pisada.
      const visto = new Uint8Array(N);
      const cola = [pos];
      visto[ver(pos.x, pos.y)] = 1;
      let destino = null;
      while (cola.length && !destino) {
        const c = cola.shift();
        for (const v of vecinos(t, c.x, c.y, VECINOS_4)) {
          const j = ver(v.x, v.y);
          if (visto[j] || !segura[j]) continue;
          visto[j] = 1;
          if (!pisada[j]) { destino = v; break; }
          cola.push(v);
        }
      }
      if (!destino) return false;
      pisada[ver(destino.x, destino.y)] = 1;
      revelar(destino.x, destino.y);
      pos = destino;
    }
    return pisada[ver(t.salida.x, t.salida.y)] === 1;
  }

  function generar(ancho, alto, azar, densidad) {
    const t = { ancho, alto, celdas: [], inicio: { x: 0, y: alto - 1 }, salida: { x: ancho - 1, y: 0 } };

    // Plazas: rectángulos de pasto; el resto son veredas.
    const plaza = new Uint8Array(ancho * alto);
    const cantidad = 2 + Math.floor(azar() * 2);
    for (let k = 0; k < cantidad; k++) {
      const w = 3 + Math.floor(azar() * 3);
      const h = 2 + Math.floor(azar() * 2);
      const x0 = Math.floor(azar() * (ancho - w + 1));
      const y0 = Math.floor(azar() * (alto - h + 1));
      for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) plaza[y * ancho + x] = 1;
      }
    }

    // Zona segura alrededor del inicio y la salida.
    const seguro = new Uint8Array(ancho * alto);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = t.inicio.x + dx, y = t.inicio.y + dy;
        if (dentro(t, x, y)) seguro[y * ancho + x] = 1;
      }
    }
    seguro[idx(t, t.salida.x, t.salida.y)] = 1;

    for (let y = 0; y < alto; y++) {
      for (let x = 0; x < ancho; x++) {
        const enPlaza = plaza[y * ancho + x] === 1;
        const prob = (enPlaza ? 0.30 : 0.18) * densidad; // los perros van más a las plazas
        const caca = !seguro[y * ancho + x] && azar() < prob;
        t.celdas.push({ x, y, zona: enPlaza ? 'plaza' : 'vereda', caca });
      }
    }
    return t;
  }

  function crear(opciones = {}) {
    const ancho = opciones.ancho || 14;
    const alto = opciones.alto || 10;
    const azar = opciones.azar || Math.random;
    const densidad = opciones.densidad || 1;
    // Reintenta hasta que el nivel se pueda resolver solo con lógica.
    for (let i = 0; i < 20000; i++) {
      const t = generar(ancho, alto, azar, densidad);
      if (resoluble(t)) return t;
    }
    throw new Error('No se encontró un nivel resoluble');
  }

  const API = { crear, pista, vecinos, dentro, celda, idx, resoluble, VECINOS_4, VECINOS_8 };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  raiz.Tablero = API;
})(typeof window !== 'undefined' ? window : globalThis);
