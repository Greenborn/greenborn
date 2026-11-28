# Vendedores Capital 2D (vista cenital)

Versión 2D, vista desde arriba, de la mecánica de la Fase 3 del juego 3D (`../index.html`): agentes de control con patrulla, campo de visión, alerta, persecución, safar y captura. Vive completamente dentro de `2d/`: no importa nada de `../js`, `../css`, `../assets` ni `../node_modules`, y no usa three.js.

Plan de origen: `../PLAN_2D.md`.

## Cómo se abre

Desde la raíz del proyecto, con el servidor que ya usa el humano (`serve.py`), abrir `/2d/index.html`. Los módulos ES se cargan como `type="module"`. `2d/package.json` declara `"type": "module"` solo para que las pruebas de Node traten `2d/js/*.js` como ES modules (la raíz del proyecto es CommonJS).

## Estructura

```
2d/
├── index.html          canvas, HUD, nav de pasos, fundido y pantallas (aviso, título, personaje, opciones, ayuda, pausa, fin)
├── package.json        "type": "module" (para Node)
├── css/juego2d.css     estilos base
├── css/movil.css       se carga después: menús responsivos, safe areas, alto visible y controles táctiles
├── js/
│   ├── main.js         arranque, bucle (con límite de FPS), estados (titulo / venta / jugando / fin), pausa, peatones, ofrecer, cierre de ronda, energía
│   ├── config.js       constantes de la 2D (jugador, venta, energía, peatones, economía, puntaje, opciones de zoom, distancia y FPS), copiadas de la 3D o propias
│   ├── productos.js    precios, demanda, estrellas, nombres y orden de desbloqueo de los 5 productos (sin DOM)
│   ├── economia.js     caja, rondas, stock por producto, reposición, venta, cierre de ronda, desbloqueo, mejoras y persistencia (sin DOM, funciones puras)
│   ├── venta.js        pantallas Mercadería y Mejoras (DOM): tarjetas, contadores − / +, panel de reposición y botones de mejora
│   ├── ajustes.js      ajustes del jugador (volumen, silencio, distancia, zoom inicial, FPS, patrulla y controles en pantalla) en localStorage con la clave "2d_ajustes"
│   ├── audio.js        audio sintetizado con WebAudio (sin archivos, portado de la 3D): efectos, música de fondo, sirena, volumen y silencio; se activa en el primer gesto (sin DOM)
│   ├── textos.js       textos de burbujas (TEXTOS), reacciones (REACCIONES), Mercadería, mejoras y motivos de fin
│   ├── pantallas.js    router de overlays (mostrar / ocultar / irA con fundido) y nav de pasos (pasoNav)
│   ├── ciudad.js       ciudad procedural de respaldo (semilla fija) y funciones de grilla para cualquier tamaño (city.N, city.pasa): BFS, DDA, colisión, celda caminable más cercana
│   ├── ciudad_real.js  ciudad real de CABA (OpenStreetMap): carga de datos/, esquinas de los agentes y puntos de peatones (sin DOM)
│   ├── rutas.js        A* en grilla, suavizado y planificador con presupuesto (agentes, peatones y clic para caminar; sin DOM)
│   ├── barrios.js      perfiles visuales de barrio (9 de la grilla de respaldo y su asignación a los barrios reales), zonaDe() y centroides (sin DOM)
│   ├── peatones.js     peatones: movimiento por veredas, memoria por ronda (N/I/C/M/P/A), reacciones con DEMANDA, contagio por insulto, reciclado y objetivo de ofrecer (sin DOM)
│   ├── personaje.js    personaje del vendedor (D1): categorías y valores, validación, "Al azar" con generador inyectable, sprite pixelart procedural 12 x 16 (quieto, dos cuadros de caminata, de frente o de espaldas según el heading) y guardado en "2d_personaje" (sin DOM)
│   ├── aviso.js        aviso de parodia de la primera vez, en localStorage con la clave "2d_aviso" (sin DOM)
│   ├── pistas.js       pistas de tutorial de una sola vez, guardadas en localStorage con la clave "2d_pistas" (sin DOM)
│   ├── jornada.js      momentos del día (mañana, mediodía, tarde), demanda y cantidad de peatones por momento, colores de cielo y niebla (sin DOM)
│   ├── agentes.js      agentes (pool por cercanía, atentos y distraídos), FOV, director de la búsqueda, última posición vista, safar, captura (sin DOM)
│   ├── busqueda.js     estrellas, respuesta por nivel, zafar y activación por cercanía (sin DOM)
│   ├── vehiculos.js    patrullas por la red de calles y helicóptero (sin DOM)
│   ├── transito.js     autos por las calzadas, frenada, bocina y atropello (sin DOM)
│   ├── energia.js      energía al correr: costo de arranque y demora de recuperación (sin DOM)
│   ├── coima.js        coima al capturar: propuesta, aceptación, pago y cooldown (funciones puras, sin DOM)
│   ├── puntaje.js      puntos de venta, escape, bonus de sigilo y de tiempo, desglose, medallas, récord y texto/enlaces de compartir (sin DOM)
│   ├── render.js       mapa horneado por mosaicos (suelo con textura, calles con carriles y sendas, techos por lote con borde y sombra, árboles con copa y sombra, color por barrio), luz de la jornada, conos con degradé, sprites pixelart de jugador, peatones y agentes (desde la caché de sprites.js) ordenados por profundidad con sombra, marcas, globos de diálogo, chispas de venta, "!" con rebote y viñeta de persecución
│   ├── sprites.js      sprites pixelart de peatones (variante estable por peatón sobre personaje.js) y de agentes (uniforme, chaleco y gorra del color del estado), rasterizado y caché de sprites con tope (sin DOM propio)
│   ├── minimapa.js     minimapa de la esquina (rotado con la vista) y mapa de selección de zona, sin DOM propio (recibe el canvas)
│   ├── camara.js       cámara ortogonal, seguimiento suavizado, zoom, rotación de la vista en pasos de 45 grados y conversiones pantalla-mundo
│   ├── controles.js    teclado (WASD, Q/R para girar), rueda, joystick fijo o pad de flechas, pellizco, toque o clic en el mapa, botones de giro y botones táctiles
│   ├── caminar.js      clic para caminar (G22): plan de camino con el A* de rutas.js, celda caminable más cercana, seguimiento y cancelación por entrada manual o trabado (sin DOM, funciones puras)
│   └── movil.js        modo táctil (body.tactil), pantalla completa, capa "Girá el teléfono" (pausa vía main.js)
├── datos/                 mapa real procesado: caba_recorte.json (metadatos) y caba_recorte.bin (celdas)
├── assets/ilustraciones/  ilustraciones SVG de los 5 productos (copiadas de ../assets/ilustraciones/, ver "Mejora visual y sonora")
└── tools/
    ├── test_visual.mjs    pruebas headless de la mejora visual y sonora: variantes de peatón, sprite del agente, caché de sprites con tope, envolvente ADSR, variación de tono y efectos nuevos (node 2d/tools/test_visual.mjs)
    ├── test_agentes.mjs   pruebas headless de agentes.js (node 2d/tools/test_agentes.mjs)
    ├── test_audio.mjs     pruebas headless de audio.js con AudioContext simulado: nombres desconocidos, volumen recortado, silencio y desbloqueo único (node 2d/tools/test_audio.mjs)
    ├── test_ciudad.mjs    pruebas headless de la ciudad por barrios (semilla, zonaDe, caminables, posición inicial) y del giro de cámara (node 2d/tools/test_ciudad.mjs)
    ├── test_camino.mjs    pruebas headless del clic para caminar: llega al destino, destino no caminable, rodeo de un muro y cancelación por entrada manual (node 2d/tools/test_camino.mjs)
    ├── test_coima.mjs     pruebas headless de coima.js y de la captura con coima (node 2d/tools/test_coima.mjs)
    ├── test_economia.mjs  pruebas headless de economia.js y productos.js (node 2d/tools/test_economia.mjs)
    ├── test_ofrecer.mjs   pruebas headless del cono de ofrecer: alcance por nivel, semiángulo, línea de visión, objetivo más cercano y pistas (node 2d/tools/test_ofrecer.mjs)
    ├── test_personaje.mjs pruebas headless de personaje.js: valores por defecto, Al azar, validación, frames de tamaño fijo y persistencia con storage simulado (node 2d/tools/test_personaje.mjs)
    ├── test_peatones.mjs  pruebas headless de peatones.js y jornada.js (node 2d/tools/test_peatones.mjs)
    ├── test_transito.mjs  pruebas headless de transito.js: recorrido, frenada, atropello, peatones, camino por clic, balance y rendimiento
    ├── test_puntaje.mjs   pruebas headless de puntaje.js: puntos, bonus, medallas, récord y texto de compartir (node 2d/tools/test_puntaje.mjs)
    ├── test_ciudad_real.mjs pruebas headless de la ciudad real: datos, agua, conectividad, aparición por barrio, caminar, peatones y agentes
    ├── procesar_osm.mjs   convierte la descarga de OpenStreetMap en datos/ (ver "Datos del mapa")
    └── correr_todo.mjs    corre los test_*.mjs en orden alfabético y sale con código 1 si alguno falla (node 2d/tools/correr_todo.mjs)
```

## Controles en celular

