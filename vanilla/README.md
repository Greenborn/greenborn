# Greenborn - Versión Vanilla

Esta es la versión vanilla (HTML, CSS y JavaScript puro) del sitio web de Greenborn, sin dependencias de librerías externas.

## Estructura del Proyecto

```
vanilla/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos principales
├── js/
│   └── main.js         # JavaScript principal
├── assets/
│   ├── fnt/           # Fuentes personalizadas
│   └── img/           # Imágenes de assets
├── img/               # Imágenes públicas
│   ├── icons/         # Iconos de servicios y tecnologías
│   └── portfolio/     # Imágenes del portfolio
└── logo300x300.png   # Logo principal
```

## Características

### ✨ Funcionalidades Implementadas

- **Efecto Matrix**: Animación de fondo en canvas con efecto Matrix
- **Navegación suave**: Scroll suave entre secciones
- **Menú lateral flotante**: Menú responsive con navegación por secciones
- **Widget de WhatsApp**: Widget flotante para contacto directo
- **Formulario de contacto**: Formulario funcional con validación
- **Carrusel de portfolio**: Rotación automática de imágenes en proyectos
- **Efectos de hover**: Efectos 3D en tarjetas de servicios
- **Responsive design**: Adaptable a todos los dispositivos
- **Animaciones al scroll**: Elementos animados al aparecer en pantalla

### 🎨 Diseño

- **Tema oscuro moderno**: Colores verdes y grises con gradientes
- **Tipografías personalizadas**: BebasNeue, BelgianoSerif y VeraMono
- **Efectos glassmorphism**: Tarjetas con efecto de vidrio esmerilado
- **Animaciones fluidas**: Transiciones suaves y naturales

### 📱 Responsive

- **Mobile First**: Diseño optimizado para móviles
- **Breakpoints**: Adaptación a tablets y escritorio
- **Touch friendly**: Elementos optimizados para touch

## Cómo usar

1. **Abrir el sitio**: Simplemente abre `index.html` en tu navegador
2. **Servidor local** (recomendado): 
   ```bash
   # Con Python
   python -m http.server 8000
   
   # Con Node.js
   npx serve .
   
   # Con PHP
   php -S localhost:8000
   ```
3. **Navegar**: Usa el menú lateral o scroll para navegar entre secciones

## Secciones

1. **Header**: Presentación principal con efecto Matrix
2. **Servicios**: Grid de servicios con efectos 3D
3. **Metodología**: Timeline del proceso de trabajo
4. **Portfolio**: Galería de proyectos con carrusel
5. **Tecnologías**: Stack tecnológico con estadísticas
6. **Contacto**: Formulario y información de contacto
7. **Footer**: Redes sociales y copyright

## Datos

Todos los datos (servicios, portfolio, tecnologías, etc.) están definidos como arrays JavaScript en `js/main.js`. Para modificar el contenido, edita estas estructuras de datos.

## Personalización

### Colores
Modifica las variables CSS en `:root` en `css/style.css`:
```css
:root {
  --primary-green: #00d4aa;
  --secondary-green: #00b894;
  --accent-green: #00f5d4;
  /* ... más colores */
}
```

### Contenido
Edita los arrays de datos en `js/main.js`:
- `servicios`: Lista de servicios
- `metodologia`: Pasos de la metodología
- `portfolio`: Proyectos del portfolio
- `tecnologias`: Stack tecnológico
- `redesSociales`: Enlaces a redes sociales

### Estilos
Modifica `css/style.css` para cambiar la apariencia visual.

## Optimizaciones

- **Imágenes optimizadas**: Formato WebP para mejor rendimiento
- **CSS minificado**: Estilos optimizados para producción
- **JavaScript eficiente**: Código optimizado sin dependencias
- **Lazy loading**: Animaciones solo cuando son visibles

## Compatibilidad

- **Navegadores modernos**: Chrome, Firefox, Safari, Edge
- **Funcionalidades**: CSS Grid, Flexbox, Intersection Observer
- **ES6+**: Arrow functions, template literals, async/await

## Licencia

Este proyecto mantiene la misma licencia que el proyecto original de Greenborn.

---

**Greenborn - Desarrollo de Software Libre**  
*Software en Crecimiento*
