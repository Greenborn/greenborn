# Constructor de personaje

Librería de uso común para armar un personaje pixel art con opciones de piel, pelo,
peinado, remera, pantalón, calzado, gorra y accesorio. Genera el sprite con código
(sin imágenes) y no guarda datos personales: solo combinaciones de colores y estilos.

Es un script clásico (sin módulos ni build). Expone el global `window.ConstructorPersonaje`.

## Uso desde otro proyecto

Desde la raíz de la página, incluir el script antes del código que la usa:

```html
<link rel="stylesheet" href="../libs/constructor-personaje/constructor-personaje.css" />
<script src="../libs/constructor-personaje/constructor-personaje.js"></script>
```

(Ajustar la ruta relativa según la ubicación de la página.)

## Estilos

`constructor-personaje.css` define las clases `.previa-caja`, `#previa`, `#opciones`, `.fila`,
`.fila .titulo`, `.grupo`, `.muestra`, `.texto` y `.activo`. Usa las variables de la página
`--panel`, `--borde`, `--boton`, `--texto` y `--acento`; si no existen, usa valores por defecto
(`--boton: #2c3150`, `--borde: #3b4166`, `--texto: #f2efe6`, `--acento: #f2c94c`).
Para un tema propio, basta con definir esas variables en `:root`.

## API

### `ConstructorPersonaje.OPCIONES`

Categorías y valores disponibles (`{ titulo, valores, etiquetas? }` por categoría).
Valores que empiezan con `#` se muestran como muestras de color; el resto como botones de texto.

### `ConstructorPersonaje.CONFIG_BASE`

Configuración inicial (piel, pelo, peinado, remera, pantalon, zapatillas, gorra, accesorio, bolso).

### `ConstructorPersonaje.crearSprite(cfg)`

Devuelve un `<canvas>` de 12 x 16 con el personaje armado con `cfg`.

### `ConstructorPersonaje.montar(opciones)`

Renderiza el constructor en la página y anima la vista previa. Opciones:

- `contenedor` (HTMLElement): donde se dibujan las filas de opciones.
- `previa` (canvas): vista previa, con rebote cada 300 ms y `imageSmoothingEnabled = false`.
- `botonAzar` (botón, opcional): al hacer click elige una configuración al azar.
- `claveStorage` (string, opcional): clave de `localStorage` para guardar y restaurar la elección. Si falta o el almacenamiento no está disponible, funciona igual sin persistir.
- `alCambiar(cfg)` (función, opcional): se llama con una copia de la configuración cada vez que cambia.
- `opciones` y `configBase` (opcionales): reemplazan `OPCIONES` y `CONFIG_BASE` solo para este montaje.

Devuelve `{ obtenerConfig(), elegirAlAzar(), detener() }`:

- `obtenerConfig()`: copia de la configuración actual.
- `elegirAlAzar()`: elige al azar, guarda y refresca.
- `detener()`: cancela la animación de la vista previa.

## Personalizar las opciones

`OPCIONES` y `CONFIG_BASE` se pueden reemplazar antes de montar:

```js
ConstructorPersonaje.OPCIONES = {
  piel: { titulo: 'Piel', valores: ['#f6d2b1', '#8d5a36'] },
  // ...
};
```

El sprite necesita las claves piel, pelo, peinado, remera, pantalon, zapatillas, gorra,
accesorio y bolso; conviene mantenerlas en `OPCIONES` y `CONFIG_BASE`.

## Ejemplo mínimo

```html
<div id="opciones"></div>
<canvas id="previa" width="12" height="16"></canvas>
<button id="azar" type="button">Al azar</button>
<script src="../libs/constructor-personaje/constructor-personaje.js"></script>
<script>
  const control = ConstructorPersonaje.montar({
    contenedor: document.getElementById('opciones'),
    previa: document.getElementById('previa'),
    botonAzar: document.getElementById('azar'),
    claveStorage: 'mi-juego.personaje',
    alCambiar: (cfg) => console.log(cfg),
  });
</script>
```