- Modo táctil: `body.tactil` se pone cuando el puntero es grueso (o hay táctil sin mouse fino). Sólo ahí se muestran el joystick y los botones Correr y Ofrecer; en escritorio, Shift y E.
- Tecla F (o clic en el icono de producto del HUD): cambia el producto activo. Sin botón táctil propio; el icono del HUD sirve también en celular.
- Joystick abajo a la izquierda (zona muerta 12 %; velocidad plena desde el 55 % del radio; solo camina, para correr está el botón). Botones Correr y Ofrecer abajo a la derecha.
- Pellizco con dos dedos sobre el mapa para acercar o alejar; los botones + y − siguen disponibles.
- Botones ⟲ y ⟳ (en la columna de la derecha, debajo del zoom) giran la vista 45 grados a cada lado. Mismo efecto que Q y R.
- Botón de pantalla completa (⛶) y, en vertical, capa "Girá el teléfono" que pausa la partida hasta volver a apaisado.
- Clic o toque en el mapa para caminar hasta ese punto (ver abajo).
- Opciones > Controles en pantalla: **Joystick** (por defecto) o **Flechas**. El pad de flechas (▲ ◀ ▶ ▼) ocupa la misma esquina que el joystick, así que lo reemplaza y no se muestran los dos a la vez. Cada flecha suma su dirección mientras tenga un dedo encima. Si ya hay un dedo en el joystick, el pad lo ignora, y al revés (gana el primero que se usa hasta soltarlo). Las flechas no corren: CORRER sigue siendo el botón.
- Áreas táctiles de al menos 44 px en botones de menú, zoom, giro, selección y pad. `touch-action: manipulation` en todo el documento evita el zoom del navegador por doble toque; el canvas conserva `none` para sus gestos propios (joystick y pellizco).
- Menús: siempre centrados y dentro del alto visible, con scroll dentro de la tarjeta (ver "Experiencia móvil").

## Caminar con clic o toque (F9, G22)

- Un toque o clic en el mapa (sin arrastrar ni pellizcar, menos de 500 ms) calcula un camino hasta esa celda con el A* de `rutas.js` (8 direcciones, suavizado, tope `CAMINO_MAX_NODOS`; los peatones usan el mismo A*) y el jugador lo sigue. El camino se dibuja tenue (línea amarilla y un anillo en el destino).
- El clic se convierte a celdas con el giro de la vista (`aMundo`), así que coincide con lo que se ve girado (F7).
- Si el clic cae en un edificio, el agua o un árbol, el destino es la celda caminable más cercana (radio 6 celdas). Nunca se camina a una celda no caminable. Si no hay camino, aparece el aviso "No hay camino hasta ahí".
- La entrada manual cancela el camino: teclado, joystick o pad de flechas. También se cancela al llegar, al ser capturado, al pausar, al cambiar de pantalla y al empezar o cerrar una ronda. Si el jugador queda trabado (no avanza 0,3 celdas en 0,6 s, por ejemplo contra la esquina de un árbol) el camino se cancela solo.
- Un toque sobre el HUD (paneles, botones, joystick, minimapa) no dispara el camino.
- Antes de pisar delante de un auto que llega, el personaje espera y después sigue (`miraAlCruzar`, ver "Tránsito y atropello").
- La lógica está en `caminar.js` (sin DOM): `planearCamino`, `iniciarCamino`, `pasoCamino` y `cancelarCamino`. `controles.js` avisa el toque con `onToque`, y `main.js` lo convierte a celdas.

## Menú y pantallas

Pantallas de `index.html`, todas con id `pantalla*` y nombre en el router (`pantallas.js`):

| Nombre | Overlay | Qué muestra |
|---|---|---|
| `aviso` | `pantallaAviso` | Aviso de parodia (mismo texto que la 3D) y Continuar (va al título). Solo la primera vez: al continuar se guarda `2d_aviso`. Sin `localStorage` no falla, pero vuelve a aparecer en cada carga |
| `titulo` | `pantallaTitulo` | Jugar (va a Mercadería y arranca una partida nueva), Personaje, Cómo se juega, Opciones, Pantalla completa y la atribución del mapa |
| `mercaderia` | `pantallaMercaderia` | "¿Qué vas a vender?", panel de reposición (Ronda, Disponible, Ganancia última ronda, Tope de stock, Costo total), una tarjeta por producto con precio, estrellas y contadores − / + (los bloqueados se ven apagados con "Ronda N"), Reponer y salir a la calle, Volver al personaje y Mejoras del vendedor |
| `mejoras` | `pantallaMejoras` | Cinco mejoras con nivel y costo del siguiente, caja disponible y Volver a la mercadería |
| `personaje` | `pantallaPersonaje` | Personalizador del vendedor (D1): vista previa pixelart a escala entera, una fila por categoría (color de piel, color y estilo de pelo, color de ropa, accesorio y color de calzado), Al azar, Guardar y Volver. Se entra desde el título, desde la pausa (Cambiar personaje) y desde Mercadería (paso 1) |
| `opciones` | `pantallaOpciones` | Volumen y Silenciar (guardados, aplicados al audio; ver "Audio (D6)"), distancia de vista (guardada, sin efecto todavía), zoom inicial (aplica al empezar una partida), límite de FPS (30, 45, 60; aplica en el bucle de `main.js`) |
| `seleccion` | `pantallaSeleccion` | Selección de zona (F7, M8): minimapa de la ciudad completa y un botón por barrio. Aparece cada vez que se sale de Mercadería (en cada ronda). Sin elección en 10 s, la primera vez empieza en Microcentro y después sigue donde estaba |
| `ayuda` | `pantallaAyuda` | Cómo se juega: objetivo, ofrecer, visión y tabla de teclas (incluye Q y R para girar) |
| `pausa` | `pantallaPausa` | Seguir, Reiniciar, Opciones, Cómo se juega, Cambiar personaje y Salir al menú |
| `fin` | `pantallaFin` | Motivo ("¡Te atraparon!", "¡Te atropellaron!" o "Sin fondos para reponer"), desglose del puntaje, total, medalla, récord (global y del producto), compartir (botón y menú de redes oculto al inicio), Jugar de nuevo (partida nueva, economía inicial) y Menú (vuelve al título) |

- Esc o P abren la pausa durante una partida y la cierran. Esc cierra Opciones y Cómo se juega, y vuelve desde Personaje. Mientras la pausa está abierta, el juego no avanza.
- Jugar, Reiniciar y los cambios entre títulos, personaje y pausa usan un fundido corto (`#fundido`). Si el sistema pide reducir movimiento, el cambio es directo.
- La nav de pasos (`#pasos`: 1 Personaje, 2 Mercadería, 3 ¡A vender!) acompaña el flujo: Mercadería y Mejoras marcan "2", la calle marca "3". Se oculta en pantallas de poca altura (500 px o menos) y, en escritorio angosto (menos de 600 px), durante la calle. Desde 600 x 601 px queda arriba de las tarjetas de Personaje, Mercadería, Mejoras y selección de zona.
- Los ajustes se guardan en `localStorage` con la clave `2d_ajustes` (valores validados en `ajustes.js`).

## Audio (D6)

- **Origen:** `js/audio.js` de la 3D es síntesis pura con WebAudio, sin archivos. `vendedores_capital/assets/` no tiene sonidos, así que no se copió ningún recurso: `2d/js/audio.js` es el mismo código de síntesis, sin DOM, con la misma lógica (música por escena, arpegio, sirena por alerta y filtro en pausa).
- **Música:** arpegio de fondo que cambia con la escena: menú (más agudo) y partida. En partida, con alerta amarilla o roja sube el tempo; en rojo agrega bombo. La sirena suena mientras un agente persigue (nivel rojo) y se corta al bajar de nivel.
- **Pausa:** el filtro baja a 500 Hz (la música se apaga) y la sirena se corta. La pausa del menú y la del giro del celular en vertical usan lo mismo (`pausaAudio` en `main.js`).
- **Arranque:** el `AudioContext` se crea en el primer `pointerdown` o `keydown` (`audio.desbloquear()`, una sola vez por los listeners de `main.js`). Antes de eso no suena nada, que es lo que exigen los navegadores.
- **Volumen y silencio:** Opciones > Volumen (0 a 1) se aplica a música y efectos juntos (en la 3D eran dos valores que recibían el mismo número). Botón **Silenciar** (en Opciones cambia a "Activar sonido") corta todo, también la música y la sirena, sin cerrar el contexto. Los dos valores se guardan en `2d_ajustes` (`volumen` y `silencio`, validados en `ajustes.js`).
- **Clic:** cada botón de menú suena `clic` (listener global, como la 3D). Los botones de flechas y los táctiles (joystick, Correr, Ofrecer) no suenan, para no ensuciar la partida. Mover el volumen también suena `clic`.

Eventos y sonidos (`main.js`):

| Evento | Sonido | Dónde |
|---|---|---|
| Venta (un peatón compra; la compra y la venta son el mismo evento acá) | `venta` | `ofrecer()`, reacciones `comprar1` y `comprar2` |
| Insulto | `rechazo` | `ofrecer()`, reacción `insultar` |
| Llamado de agente | `alerta` | `ofrecer()`, reacción `llamado` |
| Sube una estrella / persecución | `alerta` y sirena (nivel rojo) | `procesarEventos()` y `pintarAlerta()` |
| Patrulla en escena (al entrar y cada 4 s cerca) | `patrulla` | `procesarEventos()` y `sonarVehiculos()` |
| Helicóptero (cada 0.5 s en escena) | `heli` | `sonarVehiculos()` |
| Escape (zafar) | `escape` | `procesarEventos()`, evento `zafe` |
| Captura (te quitan la mercadería) | `captura` | `procesarEventos()`, evento `atrapado` |
| Fin de partida (captura o sin fondos) | `rechazo` | `finPartida()` |
| Atropello | `atropello` | `finPartida()` |
| Auto que te ve (bocina, o frenada si no le alcanza) | `bocina` / `frenada` | `moverTransito()` |
| Auto que viene a menos de 10 celdas (cada 0.8 s) | `motor` | `moverTransito()` |
| Coima aceptada | `venta` | `cobrarCoima()` |
| Bonus de sigilo o de tiempo | `medalla` | `cerrarRondaJuego()` |
| Ronda cerrada | `victoria` | `cerrarRondaJuego()` |
| Cambio de jornada | `cuenta` | `cambiarMomento()` |

- **Desvíos:** la coima aceptada usa `venta` (la 3D no tiene coima) y la reacción "cortes" no suena (no estaba en la lista de eventos; en la 3D suena `rechazo`).

