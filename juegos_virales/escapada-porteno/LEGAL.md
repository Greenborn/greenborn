# Cumplimiento legal — Escapada porteña

> **Aviso:** esto no es asesoramiento legal profesional. Los puntos marcados como **no verificado** deben cotejarse en infoleg.gob.ar o en el Boletín Oficial antes de publicar con riesgo real. Para un lanzamiento comercial, consultar a un abogado especialista en propiedad intelectual y datos personales.

## Normativa relevante

| Tema | Norma | Aplica al juego | Estado de verificación |
|---|---|---|---|
| Propiedad intelectual | Ley 11.723 | Sí: arte, sonido y código propios quedan protegidos sin registro. Lo ajeno requiere licencia. | Parcial (fuentes secundarias) |
| Marcas | Ley 22.362 | Sí si se usan nombres o logos de marcas reales | Parcial |
| Datos personales | Ley 25.326 (y Decreto 1558/2001) | En principio no, si no hay backend, cuentas ni analítica. `localStorage` queda en el dispositivo del usuario. | Parcial; decreto no verificado |
| Defensa del consumidor | Ley 24.240 | No mientras sea gratuito y sin publicidad. Sí si hay compras, pagos o banners. | Parcial |
| Discriminación | Ley 23.592 | Sí, en forma de estereotipos sobre vendedores migrantes | Parcial |
| Código Contravencional CABA | Ley 1472 (art. 83, venta en espacio público) | Es el marco real de la venta ambulante; el juego no lo aplica | **No verificado** (número y texto) |
| Injurias y calumnias | Código Penal arts. 109 a 117 | Solo si se representan personas o instituciones reales identificables | Parcial; sin texto oficial |
| Accesibilidad | Ley 26.653 | Obligatoria solo para el Estado; buena práctica para privados | Parcial |

## Decisiones de diseño que ya cumplen

- **Sin violencia**: los agentes no tienen armas ni golpean. Solo persiguen y la captura termina la partida.
- **Sin estereotipos**: el jugador arma su propio personaje con opciones neutras; no hay rasgos ni acentos vinculados a nacionalidad.
- **Ficción**: agentes genéricos, sin placas, nombres, escudos ni uniformes reales.
- **Sin datos personales**: no hay cuentas, formularios, chat ni ranking con nombres. Solo se guardan el personaje y la mejor marca en `localStorage`.
- **Sin terceros**: no hay analítica, publicidad ni CDNs externos. El arte y los sonidos se generan por código.
- **Sin monetización**: no hay compras ni recompensas aleatorias pagas.

## Checklist antes de publicar

- [ ] Archivo `CREDITS` con autor y licencia de cada asset, sonido y fuente (hoy el juego no usa assets externos).
- [ ] Ningún logo, marca, nombre o uniforme real (Policía de la Ciudad, Policía Federal, funcionarios, comercios).
- [ ] Aviso de ficción en la página: *"Personajes y situaciones ficticios. Cualquier parecido con personas o instituciones reales es coincidencia."*
- [ ] Personajes de vendedores sin rasgos ni acentos estereotipados por nacionalidad.
- [ ] Si se agrega analítica o publicidad: banner de consentimiento y política de privacidad previos.
- [ ] Self-host de fuentes, librerías y sonidos, sin CDNs externos.
- [ ] Opción visible para borrar el progreso guardado en `localStorage`.
- [ ] Edad sugerida en la página (propuesta: 8+ por violencia leve y temática de persecución).
- [ ] Pie de página con responsable, contacto y licencia del código.
- [ ] Revisar accesibilidad contra WCAG 2.0 AA como buena práctica.
- [ ] Verificar en infoleg.gob.ar los textos de: Ley 11.723, Ley 25.326, Ley 24.240, Ley 23.592, Código Penal arts. 109 a 117, Código Contravencional CABA (art. 83), Ley 26.653.
- [ ] Revisar en hcdn.gob.ar el estado del proyecto de 2026 sobre recompensas aleatorias en videojuegos.

## Pendientes no verificados

- Número y texto vigente de la Ley 1472 (Código Contravencional CABA).
- Artículos 5 y 6 de la Ley 25.326 y Decreto 1558/2001.
- Vigencia de los Decretos 355/2013 y 656/2019 (accesibilidad).
- Estado de los proyectos de 2026 (loot boxes, reforma de Ley 23.592, eliminación de delitos contra el honor).
- Ley 26.522 art. 81 (publicidad infantil): no está claro que aplique a un juego web.

## Estado de la verificación en fuentes oficiales (intento del subagente)

- **Nacionales (infoleg, Boletín Oficial, HCDN):** no se pudo leer ningún texto desde el entorno. infoleg respondió 403 o no entregó el articulado. Todas las normas nacionales siguen **NO VERIFICADAS**.
- **Ley 1472 (CC CABA):** número confirmado por Juristeca. El art. 41 se leyó en la compilación de Juristeca (PARCIAL). El art. 83 no se pudo leer. Tiene renumeración desde el antiguo art. 76 por Decreto 362/2024 (T.O., Boletín Oficial CABA 20/11/2024). La Ley 4121 (venta en vía pública) aparece en fuentes secundarias y no está confirmada.
- **Proyectos 2026:** loot boxes sin expediente ni estado confirmado (NO VERIFICADO). Identidad de género en Ley 23.592: aparece una media sanción en Diputados según nota periodística. No se confirmó el expediente (PARCIAL).

**Próximo paso:** abrir desde un navegador real los enlaces de infoleg y el T.O. del Decreto 362/2024 (art. 83 y ficha de Ley 4121), y completar esta tabla antes de publicar.
