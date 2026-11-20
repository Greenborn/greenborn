'use strict';

/* Constructor de personaje (librería reutilizable).
   Script clásico: expone window.ConstructorPersonaje.
   Sin campos de texto ni datos personales: solo combinaciones de colores y estilos. */
(function () {

  const OPCIONES = {
    piel:       { titulo: 'Piel',            valores: ['#f6d2b1', '#e0a878', '#c07c50', '#8d5a36', '#5a3822'] },
    pelo:       { titulo: 'Pelo',            valores: ['#1d1a2a', '#5b3a1e', '#c9a24a', '#b5483a', '#8a8f99'] },
    peinado:    { titulo: 'Peinado',         valores: ['corto', 'largo', 'gorra', 'pelado'],
                  etiquetas: { corto: 'Corto', largo: 'Largo', gorra: 'Con gorra', pelado: 'Pelado' } },
    remera:     { titulo: 'Remera',          valores: ['#e04b4b', '#3d7fd9', '#4fb06d', '#f2c14e', '#9b59b6', '#f5f5f5', '#ff8fb1', '#2d2d2d'] },
    pantalon:   { titulo: 'Pantalón',        valores: ['#2f3b52', '#5a4632', '#3b3b3b', '#7a8a4a', '#a9b7c9'] },
    zapatillas: { titulo: 'Calzado',         valores: ['#1a1a1a', '#7a4a2a', '#eeeeee'] },
    gorra:      { titulo: 'Color de gorra',  valores: ['#e04b4b', '#3d7fd9', '#2d2d2d', '#f2c14e', '#4fb06d', '#f5f5f5'] },
    accesorio:  { titulo: 'Accesorio',       valores: ['nada', 'bolso'],
                  etiquetas: { nada: 'Ninguno', bolso: 'Bolso' } },
    bolso:      { titulo: 'Color del bolso', valores: ['#c79a4b', '#6f4bb5', '#2c8c8c'] },
  };

  const CONFIG_BASE = {
    piel: '#e0a878',
    pelo: '#1d1a2a',
    peinado: 'corto',
    remera: '#3d7fd9',
    pantalon: '#2f3b52',
    zapatillas: '#1a1a1a',
    gorra: '#e04b4b',
    accesorio: 'bolso',
    bolso: '#c79a4b',
  };

  /* ---------- Lienzo y dibujo genéricos ---------- */
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

  /* ---------- Persona (12 x 16) ----------
     O contorno · H pelo · S piel · E ojos · T remera · P pantalón · B calzado
     G gorra · A bolso                                                        */
  const PLANTILLA_PERSONA = [
    '....OOOO....',
    '...OHHHHO...',
    '..OHHHHHHO..',
    '..OHSSSSHO..',
    '..OSSSSSSO..',
    '..OSESSESO..',
    '..OSSSSSSO..',
    '...OSSSSO...',
    '..OTTTTTTO..',
    'SOTTTTTTTTOS',
    '.OTTTTTTTTO.',
    '.OTTTTTTTTO.',
    '..OPPPPPPO..',
    '..OPP..PPO..',
    '..OBB..BBO..',
    '..OOO..OOO..',
  ];

  function filasPersona(cfg) {
    const f = PLANTILLA_PERSONA.map(fila => fila.split(''));
    if (cfg.peinado === 'largo') {
      for (let y = 3; y <= 7; y++) { f[y][2] = 'H'; f[y][9] = 'H'; }
    }
    if (cfg.peinado === 'gorra') {
      for (let y = 1; y <= 3; y++) f[y] = f[y].map(c => (c === 'H' ? 'G' : c));
      f[3][1] = 'G';
      f[3][10] = 'G';
    }
    if (cfg.peinado === 'pelado') {
      for (let y = 0; y < f.length; y++) f[y] = f[y].map(c => (c === 'H' ? 'S' : c));
    }
    if (cfg.accesorio === 'bolso') {
      f[11][10] = 'A'; f[11][11] = 'A';
      f[12][10] = 'A'; f[12][11] = 'A';
    }
    return f.map(fila => fila.join(''));
  }

  function paletaPersona(c) {
    return {
      O: '#1d1a2a', E: '#1d1a2a',
      S: c.piel, H: c.pelo, G: c.gorra,
      T: c.remera, P: c.pantalon, B: c.zapatillas, A: c.bolso,
    };
  }

  function crearSprite(cfg) {
    return spriteDesdeFilas(filasPersona(cfg), paletaPersona(cfg));
  }

  /* ---------- Interfaz ----------
     Opciones y base se leen de ConstructorPersonaje.OPCIONES / CONFIG_BASE al montar,
     así que pueden reemplazarse antes de llamar a montar(). */
  function montar(opts) {
    const o = opts || {};
    const opciones = o.opciones || API.OPCIONES;
    const base = o.configBase || API.CONFIG_BASE;
    const contenedor = o.contenedor;
    const canvasPrevia = o.previa;
    const claveStorage = o.claveStorage || null;
    const alCambiar = typeof o.alCambiar === 'function' ? o.alCambiar : null;

    function cargar() {
      try {
        if (claveStorage) {
          const guardada = JSON.parse(localStorage.getItem(claveStorage));
          if (guardada && typeof guardada === 'object') return { ...base, ...guardada };
        }
      } catch (e) { /* sin almacenamiento disponible: usamos la base */ }
      return { ...base };
    }

    const config = cargar();

    function guardar() {
      if (!claveStorage) return;
      try { localStorage.setItem(claveStorage, JSON.stringify(config)); } catch (e) { /* ignorar */ }
    }

    const ctxPrevia = canvasPrevia ? canvasPrevia.getContext('2d') : null;
    if (ctxPrevia) ctxPrevia.imageSmoothingEnabled = false;

    let sprite = crearSprite(config);
    let idFrame = null;

    function refrescarPrevia() { sprite = crearSprite(config); }

    function notificar() {
      if (alCambiar) alCambiar({ ...config });
    }

    function renderOpciones() {
      if (!contenedor) return;
      contenedor.innerHTML = '';
      for (const [cat, def] of Object.entries(opciones)) {
        const fila = document.createElement('div');
        fila.className = 'fila';

        const titulo = document.createElement('span');
        titulo.className = 'titulo';
        titulo.textContent = def.titulo;
        fila.appendChild(titulo);

        const grupo = document.createElement('div');
        grupo.className = 'grupo';

        for (const valor of def.valores) {
          const b = document.createElement('button');
          b.type = 'button';
          if (valor.startsWith('#')) {
            b.className = 'muestra';
            b.style.background = valor;
            b.setAttribute('aria-label', `${def.titulo} ${valor}`);
          } else {
            b.className = 'texto';
            b.textContent = (def.etiquetas && def.etiquetas[valor]) || valor;
          }
          if (config[cat] === valor) b.classList.add('activo');
          b.addEventListener('click', () => {
            config[cat] = valor;
            guardar();
            refrescarPrevia();
            renderOpciones();
            notificar();
          });
          grupo.appendChild(b);
        }

        fila.appendChild(grupo);
        contenedor.appendChild(fila);
      }
    }

    function elegirAlAzar() {
      for (const [cat, def] of Object.entries(opciones)) {
        config[cat] = def.valores[Math.floor(Math.random() * def.valores.length)];
      }
      guardar();
      refrescarPrevia();
      renderOpciones();
      notificar();
    }

    function animar(t) {
      if (ctxPrevia) {
        ctxPrevia.clearRect(0, 0, canvasPrevia.width, canvasPrevia.height);
        const rebote = Math.floor(t / 300) % 2 ? -1 : 0;
        ctxPrevia.drawImage(sprite, 0, rebote);
      }
      idFrame = requestAnimationFrame(animar);
    }

    if (o.botonAzar) o.botonAzar.addEventListener('click', elegirAlAzar);

    renderOpciones();
    idFrame = requestAnimationFrame(animar);

    return {
      obtenerConfig() { return { ...config }; },
      elegirAlAzar,
      detener() {
        if (idFrame !== null) cancelAnimationFrame(idFrame);
        idFrame = null;
      },
    };
  }

  const API = {
    OPCIONES,
    CONFIG_BASE,
    crearSprite,
    montar,
  };
  window.ConstructorPersonaje = API;
})();