Pasos para probar el audio en navegador (los hace el humano):
1. Abrir la página y tocar algo: el primer toque arranca la música del menú y el botón suena `clic`. Antes del primer toque no hay sonido.
2. Opciones: mover Volumen: suena un clic y la música sube o baja. Recargar la página: el volumen se mantiene.
3. Opciones: Silenciar corta todo; "Activar sonido" lo devuelve. Recargar: el estado se mantiene.
4. Jugar: la música cambia a la de partida; al volver a Mercadería vuelve la de menú.
5. Ofrecer a un peatón: al vender suena `venta`; si insulta, `rechazo`; si llama a un agente, `alerta`.
6. Dejar que un agente te vea (amarillo) y después te persiga (rojo): aparece la sirena. Zafar suena `escape`; que te quiten la mercadería suena `captura`; el fin de partida suena `rechazo`.
7. Esc para pausar: la música se apaga (filtro) y la sirena se corta; Seguir la retoma.
8. Cerrar una ronda: suena `victoria`; al pasar a Mediodía suena el aviso de jornada (`cuenta`).

## Diferencias con la 3D

- **Ciudad:** el recorte real de CABA de 3 x 3 km desde OpenStreetMap, en una grilla de 600 x 600 celdas de 5 m (ver "Datos del mapa"). El agua no es caminable. Si los datos no cargan, se juega la ciudad procedural de `ciudad.js` (132 x 132, manzanas de 20 celdas, barrios ficticios en una grilla de 3 x 3, misma semilla de siempre).
- **Peatones y calles:** los peatones y los agentes caminan por cualquier celda no edificio (veredas, calles, parques). En la 3D los peatones usan cruces; hay tránsito de autos (ver "Tránsito y atropello"), pero no se modelan sendas ni semáforos y los autos frenan por ellos.
- **Cámara:** ortogonal cenital, siempre centrada en el jugador (con suavizado), con zoom por rueda o botones y rotación de la vista en pasos de 45 grados (Q y R, o los botones ⟲ ⟳). El zoom inicial se elige en Opciones. A diferencia de la 3D, la vista no sigue el rumbo del jugador: la entrada de movimiento es en pantalla (W avanza hacia arriba de la vista, sea cual sea el giro).
- **Campo de visión:** se dibuja como sector (90°) en el suelo. Quien persigue ve a 360° hasta `POLI_RADIO_PERS` (dibujado como círculo).
- **Coima:** portada de la 3D con balance propio (ver "Coima y patrulla (F5)" abajo). Si no hay coima posible o el agente la rechaza, la captura termina la partida (`capturado`) y se pierde toda la mercadería, como antes.
- **Fase de patrulla:** `POLI_FASE` 2 (vereda) por defecto; los agentes siempre caminan; no hay opción para dejarlos quietos.
- **Economía:** rondas, reposición, mejoras y precios por producto como en la 3D (ver "Economía por rondas" abajo). Las reacciones de los peatones usan la memoria por ronda y la `DEMANDA` del producto (ver "Peatones, memoria y jornadas" abajo).
- **Jornadas:** mañana, mediodía y tarde, con la noche deshabilitada como en la 3D. El tramo de cada momento es la duración de la ronda (`DURACION_RONDA` = 120 s) dividida en tres; la 3D usa un ciclo de partida distinto.
- **Alcance de ofrecer:** base 2.25 celdas y semiángulo de 90° (180° en total); la mejora suma 0.75 por nivel (3.0 y 3.75). La línea de visión (G8) aplica al cono: un edificio entre el jugador y el peatón lo bloquea (ver "Indicadores, pistas, modelos y cono (F8)").
- **Fin de partida:** por captura, por atropello (ver "Tránsito y atropello") o por "Sin fondos" (caja que no alcanza para el gasto fijo y una unidad de algún producto desbloqueado). Puntaje, medallas, récord y compartir como en la 3D (ver "Puntaje, medallas, récord y compartir (F6)" abajo).
- **Puntos por unidad:** 100 (`PTS_VENTA`), como la 3D. En F0 la 2D usaba 50 (`PTS_UNIDAD`), que se reemplazó.
- **Bonus de sigilo:** se da al cerrar cada ronda sin estrellas en esa ronda (en la 3D el flag es de la partida).
- **Nombres:** la reacción de la 3D que llama a la fuerza se llama `llamado` (no usa la palabra prohibida). El resto de constantes `POLI_*` conserva el nombre de la 3D para compararlas.

## Personaje del vendedor (D1)

- **Dibujo:** procedural, en `personaje.js` (sin imágenes ni librerías). Cada frame es una grilla fija de 12 x 16 píxeles (`spriteJugador`). Cuadros: `quieto`, `paso1` y `paso2` (la caminata alterna los dos mientras el jugador se mueve). Vista de frente si el heading mira hacia abajo de la vista, de espaldas si no. Los lentes solo se ven de frente.
- **Categorías:** `piel`, `peloColor`, `peloEstilo` (corto, largo, rapado), `ropa`, `accesorio` (sin accesorio, gorra, lentes) y `calzado`. Las opciones están en `OPCIONES_PERSONAJE`; el defecto es `PERSONAJE_DEFECTO`.
- **Pantalla:** el borrador se edita con los controles; Al azar lo reemplaza con `personajeAlAzar`; Guardar lo escribe; Volver descarta lo no guardado.
- **Jugador en la calle:** `render.js` dibuja el sprite del personaje guardado. La escala (`escalaSprite`) sale del radio de los peatones: el ancho del sprite iguala el diámetro de un peatón, con píxeles enteros de pantalla.
- **Persistencia:** localStorage con la clave `2d_personaje` (`CLAVE_PERSONAJE`). Lectura con try/catch: si la clave falta, está corrupta o el almacenamiento falla, se usa `PERSONAJE_DEFECTO`. Los valores inválidos de una clave parcial se reemplazan por el defecto, campo por campo.

## Constantes copiadas de la 3D (`index.html`)

Valores iguales a los de la Fase 3 (líneas aprox. 530 a 560 y 2490 a 2800):

| Constante | Valor | Dónde |
|---|---|---|
| `POLI_RADIO` / `POLI_FOV` | 8 celdas / 90° | `agentes.js` |
| `POLI_RADIO_PERS` | 10 celdas (360°) | `agentes.js` |
| `POLI_VIS_DT` | 0.1 s | `agentes.js` |
| `POLI_BARRIDO` / `POLI_BARRIDO_VEL` | 40° / 0.7 rad/s | `agentes.js` |
| `POLI_T_ALERTA` | 1 s | `agentes.js` |
| `POLI_VEL_PERS` | 5.5 celdas/s | `agentes.js` |
| `POLI_VEL_ALERTA` / `POLI_VEL_REG` | 4 / 3.5 celdas/s | `agentes.js` |
| `POLI_T_RUTA` / `POLI_BFS_FRAME` / `POLI_MAX_PERS` | 0.5 s / 3 / 12 | `agentes.js` |
| `POLI_R_PROP` (sin uso en el juego) / `POLI_R_AVISO` / `POLI_T_AVISO` | 12 / 15 / 15 s | `agentes.js` |
| `POLI_T_PERDER` / `POLI_DIST_SAFAR` | 5 s / 12 celdas | `agentes.js` |
| `POLI_CAPTURA` / `POLI_PAUSA_CAPT` | 0.5 celdas / 0.9 s | `agentes.js` |
| `POLI_DIRECTO` / `POLI_INTERCEPT` | 3 / [ (0,0), (7,0), (4,4), (4,-4) ] | `agentes.js` |
| `POLI_VEL_PAT` / `POLI_PAT_R` / `POLI_PAT_PAUSA` | 1.5 / 10 / 3 | `agentes.js` |
| `POLI_SIM` | 40 celdas | `agentes.js` |
| `POLI_FASE` | 2 (vereda); 1 = esquina | `agentes.js` |
| `COIMA_FRAC` | 0.6 (3D: 0.5), solo para el dinero | `config.js` |
| `COIMA_ACEPTA` / `COIMA_CD` | 0.55 / 8 s (3D: 0.6 / 3 s) | `config.js` |
| `POLI_VENTA_VENTANA` | 1.5 s | `agentes.js` |
| `SPEED` / `RUN_SPEED` | 4.5 / 7.5 celdas/s | `config.js` |
| `OFR_RADIO` / `OFR_MED_ANG` / `OFR_CD` / `OFR_PAUSA` | 2.25 / 90° / 0.6 s / 1.5 s (2D; la 3D usa 1.5 / 24°, D8) | `config.js` |
| `PTS_ESCAPE` / `PTS_BONUS_SIGILO` | 300 / 500 | `config.js` |
| `AG_COL` (`POLI_COL` en `render.js`) | amarillo / naranja / rojo | `config.js` |

Constantes de economía, energía y mejoras (copiadas de la 3D, F2):

| Constante | Valor | Dónde |
|---|---|---|
| `PRECIOS` / `DEMANDA` / `ORDEN_DESBLOQUEO` | medias 5000, empanadas 2000, churros 1500, figuritas 290, paltas 1000 / 1, 1.2, 1.2, 0.9, 0.8 / figuritas, churros, empanadas, medias, paltas | `productos.js` |
| `STOCK_BASE` / `STOCK_PASO` / `STOCK_MAX` | 30 / 2 / 40 | `config.js` |
| `COSTO_FRAC` | 0.5 (3D: 0.4) | `config.js` |
| `CARRITO_BONO` / `CAP_MAX` | [0, 2, 5] / 45 | `config.js` |
| `CONOC_DESC` | [0, 0.10, 0.20] | `config.js` |
| `RESIST_MULT` | [1, 0.8, 0.65, 0.5] | `config.js` |
| `RUN_PASO_NIVEL` / `RUN_SPEED_TOPE` | 0.5 / 8.5 | `config.js` |
| `OFR_RADIO_MAX` / `OFR_PASO` | 3.75 / 0.75 | `config.js` |
| `ENERGIA_MAX` / `CONS_CORRER` / `CONS_MIN` | 100 / 12 / 5 | `config.js` |
| `REC_QUIETO` / `REC_CAMINA` / `UMBRAL_REINICIO` | 20 / 8 (3D: 10) / 30 | `config.js` |
| `CAPITAL_INI` / `BASE_MEJ` / `MEJORAS` | 4350 / 5800 / factores del balance (ver abajo) | `economia.js` |

