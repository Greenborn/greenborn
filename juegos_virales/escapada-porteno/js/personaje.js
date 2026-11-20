'use strict';

/* Pantalla de personaje del juego: usa la librería ConstructorPersonaje
   (juegos_virales/libs/constructor-personaje) y guarda la elección con CLAVE_CONFIG. */

const CLAVE_CONFIG = 'escapada.personaje';

const pantallaPersonaje = document.getElementById('pantalla-personaje');

const controlPersonaje = ConstructorPersonaje.montar({
  contenedor: document.getElementById('opciones'),
  previa: document.getElementById('previa'),
  botonAzar: document.getElementById('btn-azar'),
  claveStorage: CLAVE_CONFIG,
});

function obtenerConfigPersonaje() {
  return controlPersonaje.obtenerConfig();
}

function mostrarPersonaje() { pantallaPersonaje.classList.remove('oculta'); }
function ocultarPersonaje() { pantallaPersonaje.classList.add('oculta'); }

document.getElementById('btn-jugar').addEventListener('click', () => {
  ocultarPersonaje();
  iniciarJuego();
});
