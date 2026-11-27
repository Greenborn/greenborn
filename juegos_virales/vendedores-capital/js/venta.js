// Pantallas Mercadería (#pantallaMercaderia) y Mejoras (#pantallaMejoras): DOM de la reposición.
// La lógica está en economia.js; main.js pasa los callbacks (getEcon, reponer, comprarMejora, etc.).
// Origen: 3D (#ventaMerc, #ventaMej, pintarMejoras y actualizarRepo).
import { PRECIOS, ESTRELLAS, NOMBRE_PRODUCTO, PRODUCTOS } from './productos.js';
import * as E from './economia.js';
import { MEJ_INFLA } from './config.js';
import { TEXTOS_VENTA, MEJORAS_TEXTO } from './textos.js';

const $ = id => document.getElementById(id);
const dinero = n => '$' + Math.round(n).toLocaleString('es-AR');
const estrellas = n => '★'.repeat(n) + '☆'.repeat(5 - n);

let sel = E.selVacia();   // unidades a comprar por producto en esta reposición
let cb = null;

// Arma las tarjetas de productos y los botones de mejora una sola vez, y enlaza los eventos.
// callbacks: { getEcon(), reponer(sel), personaje(), irMejoras(), volverMercaderia(), comprarMejora(k) }
export function montarVenta(callbacks) {
  cb = callbacks;
  const grid = $('prodGrid');
  for (const p of PRODUCTOS) {
    const nombre = NOMBRE_PRODUCTO[p];
    const card = document.createElement('div');
    card.className = 'prod';
    card.dataset.producto = p;
    card.innerHTML =
      `<div class="prod-info"><img class="prod-ico" src="assets/ilustraciones/${p}.svg" alt="" width="40" height="40" decoding="async">` +
      `<span class="pn">${nombre}</span>` +
      `<span class="pd">${dinero(PRECIOS[p])} c/u · <i class="estrellas">${estrellas(ESTRELLAS[p])}</i></span>` +
      `<span class="prod-bloq"></span></div>` +
      `<div class="stp"><button type="button" data-menos aria-label="Quitar una unidad de ${nombre.toLowerCase()}">−</button>` +
      `<span class="n">0</span>` +
      `<button type="button" data-mas aria-label="Agregar una unidad de ${nombre.toLowerCase()}">+</button></div>`;
    card.querySelector('[data-menos]').addEventListener('click', () => ajustar(p, -1));
    card.querySelector('[data-mas]').addEventListener('click', () => ajustar(p, 1));
    grid.appendChild(card);
  }
  const mg = $('mejGrid');
  for (const k of E.CLAVES_MEJORA) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mej';
    b.dataset.mej = k;
    b.addEventListener('click', () => cb.comprarMejora(k));
    mg.appendChild(b);
  }
  $('btnReponer').textContent = TEXTOS_VENTA.reponer;
  $('btnReponer').addEventListener('click', () => cb.reponer(sel));
  $('btnVentaVolver').addEventListener('click', () => cb.personaje());
  $('btnIrMejoras').addEventListener('click', () => cb.irMejoras());
  $('btnMejVolver').addEventListener('click', () => cb.volverMercaderia());
  $('mercTitulo').textContent = TEXTOS_VENTA.titulo;
  $('mercAyuda').textContent = TEXTOS_VENTA.ayuda;
}

function ajustar(p, delta) {
  sel = E.cambiarSel(cb.getEcon(), sel, p, delta);
  pintarMercaderia();
}

// Vacía la selección (después de reponer).
export function limpiarSel() { sel = E.selVacia(); }

// Pinta la pantalla Mercadería con la economía actual (ajusta la selección a los topes vigentes).
export function pintarMercaderia() {
  const econ = cb.getEcon();
  sel = E.ajustarSel(econ, sel);
  const total = E.totalSel(sel), cap = E.capacidad(econ), tipos = E.tiposSel(sel), tMax = E.tiposMax(econ);
  $('repoRonda').textContent = String(econ.ronda);
  $('repoDisp').textContent = dinero(econ.caja);
  $('repoUltG').textContent = (econ.ultimaG < 0 ? '-' : '') + dinero(Math.abs(econ.ultimaG));
  $('repoTope').textContent = String(cap);
  $('repoGasto').textContent = dinero(E.gastoRonda(econ));
  $('repoTotal').textContent = dinero(E.costoTotal(econ, sel) + E.gastoRonda(econ));
  for (const card of document.querySelectorAll('#prodGrid .prod')) {
    const p = card.dataset.producto, ok = E.desbloqueado(econ, p), q = sel[p] || 0;
    card.classList.toggle('bloq', !ok);
    card.querySelector('.prod-bloq').textContent = ok ? '' : 'Ronda ' + E.rondaDesbloqueo(p);
    card.querySelector('.n').textContent = String(q);
    card.querySelector('[data-menos]').disabled = !ok || q < 1;
    card.querySelector('[data-mas]').disabled = !ok || E.maxProd(econ, sel, p) <= q;
  }
  // Sin fondos (p. ej. tras comprar mejoras): el botón pasa a Reiniciar y main.js termina la partida.
  const sinDinero = E.sinFondos(econ);
  $('btnReponer').textContent = sinDinero ? TEXTOS_VENTA.reiniciar : TEXTOS_VENTA.reponer;
  $('btnReponer').disabled = !sinDinero && total < 1;
  $('repoAviso').textContent = sinDinero ? TEXTOS_VENTA.avisoSinFondos
    : total < 1 ? TEXTOS_VENTA.avisoElegir + ' Tipos: ' + tipos + '/' + tMax + '.'
    : 'Tipos: ' + tipos + '/' + tMax + ' · Unidades: ' + total + '/' + cap + '.';
}

// Pinta la pantalla Mejoras: caja disponible, nivel y costo de cada mejora.
export function pintarMejoras() {
  const econ = cb.getEcon();
  $('mejCaja').textContent = dinero(econ.caja);
  const sube = Math.round(MEJ_INFLA * 100);
  $('mejInfla').textContent = 'Inflación: cada ronda los precios suben ' + sube + ' % sobre el precio base (hoy +' + sube * (econ.ronda - 1) + ' %).';
  for (const b of document.querySelectorAll('#mejGrid .mej')) {
    const k = b.dataset.mej, n = E.nivel(econ, k), costo = E.siguienteCosto(econ, k), t = MEJORAS_TEXTO[k];
    const titulo = t.nombre + ': nivel ' + n + (costo === null ? ' (máximo)' : ' → ' + (n + 1) + ' · ' + dinero(costo));
    b.replaceChildren();
    const a = document.createElement('span'); a.className = 'mej-t'; a.textContent = titulo;
    const d = document.createElement('span'); d.className = 'mej-d'; d.textContent = t.desc;
    b.append(a, d);
    b.disabled = costo === null || econ.caja < costo;
  }
}