Constantes que no se copiaron: `POLI_SEP` (separación en la vereda, solo para la 3D), `POLI_EXC_N` (límite de "!" del DOM en la 3D), `COIMA_DECAE` y `COIMA_MIN` (propias), `CLAVE_RECORD`, `BUB_*`, `T_BONUS_*` (bonus de tiempo, F6).

## Economía por rondas (F2)

- **Flujo:** Jugar (o Reiniciar, o Jugar de nuevo) arranca una partida nueva con la economía inicial y muestra Mercadería. Reponer y salir a la calle compra el stock de la ronda y arranca la calle. Al vender todo el stock, se espera 2.5 s, se liquida la ronda ("Ronda cerrada: ganancia $X") y se vuelve a Mercadería.
- **Caja:** un solo saldo (`caja`). La reposición descuenta el costo; las ventas de la ronda se suman a la caja al cerrarla. La ganancia es ingresos menos costo.
- **Lotes:** cada reposición genera como máximo 1 + nivel de Carrito lotes (un tipo de producto por lote). Cada lote guarda lo comprado y lo que queda en mano.
- **Stock y tope:** la ronda 1 permite 30 unidades; cada ronda suma 2, hasta 40. El Carrito suma 2 o 5 (máximo 45). Por reposición se puede comprar de 1 tipo de producto, y 2 o 3 con el Carrito.
- **Desbloqueo:** un producto se desbloquea por ronda, en el orden figuritas, churros, empanadas, medias, paltas. Es el producto inicial.
- **Costo:** 50 % del precio, con el descuento de Conocimiento de proveedores (−10 % y −20 %). Además cada reposición paga un gasto fijo de $600 + $300 por ronda (visible en Mercadería; cuenta en la ganancia).
- **Producto activo:** es el que se ofrece y vende. Al reponer queda el primer lote en orden de desbloqueo. Con la tecla **F** o un clic en el icono del HUD pasa al siguiente producto con stock (cíclico; no hace nada si solo queda un producto). Si el activo se agota, pasa solo al siguiente con stock; si no queda ninguno, la ronda se cierra. El HUD muestra el icono, `x<n>` con las unidades en mano del activo y una barra con un segmento por unidad comprada en el lote.
- **Mejoras:** Carrito, Alcance de ofrecer (2 niveles), Velocidad al correr (2 niveles), Resistencia (3 niveles, multiplica el consumo de energía al correr) y Conocimiento de proveedores (2 niveles). Se conservan entre rondas y se reinician en una partida nueva. Los costos base son proporcionales a `BASE_MEJ` y suben 15 % del precio base por ronda (`MEJ_INFLA`).
- **Energía:** se gasta solo corriendo y cada arranque cuesta 4 (`CONS_ARRANQUE`) y se recupera, tras 1 s sin correr (`REC_DEMORA`), quieto (20/s) o caminando (8/s) (`energia.js`). Al llegar a 0 queda "sin correr" hasta 30 %. El HUD la muestra.
- **Sin fondos:** al cerrar la ronda, si la caja no alcanza para el gasto fijo más una unidad de ningún producto desbloqueado, termina la partida con el motivo "Sin fondos para reponer". Las mejoras pueden dejar la caja por debajo de ese costo: en Mercadería el botón pasa a "Reiniciar" y termina la partida con el mismo motivo.
- **Captura:** pierde la mercadería de la ronda y reinicia la economía (como en la 3D).
- **Persistencia:** la economía se guarda en `localStorage` con la clave `vendedores_capital_2d_economia` (caja, ronda, última ganancia, ventas de la ronda, mejoras). Los datos inválidos vuelven a la economía inicial. Todo acceso va en try/catch.
- **Diferencias con la 3D:** el HUD muestra "Dinero" como ingresos de la ronda (igual que la 3D). La comprobación de "sin fondos" usa solo los productos desbloqueados (en la 3D, todos; el mínimo es figuritas en ambos casos). La energía se muestra como texto en el HUD; la 3D usa una barra.

## Peatones, memoria y jornadas (F4)

- **Memoria por ronda:** cada peatón tiene `mem` (en `peatones.js`). Estados: **N** neutral (nunca ofrecido; pesos de `REACCIONES`), **I** interesado (ignoró o cortés; la compra baja y el insulto sube con cada ofrecimiento), **C** compró (la compra extra baja y el insulto sube), **M** molesto (insultó o contagiado; vuelve a I tras 45 s sin contacto), **P** ya ofrecido, no insistir (no elegible: tope de ofrecimientos o de compras), **A** alerta (llamó a los agentes; no elegible).
- **Reinicio:** la memoria se reinicia en cada ronda (`reiniciarMemoria` al empezar la ronda). Se pierde al reciclar el peatón: los que quedan a más de 30 celdas del jugador se reemplazan por uno nuevo, con memoria N.
- **Reacciones:** la compra (`comprar1`, `comprar2`) multiplica su peso por `DEMANDA[producto]` y por la `dem` del momento del día. Las unidades que se venden son las que el jugador tiene en mano; sin mercadería, la reacción es `ignorar`.
- **Contagio por insulto:** un insulto sube +0.05 la probabilidad de insultar (y baja lo mismo la de ignorar) de los peatones a 3 celdas o menos, durante 10 s. Los valores vienen del plan de mejoras (radio 3, +0.05, 10 s); el plan no fija 0.2 para el bono.
- **Jornadas (`jornada.js`):** mañana (demanda 0.7, 60 % de los peatones), mediodía (1.3, 100 %) y tarde (1.0, 80 %). La duración de la ronda (120 s) se divide en tres tramos de 40 s; después del último queda en tarde. Cada ronda arranca en mañana. El HUD muestra el momento junto al número de ronda. Al cambiar, la cantidad de peatones se ajusta y el cielo y la niebla pasan a los colores del momento con transición suave (`render.js`).
- **Valores propios de la 2D** (en `config.js`): reciclado a más de 30 celdas, aparición a 12-24 celdas del jugador, revisión del reciclado cada 5 s, y duración de la ronda para las jornadas.

## Coima y patrulla (F5)

- **Coima (`coima.js`):** al capturar (un agente o una patrulla) se tira la aceptación y, si acepta, se propone una coima (sin cooldown: se ofrece siempre). Paga `COIMA_FRAC` (60 %) del valor de la mercadería, limitado a lo vendido en la ronda; si queda por debajo de `COIMA_MIN` ($500) no hay coima. Probabilidad de aceptación `COIMA_ACEPTA` (55 %) x `COIMA_DECAE` (0.6) por cada coima ya aceptada en la partida. Aceptada: no hay captura, la búsqueda termina para todos (0 estrellas, los agentes vuelven, se van patrullas y helicóptero; no suma puntos ni cuenta como zafada) ; `COIMA_CD` (8 s) se sigue seteando pero ya no bloquea nuevas ofertas. Rechazada, sin nada para pagar o "no pagar": la captura termina la partida.
- **Tras aceptar:** 0 estrellas y, durante `COIMA_CIEGO` (10 s, `config.js`), agentes y patrullas no te ven: ventas, carreras y llamados de peatones no suman estrellas (el agente llamado igual va al lugar). Mientras dura la ceguera los conos de visión de los agentes se pintan en verde (`render.js`, `colorCono`, lee `G.ciegoT`).
- **Diálogo de elección (opción B):** al capturar, primero se tira el dado (`tirarAceptacion`, con el decaimiento). Si el agente rechaza, la captura termina la partida sin diálogo. Si acepta (y hay algo para pagar), la partida se congela y el overlay `pantallaCoima` ofrece: **pagar con mercadería** (la mitad de las unidades del producto activo, `ceil(stock / 2)`, siempre queda 1: con stock 1 queda deshabilitada aunque haya dinero; stock 2 -> 1, 3 -> 2, 4 -> 2), **pagar con dinero** (60 % del valor de la mercadería, limitado a lo vendido, mínimo `COIMA_MIN`) o **no pagar** (termina la partida). Cada opción muestra qué se paga o el motivo por el que está deshabilitada. La probabilidad no se muestra. Elegir pagar ya no vuelve a tirar. Se eliminaron `ofrecerCoima`, `COIMA_MODO` y `COIMA_MOSTRAR_PROB`.
- **Flujo técnico:** `sim.coima(p)` (agentes.js) puede devolver `true`/`false` como antes o `'pendiente'`: `G.coimaPend` congela `stepAgentes` y descarta otras capturas simultáneas (un solo diálogo). main.js responde con `resolverCoima(sim, aceptada, pl)`: aceptada aplica cooldown, ceguera y limpieza de búsqueda; no aceptada inicia la captura normal. La lógica pura está en `coima.js` (`opcionesCoima`, `elegirCoima`, `tirarAceptacion`).

## Puntaje, medallas, récord y compartir (F6)

- **Puntos por venta (G18):** `PTS_VENTA` = 100 por unidad vendida. **Escape:** `PTS_ESCAPE` = 300 x (1, 1.5, 2, 2.5, 3) según las estrellas con las que se zafa.
- **Bonus de sigilo:** `PTS_BONUS_SIGILO` = 500 al cerrar cada ronda sin ninguna estrella en esa ronda.
- **Bonus de tiempo:** hasta `PTS_BONUS_TIEMPO` = 500 x (1 + 0.25 x (ronda - 1)) al cerrar la ronda. El tiempo de referencia `T_BONUS` = `T_BONUS_BASE` (120 s) + `T_BONUS_POR_U` (6 s) por unidad comprada en esa ronda. El bonus baja linealmente a 0 en `T_BONUS` y no baja de 0. Usa el tiempo de la ronda (no la duración de las jornadas, `DURACION_RONDA`).
- **Puntaje en el HUD:** suma venta + escapes + bonus de sigilo + bonus de tiempo. El desglose de la pantalla de fin usa las mismas cuentas, así que su total coincide con el HUD.
- **Medallas (G19):** bronce desde 8000, plata desde 20000 y oro desde 40000 (`MEDALLA_MIN`). Debajo de 8000 no hay medalla.
- **Récord (G20):** dos récords en `localStorage`, con claves propias de la 2D: `2d_record` (global) y `2d_record_<producto>` (por producto, con el último producto vendido en la partida). Se actualizan solo al terminar la partida (captura, atropello o sin fondos), y solo si el puntaje es mayor que 0 y supera el récord guardado.
- **Compartir (G21, decisión D5):** la pantalla de fin muestra WhatsApp, X, Facebook y Telegram, cada uno con su icono, y un botón "Compartir resultado" que abre el menú nativo (`navigator.share`) o, si no existe, copia el texto con el enlace. El texto tiene el motivo, el producto, el puntaje y la medalla, sin nombre ni otros datos personales. Los enlaces se arman solo en el cliente; el único envío es el enlace que el jugador abre. "Copiar" usa `navigator.clipboard` y, si no está disponible, un campo temporal con `execCommand`.
- **Diferencias con la 3D:** no hay animación de conteo ni de filas en la pantalla de fin; el récord no se muestra todavía en el título.

## Ciudad por barrios, minimapa y cámara (F7)

- **Barrios (G27, decisión D2):** en el mapa real son Balvanera, Monserrat, San Nicolás, San Telmo, Recoleta, Retiro y Puerto Madero (`meta.barrios`). Cada uno toma un perfil visual de `BARRIOS` (`PERFIL_REAL`): San Nicolás como Microcentro, Monserrat como Centro, Retiro como Belgrano (otro color), Puerto Madero como Microcentro en vidrio, Balvanera como Almagro; San Telmo y Recoleta con el suyo. En la ciudad de respaldo siguen los 9 barrios en 3 x 3 bloques de 44 x 44 celdas (`zonaDe`, índice `fila * 3 + columna`).
- **Suelo de barrio:** calles, veredas y parques se tiñen con el color del barrio mezclado 14 % con el terreno. Los techos usan la paleta del perfil.
- **Variedad por barrio:** la tabla `VARIEDAD` de `barrios.js` agrega a cada perfil `gente` (multiplicador de aparición de peatones: Microcentro 1,6, Centro 1,4, Barracas 0,6, Parque 0,7; `crearPeaton` reintenta hasta 3 veces si cae en un barrio con menos gente y como los peatones lejanos se reciclan cerca del jugador, la densidad se nota al recorrer), `verde` (arbustos y canteros pintados en veredas), `copa` (tonos de copa de los árboles), `tinte` (fuerza del color del barrio en el suelo, 0,16 a 0,26 en lugar del 0,14 fijo) y `rasgo` (detalle pintado en `rasgoVereda` de `render.js`: toldos de feria en San Telmo y Almagro, muros de colores en La Boca, óxido en Barracas, reflejos de vidriera en Microcentro y Centro, canteros con flores en Parque y Recoleta). Los barrios reales heredan estos datos de su perfil base. No hay demanda de productos por barrio: `DEMANDA` es igual en toda la ciudad. La luz de la jornada sigue siendo la capa de pantalla de siempre (el mapa horneado no cambia con la hora).
- **Minimapa (G28):** esquina superior derecha, a la izquierda de la columna de botones. Muestra ±30 celdas alrededor del jugador, con el barrio tintado (en el mapa real también los edificios, y el agua en azul), el jugador (triángulo que indica su rumbo en la vista) y los agentes (amarillo, naranja o rojo según el estado). **Arriba del minimapa es arriba de la vista**, que gira con la cámara (Q, R o botones); el texto de la decisión "arriba = hacia donde mira el jugador" no se cumple tal cual, porque en la 2D la cámara no sigue el rumbo: el triángulo muestra el rumbo.
- **Zona en el HUD (G29):** la línea "Barrio" del panel superior muestra el barrio de la celda del jugador. Se reescribe solo cuando cambia.
- **Rotación (G30):** Q y R giran la vista 45 grados (una pulsación por tecla, sin repetición). Los botones ⟲ y ⟳ hacen lo mismo en celular. El mapa, los agentes, el cono de ofrecer, las flechas y el minimapa se dibujan con el mismo giro, y la entrada de movimiento se convierte a coordenadas de la ciudad.
- **Selección de zona (M8, decisión):** cada vez que se sale de Mercadería aparece la pantalla de selección, con el mapa de la ciudad completa (sin rotación, barrios atenuados salvo el elegido, nombres en sus centroides en el mapa real) y un botón por barrio. Tocar una zona del mapa o un botón posiciona al jugador en la celda caminable más cercana al centro del barrio (`celdaCaminableMasCerca`) y arranca la ronda. Si no se elige, en 10 s se empieza en el barrio del Obelisco (San Nicolás; Microcentro en la ciudad de respaldo). Las rondas siguientes salen directo, sin pantalla de zona.
- **Carga (G32):** al arrancar se descargan los datos del mapa (unos 1,1 MB) con el aviso "Cargando el mapa de la ciudad…" (`#cargando`). Si la descarga o los datos fallan, se genera la ciudad de respaldo y queda un aviso en la consola. No hay barra de progreso.
- **Diferencias con la 3D:** los barrios no tienen su rectángulo de 200 celdas ni los parámetros de juego de la 3D (peatones, agentes, demanda, elementos): la 2D solo usa el color y el nombre. No hay botón de "ajustar" (`btnFit`) en la cámara. El cambio de zona caminando todavía no existe (la zona se elige solo al empezar la partida).

## Indicadores, pistas, modelos y cono (F8)

- **Flecha amarilla al objetivo (G23):** el peatón elegible más cercano dentro del cono de ofrecer (alcance, semiángulo y línea de visión) lleva una flecha amarilla sobre la cabeza. Solo aparece cuando hay un objetivo. La selección vive en `buscarObjetivoOfrecer` (peatones.js), la usan `ofrecer()` y el render, así que lo que se marca es lo que se vende.
- **Luces de alerta (G24):** en el HUD, tres luces verde, amarilla y roja con el texto "Tranquilo", "¡Te vieron!" o "¡Persecución!". Es el mismo criterio que la 3D: rojo si hay perseguidores o vehículos, amarillo si algún agente está en alerta visual (no yendo a un aviso), verde si no. Cuando un perseguidor queda fuera de la pantalla, una flecha roja en el borde la señala (el perseguidor más cercano).
- **Pistas (G25):** cuatro pistas de tutorial, cada una una sola vez, en un cartel bajo el HUD: `ofrecer` (aparece el primer objetivo), `venta` (primera venta), `agente` (la primera vez que un agente pasa a amarillo o rojo) y `corre` (correr dentro del cono de un agente). Se guardan en localStorage con la clave `2d_pistas` (objeto `{ id: true }`); con almacenamiento que falla, se muestran una vez por sesión. No comparten clave con las pistas de la 3D.
- **Modelos diferenciados (G35):** los agentes se ven como una silueta con chaleco del color de su estado (amarillo en patrulla o regreso, naranja en alerta, rojo en persecución), cabeza (piel y pelo variados, `aspectoAgente`) y gorra oscura con banda del color del estado, en el frente hacia donde miran, y su cono de visión. Los transeúntes son un cuerpo con la ropa (uno de `COLORES_PEAT`), cabeza clara y una pastilla con la letra de su memoria (N, I, C, M, P, A) a un costado. Los colores están en `config.js` (`AG_COL`, `AG_GORRA`, `PIEL`, `MEM_COL`, `OBJ_OFR_COL`).
- **Cono de venta (G34, D8):** el cono se dibuja con `radioOfrecer(econ)` y `OFR_MED_ANG`, los mismos valores que usa `ofrecer()`, así que su borde coincide con el alcance real. Se dibuja tenue. La línea de visión no se dibuja (el cono no se recorta por los edificios): un peatón detrás de un edificio cae dentro del dibujo pero no se puede ofrecer.

## Búsqueda (estrellas), agentes en cada esquina y balance

**Reparto uniforme de policías.** `distribuirAgentes` pone tantos policías como esquinas (`esquinasAgentes`) más un 40 % (`AG_REFUERZO`) y un 25 % (`AG_FIJOS`): unos 1230 en el mapa real y 49 en la ciudad procedural. `repartirUniforme` divide el mapa en una grilla y coloca uno por cuadro con vereda, lo más cerca posible de su centro. Además, toda manzana (`manzanasConVereda`, desde `MANZANA_MIN` celdas) tiene al menos uno: se agrega donde la grilla no puso ninguno. Los fijos (1 de cada 5) se intercalan en la grilla; persiguen y acuden como el resto y vuelven a su lugar. `activarAgentes` solo crea los de las esquinas a menos de `BUSQ_R_ACTIVA` (40 celdas) del jugador, con tope `BUSQ_MAX_ACTIVOS` (24), más los que estén persiguiendo; los lejanos no existen en `sim.agentes`. La procedural los tiene todos activos.

**Atentos y distraídos.** Todos están en su esquina, pero solo una fracción ve ventas y carreras: 60 % en la ronda 1, +5 % por ronda, tope 100 %. Los distraídos son grises y sin cono; acuden a un llamado y se suman a una persecución.

**Estrellas (0 a 5).** +1 por ofrecer a la vista de un agente, se concrete o no la venta (`ofertaVista`, que además pone a perseguir a todos los que lo ven) y +1 por empezar a correr (flanco) a la vista de un agente que todavía no estaba alertado (correr ante uno ya alertado no suma); cooldown de 2 s por motivo.

**Contagio de persecución.** Un agente atento en patrulla o regreso que ve en su cono a otro que persigue se suma (`sumarseSiVe`), aunque supere la respuesta del nivel (tope `POLI_MAX_PERS`). No suma estrellas.

**Sin atascos.** Los agentes no pisan celdas fuera de la grilla del A* (árboles incluidos), solo van en línea recta si el tramo es caminable y, si pasan `POLI_TRABA_T` (1.5 s) sin avanzar, recalculan en el acto y como último recurso saltan al punto siguiente (`destrabar`).

**Llamado de un peatón.** Siempre va hasta el lugar al menos un agente libre (el más cercano), corriendo a la velocidad de persecución (`velPersecucion`), haya o no estrellas, incluso durante la ceguera por coima. Mientras va, no suelta el llamado (zafar o pagar coima no lo cancelan) hasta llegar al lugar y volver a su esquina. Apenas el jugador entra en su visión (salvo durante la ceguera por coima), fija la persecución en él, sin esperar a llegar; suma una estrella (motivo venta).

**Correr en un cono.** Si un agente atento (o en alerta) ve al jugador corriendo, pasa a persecución en el acto (`vioCorrer`), aunque la respuesta del nivel ya esté cubierta (tope `POLI_MAX_PERS`). Correr solo suma estrella si alerta a un agente que todavía no estaba alertado (ni en `alerta` ni en `persecucion`).

| Estrellas | A pie | Patrullas | Helicóptero | Zafar: tiempo / distancia | Puntos |
|---|---|---|---|---|---|
| 1 | 1 | 0 | no | 5 s / 12 | 300 |
| 2 | 2 | 0 | no | 5.75 s / 13 | 450 |
| 3 | 4 | 1 | no | 6.5 s / 13.9 | 600 |
| 4 | 4 | 2 | no | 7.25 s / 14.9 | 750 |
| 5 | 4 | 2 | sí | 8 s / 15.8 | 900 |

- **Cantidad exacta:** "a pie" cuenta persiguiendo y en alerta visual ("!"). No hay propagación entre agentes: un director completa el número con los testigos y luego los más cercanos a la última posición vista (activando esquinas lejanas si faltan).
- **Llamado de un peatón:** siempre va al menos el agente libre más cercano. Sin estrellas, además van todos los que estén a 15 celdas (no cuentan como perseguidores); el primero que ve al jugador suma una estrella (motivo venta) y los demás vuelven, salvo el más cercano. Con estrellas va uno solo y se actualiza la última posición vista.
- **Última posición vista:** mientras un perseguidor, una patrulla o el helicóptero lo ve, todos conocen su posición. Si no, los agentes van al último punto y buscan a 8 celdas; las patrullas van a la calle más cercana a ese punto; el helicóptero vuela hacia allí.
- **Patrullas (`vehiculos.js`):** solo por la red principal de calles, con el A* de `rutas.js` (mismo presupuesto de nodos por frame que los agentes). 8.5 celdas/s en recta, 2.5 al girar; capturan si el jugador está en la calle a menos de 0.7. La segunda corta más adelante. Ven a 10 celdas con línea de visión.
- **Helicóptero:** 6.2 celdas/s, círculo de visión de 7, no captura; a los 30 s se retira y no vuelve hasta la próxima búsqueda.
- **Fin de la búsqueda:** zafar, coima aceptada, captura, fin de ronda o reinicio dejan 0 estrellas y quitan los vehículos.
- **HUD y mapa:** 5 estrellas junto a las luces de alerta (parpadean al subir); flecha de borde por cada perseguidor fuera de pantalla y marcas en el minimapa.

**Balance por ronda.** Visión 8 + 0.25 (tope 9.5); velocidad de persecución 5.5 + 0.05 (tope 6.0).

| Constante | Valor | Dónde |
|---|---|---|
| `AG_FRAC_INI` / `AG_FRAC_PASO` | 0.6 / 0.05 | `agentes.js` |
| `POLI_RADIO_PASO` / `POLI_RADIO_TOPE` | 0.25 / 9.5 | `agentes.js` |
| `POLI_VEL_PERS_PASO` / `POLI_VEL_PERS_TOPE` | 0.05 / 6.0 | `agentes.js` |
| `BUSQ_CD` / `BUSQ_T_PASO` / `BUSQ_D_PASO` / `BUSQ_PTS_PASO` | 2 s / 0.15 / 0.08 / 0.5 | `busqueda.js` |
| `BUSQ_R_ACTIVA` / `BUSQ_MAX_ACTIVOS` / `BUSQ_CUBETA` | 40 / 43 / 16 | `busqueda.js` |
| `AG_FIJOS` | 0.25 (25 % más policías, fijos) | `agentes.js` |
| `AG_REFUERZO` | 0.4 (40 % más policías que esquinas; `distribuirAgentes`) | `agentes.js` |
| `VEH_VEL_RECTA` / `VEH_VEL_GIRO` / `VEH_CAPTURA` | 8.5 / 2.5 / 0.7 | `vehiculos.js` |
| `HELI_VEL` / `HELI_R` / `HELI_T_ESCENA` | 6.2 / 7 / 30 s | `vehiculos.js` |
| `GASTO_RONDA` / `GASTO_PASO` / `MEJ_INFLA` | 600 / 300 / 0.15 | `config.js` |
| `REC_DEMORA` / `CONS_ARRANQUE` | 1 s / 4 | `config.js` |
| `COIMA_DECAE` / `COIMA_MIN` | 0.6 / 500 | `config.js` |
| `BONUS_TIEMPO_ESCALA` | 0.25 | `config.js` |
| Factores de mejoras (x `BASE_MEJ`) | carrito 1.5, 3; alcance 1, 2; velocidad 1.2, 2.2; resistencia 0.8, 1.4, 2; proveedores 0.6, 1.4 | `economia.js` |

`node 2d/tools/simular_balance.mjs` compara los valores anteriores, la propuesta y lo aplicado (modelo probabilístico: sirve para comparar, no predice partidas reales).

## Tránsito y atropello

Lógica en `transito.js` (sin DOM); dibujo en `render.js` (`dibujarAuto`); sonidos y fin de partida en `main.js` (`moverTransito`).

- **Autos:** circulan por la red principal de calzadas (`ciudadCalles` de `vehiculos.js`), por la mano derecha y en los dos sentidos (no se usa el sentido real de las calles). Cada uno tiene decididas por delante las próximas celdas: sigue las calles torcidas, a veces dobla en un cruce y solo sin otra salida vuelve para atrás.
- **Pool:** hasta `TR_AUTOS` (24; 14 con calidad baja) cerca del jugador. Aparecen fuera de la vista, a 18 celdas o más (el anillo crece con el zoom alejado, hasta 34), y se quitan al quedar lejos. Con el zoom muy alejado en pantallas grandes la vista supera ese tope y un auto puede aparecer en pantalla, siempre a 34 celdas o más.
- **Mirar antes de cruzar:** el conductor mira `TR_MIRA` (12) celdas de su recorrido. Si el jugador está en la calzada sobre ese recorrido, toca bocina, tarda `TR_REACCION` (0.4 s) en reaccionar y frena. Con margen se detiene antes; si el jugador se mete muy cerca, no llega. No importa hacia dónde mira el personaje: "sin mirar" es meterse delante sin fijarse en los autos.
- **Atropello:** solo con el frente del auto, a más de `TR_V_ATROPELLO` y con el jugador en una celda `road`. La vereda es siempre segura; chocar caminando contra el costado o contra un auto detenido no hace nada. Termina la partida con el motivo "¡Te atropellaron!" y reinicia la economía, igual que la captura; puntaje, récord y compartir son los de siempre.
- **Avisos:** autos visibles con faros y luces de freno; flecha blanca con borde rojo en el borde de la pantalla para el que viene hacia el jugador desde fuera de la vista; sonidos de motor, bocina y frenada; pista de tutorial la primera vez que tocan bocina.
- **Sin peligro inmediato:** al empezar la ronda no hay autos, hay `TR_GRACIA` (3 s) sin atropello y el jugador aparece fuera de la calzada si hay lugar a 12 celdas. Durante la captura, el diálogo de coima, la pausa y la espera de cierre de una ronda ya vendida no hay atropello.
- **Camino por clic o toque:** el personaje "mira": espera si más adelante pisaría el paso de un auto que llega en menos de `TR_PASO_T` (0.8 s). Si ya está en ese paso, sigue para salir. Con teclado, joystick o flechas no hay ayuda.
- **Peatones y agentes:** los autos frenan en seco por ellos y nunca los atropellan; si uno queda trabado `TR_ESPERA_MAX` (4 s) por un peatón, un agente u otro auto, pasa a través durante 2 s. Su movimiento no cambia. Las patrullas y el tránsito se ignoran entre sí (pueden superponerse), igual que dos autos que vienen cruzados en algunas esquinas.

| Constante (`config.js`) | Valor |
|---|---|
| `TR_AUTOS` / `TR_AUTOS_BAJA` | 24 / 14 |
| `TR_VEL_MIN` a `TR_VEL_MAX` / `TR_VEL_GIRO` | 4.2 a 5.4 / 2.8 celdas/s |
| `TR_ACEL` / `TR_FRENO` | 3 / 9 celdas/s² |
| `TR_REACCION` / `TR_MIRA` / `TR_MARGEN` | 0.4 s / 12 / 0.5 celdas |
| `TR_V_ATROPELLO` / `TR_LARGO` x `TR_ANCHO` / `TR_CORREDOR` | 1.8 / 1.6 x 0.75 / 0.6 |
| `TR_SPAWN_MIN` / `TR_SPAWN_MAX` / `TR_SPAWN_ANCHO` / `TR_LEJOS_EXTRA` | 18 / 34 / 14 / 8 celdas |
| `TR_GRACIA` / `TR_ESPERA_MAX` / `TR_PASO_T` | 3 / 4 / 0.8 s |

`test_transito.mjs` imprime una referencia de balance: en 400 cruces simulados a pie, la proporción de atropellos sin mirar (del orden del 4 al 11 %) y mirando.

## Pruebas

```
node 2d/tools/correr_todo.mjs     # corre todos los test_*.mjs (en orden alfabético); código 0 si todos pasan, 1 si alguno falla
node --check 2d/js/*.js           # sintaxis de los módulos (la expansión de * la hace bash)
node --check 2d/tools/*.mjs
```

Pruebas individuales (cada una sale con código 1 si falla alguna):

```
node 2d/tools/test_agentes.mjs
node 2d/tools/test_audio.mjs
node 2d/tools/test_camino.mjs
node 2d/tools/test_ciudad.mjs
node 2d/tools/test_coima.mjs
node 2d/tools/test_economia.mjs
node 2d/tools/test_humo.mjs          # arranca main.js con DOM y canvas falsos (Node 22.15 o más)
node 2d/tools/test_integracion.mjs   # estrellas, pool de esquinas, patrullas, última posición vista y rendimiento
node 2d/tools/test_ofrecer.mjs
node 2d/tools/test_peatones.mjs
node 2d/tools/test_puntaje.mjs
node 2d/tools/test_transito.mjs
```

`correr_todo.mjs` se eligió en lugar de un script de npm para no agregar dependencias ni comandos a `package.json`; funciona igual con Node sin instalar nada.

- `test_agentes.mjs`: una ciudad sintética y abierta para FOV, línea de visión, correr visto, persecución, safar y captura, y la ciudad generada para la patrulla; patrulla 1 (quietos en la esquina, sin moverse, con barrido y alerta/persecución) y reinicio de la patrulla.
- `test_economia.mjs`: venta y caja, reposición parcial, cierre de ronda, desbloqueo, sin fondos, tope de stock, costo con proveedores, mejoras, persistencia con storage simulado (y con storage que lanza error), los valores copiados de la 3D, lotes por reposición (tope 1 + Carrito), cambio de producto con F y agotamiento automático del producto activo.

- `test_audio.mjs`: con un AudioContext simulado, `sfx` con nombre desconocido (y de Object.prototype) no lanza, el volumen se recorta a 0..1 (y NaN o texto se ignoran), `silenciar(true)` deja la ganancia maestra en 0 y no sintetiza nada, `desbloquear` crea el contexto una sola vez y lo reanuda si quedó suspendido, y sin AudioContext todo es no-op sin error.

- `test_camino.mjs`: clic para caminar con la ciudad generada (el camino llega a la celda clicada y recorrido con colisiones llega al destino), destino no caminable reemplazado por la caminable más cercana, rodeo de un muro con hueco (largo de la ruta suavizada), entrada manual que cancela el camino (lógica pura) y cancelación por trabado.
- `test_coima.mjs`: modo dinero limitado a la caja de la ronda, modo producto (mitad del stock, siempre 1 unidad), tirada de aceptación determinista, diálogo de elección, sin cooldown, captura sin coima (termina la partida), coima rechazada, coima aceptada (el agente vuelve a su esquina y hay cooldown).

- `test_peatones.mjs`: transiciones de la memoria (N, I, C, M, P, A y decaimiento M a I), probabilidades que suman 1, DEMANDA y momento en la compra (con muestreo), contagio en radio 3 y su caducidad, reinicio por ronda, reciclado, cantidad de peatones por momento y cambio de momento según el tiempo de la ronda.

- `test_ofrecer.mjs`: alcance base 2.25 y +0.75 por nivel de la mejora Alcance (3.0 y 3.75, con tope), semiángulo de 90°, objetivo más cercano dentro del cono (fuera de cono o detrás no entra, pausa y estado P se saltean), línea de visión que bloquea al peatón detrás de un edificio, y pistas de una sola vez con storage simulado (y con storage que lanza error o trae basura).

- `test_ciudad.mjs`: misma semilla da la misma ciudad (y otra semilla da otra), `zonaDe` reparte en los 9 barrios de 44 x 44 celdas con la regla fila * 3 + columna, cada barrio tiene celdas caminables y su posición inicial (celda caminable más cercana al centro) cae dentro de su zona, y el giro de la cámara: 8 pasos de 45 grados vuelven al inicio, y `aMundo` invierte `aPantalla` con giro.

- `test_ciudad_real.mjs`: forma y proporciones de los datos, agua no caminable, conectividad, aparición en cada barrio, colisión, esquinas, clic para caminar, peatones y agentes sobre el mapa real. `test_ciudad.mjs` cubre la ciudad procedural.

- `test_puntaje.mjs`: cada componente de puntos (venta, escape, sigilo, tiempo), bonus de tiempo que baja linealmente y no baja de 0, medallas en los límites 8000, 20000 y 40000, récord global y por producto con storage simulado (y con storage que lanza error), desglose igual al total y texto de compartir sin datos personales.

Ninguna prueba toca el render ni la interacción en navegador. Las pruebas de F8 cubren la selección del objetivo y las pistas; la silueta de los modelos, la flecha de borde, las luces, el mapa y el minimapa se revisan en navegador.

Pasos para probar F7 en navegador (los hace el humano):
1. Jugar, pasar por Mercadería y tocar "Reponer y salir a la calle": aparece "¿Dónde empezás a vender?" con el mapa de los 7 barrios. Tocar una zona resalta el barrio y el jugador aparece dentro de él.
2. Esperar 10 s sin elegir: se empieza en San Nicolás y el HUD dice "San Nicolás".
3. Caminar de un barrio a otro: la línea "Barrio" del HUD cambia una sola vez por cruce.
4. Pulsar Q y R: la vista gira 45 grados por pulsación; el minimapa gira con ella, el jugador sigue moviéndose hacia arriba de la pantalla al pulsar W, y el cono de ofrecer se mueve con el giro.
5. En celular: los botones ⟲ ⟳ giran la vista; el minimapa no tapa los botones ni el joystick en horizontal.
6. Reiniciar la partida (Pausa > Reiniciar): vuelve a aparecer la selección de zona al salir de Mercadería.
7. Recargar la página: "Cargando el mapa de la ciudad…" aparece un instante y desaparece.

Pasos para probar en navegador (los hace el humano, con el servidor que ya levanta): el HUD muestra "Ronda · Mañana" al empezar; al pasar 40 s de ronda aparece "Mediodía" y a los 80 s "Tarde", con un toast; el cielo y la niebla cambian con transición; con un peatón que insulta, los cercanos reaccionan más seguido con insultos; sin mercadería no aparecen burbujas de compra.

## Estado final (F10)

**Fases del plan** (`../PLAN_2D_PARIDAD.md`):

- F0 a F9: hechas. Lo que no es de Node (render, interacción, sonido, sensación de balance) se prueba en navegador por el humano, con los pasos de cada sección.
- F10: hecha en lo que se puede verificar sin navegador: limpieza de avisos del análisis estático, botón Copiar, revisión de balance con simulación, tabla de constantes contrastada con `config.js`, esta sección y el runner de pruebas. El ajuste fino de partidas reales queda para el humano.

**Qué no está hecho:**

- Distancia de visualización: se guarda pero no cambia la vista.
- Cambio de zona caminando: la zona se elige al empezar cada ronda.
- Récord en el título: no se muestra.
- La línea de visión no recorta el cono de ofrecer en el dibujo.
- Animación de conteo en la pantalla de fin: no portada (ver "Diferencias con la 3D").

**Decisiones pendientes** (sección "Decisiones que necesito del usuario" del plan):

- **D1 (personaje):** aplicada: personalizador pixelart procedural en la pantalla Personaje (ver "Personaje del vendedor (D1)"). Falta la prueba en navegador.
- **D6 (audio):** aplicada: audio sintetizado como la 3D, con arranque en el primer gesto, silencio y volumen de Opciones (ver "Audio (D6)"). Falta la prueba en navegador.
- **D8 (alcance de ofrecer):** aplicado con el valor propuesto (base 2.25 celdas, semiángulo luego ampliado a 90°, +0.75 por nivel). El plan lo marca "a confirmar", así que falta la confirmación del usuario.
- **D2, D3, D4, D5, D7:** aplicadas con la recomendación del plan. D3 no tiene pantalla para elegir el modo de coima (el diálogo posterior deja elegir entre mercadería y dinero).

**Balance (F10):** no se cambió ningún valor. Simulación sin DOM de la economía (ronda 1 solo con figuritas, vender todo el stock):

- Reposición: 30 figuritas a $116 = $3480, que es exactamente la caja inicial (`CAPITAL_INI`).
- Venta total: 30 × $290 = $8700. Caja después del cierre: $8700.
- Con esa caja se puede reponer la ronda 2 completa de figuritas (32 unidades, $3712).

La simulación no modela si los peatones compran: si 30 unidades se venden en los 120 s de la ronda depende de las reacciones, y eso se prueba en navegador. Quedan para el humano los ajustes de velocidades, `POLI_T_PERDER`, `POLI_DIST_SAFAR` y los pesos de reacción.

**Pruebas:** ver la sección "Pruebas". Un solo comando corre todas las pruebas Node: `node 2d/tools/correr_todo.mjs`.

## Pathfinding de agentes

- Módulo `js/rutas.js` (sin DOM). Depende solo de `city.N` y `city.C[k].t` / `.deco` (o de una máscara `city.pasa` si la ciudad la trae), así que sirve igual para la ciudad real.
- **A\*** en grilla de 8 direcciones, heurística octil, sin cortar esquinas (no hay diagonal si alguna de las dos celdas laterales está bloqueada). Heap binario indexado con decrease-key, arrays tipados reutilizados y marca por generación (no se limpian ni alocan por búsqueda).
- **Planificador encolado** (`crearPlanificador`): los agentes piden rutas (prioridad: persecución, avisos, regreso/patrulla) y `stepAgentes` expande como mucho `RUTA_NODOS_FRAME` nodos por paso entre todos; una búsqueda larga sigue en el frame siguiente. Se mantiene además el tope `POLI_BFS_FRAME` de pedidos de persecución por paso. Los pedidos vencidos (el agente cambió de estado) se descartan.
- **Suavizado**: string pulling sobre las esquinas de la ruta con `lineaCaminable` (DDA con dos rayos paralelos a ±`RUTA_MARGEN`); nunca atraviesa obstáculos ni alarga la ruta. Al recibir una ruta el agente salta los puntos que ya ve en línea recta.
- **Persecución**: directo a menos de `POLI_DIRECTO` con vista (como antes); si hay recta caminable al objetivo, ruta de un solo tramo sin búsqueda; intercepción predictiva (velocidad estimada del jugador × tiempo de llegada, tope `INTERCEPT_T_MAX`) con `POLI_INTERCEPT` repartido por orden entre los perseguidores; recálculo cada `POLI_T_RUTA` solo si el objetivo se movió más de `RUTA_UMBRAL_OBJ` o la ruta terminó/se trabó.
- **Separación y atasco**: los agentes activos se empujan suavemente por debajo de `SEP_RADIO`; si siguiendo una ruta no avanzan `RUTA_ATASCO_D` en `RUTA_ATASCO_T` s, recalculan.
- Regreso, patrulla y avisos usan el mismo A* encolado. Constantes nuevas al final de `config.js`; los valores de balance (velocidades, visión, alerta, safar, captura) no cambian.
- Se eligió A\* y no un campo de distancias compartido: un campo sobre 600 × 600 son ~360 000 nodos por recálculo (~70 ms, decenas de frames de presupuesto), mientras que cada perseguidor, al estar cerca del jugador, resuelve su A\* en cientos de nodos. Pruebas y mediciones: `node 2d/tools/test_rutas.mjs`.

## Datos del mapa

- **Fuente:** OpenStreetMap, consultado con Overpass API. **Licencia:** ODbL 1.0. **Atribución** (visible en el título y en la selección de zona): "Mapa: © colaboradores de OpenStreetMap, ODbL". Los archivos de `datos/` son una base derivada y quedan bajo la misma licencia.
- **Fecha de descarga:** 2026-11-27 (`fechaDescarga` en `datos/caba_recorte.json`).
- **Recorte:** 3 x 3 km centrado en el Obelisco (-34.6037, -58.3816); sur -34.617175, oeste -58.397971, norte -34.590225, este -58.365229. Celdas de 5 m, 600 x 600, norte arriba.
- **Consulta** (con `S,O,N,E` del recorte):

```
[out:json][timeout:120][bbox:S,O,N,E];
(way[building];relation[building];way[highway];
 way[leisure~"^(park|garden|pitch|playground)$"];relation[leisure=park];way[landuse=grass];way[place=square];
 node[natural=tree];way[natural=water];relation[natural=water];
 way[waterway~"^(dock|riverbank)$"];relation[waterway~"^(dock|riverbank)$"];);
out geom qt;
```

  Los barrios (en CABA, `boundary=administrative` con `admin_level=9`) se piden aparte: `relation(id:...);out geom;`.
- **Reprocesar:** guardar las dos respuestas JSON fuera del proyecto y correr, desde `vendedores_capital/`:
  `node 2d/tools/procesar_osm.mjs <overpass.json> <barrios.json> 2d/datos/caba_recorte <AAAA-MM-DD>`, y después `node 2d/tools/test_ciudad_real.mjs`.
- **Simplificaciones:** el interior de manzana sin edificios mapeados se rellena como edificio, los patios sin acceso se cierran y todo edificio es genérico. Solo se guardan tipo de celda, árbol, barrio y cantidad de pisos.

## Mejora visual y sonora

Solo presentación: no cambia ningún valor de juego (velocidades, precios, probabilidades, radios, tiempos de agentes ni puntos).

**Mapa (`render.js`, `crearMapa`).** Se hornea a `CELDA_MAPA_PX` = 8 px por celda en mosaicos de 64 x 64 celdas (más 1 de solape), solo cuando entran en pantalla (hasta 4 nuevos por cuadro; mientras faltan se ve una vista general de 1 px por celda). Caché LRU de 40 mosaicos. Cada mosaico pinta también las celdas vecinas, así sombras y copas no se cortan. En cada cuadro es un `drawImage` por mosaico visible. Capas: veredas con juntas de baldosa y cordón oscuro contra la calle; asfalto con grano, línea de carril discontinua entre las dos manos y sendas peatonales en las celdas que tocan un cruce; adoquines en los barrios con `adoq` (perfiles Centro y San Telmo); agua con ondas y borde de muelle; césped con matas y alguna flor en las plazas; sombras de edificios hacia abajo a la derecha (un solo path, sin doble oscurecido) con largo según los pisos del barrio; techos por lote de 3 x 3 celdas con la paleta del estilo del barrio (`pal` / `estilo` de `barrios.js`), borde claro arriba e izquierda, oscuro abajo y derecha, fachada sur y detalles (equipos, tanques); árboles con sombra y copa de dos tonos. El ruido es determinista por celda (la ciudad se ve igual siempre).

**Personajes (`sprites.js`).** Los peatones son sprites pixelart de 12 x 16 (los de `personaje.js`) con una de 24 variantes fijas; cada peatón recibe la suya la primera vez que se dibuja (WeakMap) y no cambia. Los agentes tienen sprite propio: uniforme oscuro, chaleco y banda de la gorra del color de su estado, y 25 combinaciones de piel y pelo según su índice (`AG_COL`: amarillo patrulla o regreso, naranja alerta, rojo persecución), así se distinguen de los transeúntes (G35). Todos usan la escala de `escalaSprite`, animación de caminata de 2 cuadros (se detecta el movimiento entre cuadros), vista de frente o espalda según la dirección en pantalla (con el giro de la cámara), contorno oscuro de 1 px y sombra elíptica bajo los pies. La pastilla de memoria (N, I, C, M, P, A) queda chica al costado de la cabeza.

**Efectos.** Conos de visión con degradé radial, halo y borde fino (en persecución el círculo late); cono de ofrecer con degradé; globos de diálogo con cola y sombra; "+$" de venta dorado con contorno y chispas que salen del jugador; "!" de alerta en un círculo naranja que rebota; camino del clic punteado con anillo que late; viñeta roja suave en persecución; luz de la jornada como tinte `soft-light` con degradé vertical más una niebla leve. Con `prefers-reduced-motion` no hay pulsos ni rebotes.

**Interfaz (`css/juego2d.css`, `index.html`).** Bloque "Mejora visual" al final del CSS: tarjetas y botones con borde negro y relieve duro como la 3D, hover, active (hundido) y foco visible (`:focus-visible` amarillo), títulos con peso marcado, franja de acento en las tarjetas, HUD con borde y desenfoque, dinero en verde y puntos en amarillo, barra de stock con degradé y barra de energía nueva (`#hudEnergiaBar`, degradé rojo a verde; parpadea agotada), luces de alerta con brillo y latido en rojo. Animaciones cortas (entrada de tarjetas, latido) anuladas con `prefers-reduced-motion`. Contraste AA: texto claro sobre fondos oscuros y texto oscuro sobre amarillo.

**Iconos.** Las ilustraciones SVG de los productos se copiaron, sin cambios, de `../assets/ilustraciones/` (`medias.svg`, `empanadas.svg`, `churros.svg`, `figuritas.svg`, `paltas.svg`) a `2d/assets/ilustraciones/`. Se usan en las tarjetas de Mercadería (`venta.js`) y en el icono del HUD (`main.js`); si una no carga, el HUD vuelve al emoji de siempre. No tienen referencias externas.

**Sonido (`audio.js`).** Misma API (`desbloquear`, `sfx`, `setVolumen`, `silenciar`, `escena`, `pausa`, `alerta`) y desbloqueo tras el primer gesto. Envolvente ADSR por nota (`envolvente()`, pura y probada), buses separados de música (con el filtro de pausa) y efectos, y dos redes de eco con delay, realimentación y paso bajo (efectos vuelven a su bus, así el volumen las afecta; la música toma la salida filtrada). Variación leve de tono (`variar()`) en venta, pasos, cortés e ignorar. Efectos nuevos: `paso` y `pasoCorrer` (ruido filtrado más un golpe grave; `main.js` los dispara cada 0.9 celdas caminando y 1.3 corriendo), `cortes` (dos notas suaves ascendentes) e `ignorar` (nota corta que cae). Música en 4 compases (La menor, Fa, Do, Sol): bajo, acorde sostenido, melodía con eco en el menú, y en partida arpegio, bombo y platillo, más línea aguda en alerta y caja en persecución. Los nodos opcionales (delay, buffer de ruido) se crean solo si existen: sin ellos el audio sigue andando.

**Cachés y rendimiento.**
- Mapa: mosaicos de hasta 520 x 520 px (unos 1,1 MB), tope 40 (unos 43 MB), más la vista general de 600 x 600 (1,4 MB).
- Sprites: caché por clave (tipo, variante o color de estado, vista y cuadro), 1 px por píxel del sprite (14 x 18 con contorno), en `OffscreenCanvas` si existe o `<canvas>`. Como mucho 24 x 2 x 3 = 144 de peatones, 4 x 2 x 3 = 24 de agentes y unos pocos del jugador; tope de 400 entradas (al pasarlo se vacía). Antes se dibujaba el jugador píxel por píxel en cada cuadro (hasta 192 `fillRect`); ahora es un `drawImage` por entidad.
- Degradados de pantalla completa (luz y viñeta) cacheados por tamaño y color; los de los conos se crean por agente visible (pocos).
- El canvas usa `devicePixelRatio` con tope 2 (`dprLimitado` de `viewport.js`; 1 con calidad baja); la cámara sigue en px CSS. El límite de FPS de Opciones no cambia.

## Experiencia móvil

- Joystick flotante: tocar abajo a la izquierda (mitad izquierda, 65 % inferior) lo centra en el dedo y la base sigue al dedo (opción de joystick fijo). Zona muerta 0.12.
- Botones en arco abajo a la derecha: Ofrecer (grande), Correr (mantener), Cambiar producto y Pausa; mínimo 48 px, multitoque por pointerId y vibración corta opcional.
- Apaisado: al tocar Jugar se pide pantalla completa y bloqueo apaisado; en vertical la capa "Girá el teléfono" aparece en menús y partida (en iOS es el plan B).
- Menús dentro del viewport con `css/movil.css` y `js/viewport.js` (alto visible real con visualViewport y respaldo dvh/svh, safe areas con `viewport-fit=cover`, pie fijo en las tarjetas salvo título y pausa). Áreas táctiles de 44 px o más.
- Apaisado bajo: título y pausa con botones en dos columnas, grillas en mercadería, mejoras y personaje, y selección de zona con el mapa a la izquierda. Vertical angosto: vista previa del personaje chica y botones secundarios del pie de a dos.
- La capa de giro depende de táctil y vertical, así que en un celular o tablet en vertical tapa también los menús. Los menús en vertical se ven en escritorio con ventana angosta.
- En Opciones (sección Táctil): controles (joystick o flechas), tipo de joystick (se oculta con flechas), vibración (se oculta sin API) y calidad gráfica.
- Con un menú abierto se ocultan los controles táctiles. En apaisado bajo (alto de 500 px o menos) la alerta va abajo al centro.
- Preferencias táctiles en `localStorage` con la clave `2d_movil` (joystick, vibración, calidad).
- Pruebas: `node 2d/tools/test_movil.mjs`.
