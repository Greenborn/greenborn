const $D = document
const $W = window
const $ = {
  gId: (i) => $D.getElementById(i),
  sA: (s) => $D.querySelectorAll(s),
  cE: (t) => $D.createElement(t),
  qS: (s) => $D.querySelector(s)
};

const apC = (p, c) => p.appendChild(c);
const ecSA = (e, c) => e.querySelectorAll(c);
// Datos de servicios [id, name, description, order, img_src]
const servicios = [
  [1, "Desarrollo de APP's Móviles", "Programamos la APP que necesita, para luego poder exportarla a plataformas Android e IOs, utilizamos Frameworks híbridos como Ionic y React Native.", 10, "img/icon1.svg"],
  [2, "Web Scraping", "Descargamos información de sitios públicos de su elección para que Ud. pueda disponer de dicha información ya sea en formatos .CSV, Hoja de Cálculo, Base de datos u otros a determinar.", 20, "img/icon2.svg"],
  [3, "Migración Web", "Migramos el contenido de su actual página web, sin importar en que CMS esté desarrollada o otro CMS de su elección, nueva APP Móvil o de Escritorio.", 30, "img/icon3.svg"],
  [4, "Solución de Errores", "Resolvemos aquellos errores que pudieran estar presentes en el código de su APP o que se deban a defectos de configuración de su servidor.", 40, "img/icon4.svg"],
  [5, "Alojamiento Web", "El Web Hosting más conveniente.", 50, "img/icon5.svg"]
];

// Datos de metodología [id, number, title, description, icon]
const metodologia = [
  [1, 1, "Entrevista Inicial", "Nos entrevistamos contigo para clarificar las necesidades, relevar requerimientos y dimensionar el alcance del proyecto.", "fas fa-comments"],
  [2, 2, "Propuesta", "A partir del relevamiento de la entrevista, creamos una propuesta de desarrollo indicando las tecnologías a utilizar, diseño y arquitectura.", "fas fa-file-alt"],
  [3, 3, "Preparación", "Montamos un sitio de pruebas actualizado periódicamente donde podrás constatar el avance y realizar correcciones. Definimos el Producto Mínimo Viable.", "fas fa-cogs"],
  [4, 4, "Desarrollo", "Damos inicio al proceso de implementación manteniendo actualizado el sitio de pruebas y en contacto constante durante todo el proceso.", "fas fa-code"],
  [5, 5, "Testing", "Realizamos pruebas exhaustivas del sistema para garantizar su funcionamiento correcto, rendimiento óptimo y experiencia de usuario satisfactoria.", "fas fa-vial"],
  [6, 6, "Implementación", "Con cada objetivo completado y validado, realizamos la instalación del sistema en su ubicación definitiva.", "fas fa-rocket"],
  [7, 7, "Soporte", "Brindamos soporte post-venta para dudas sobre el uso, nuevas funcionalidades o corrección de bugs.", "fas fa-headset"]
];

// Datos de portfolio [id, titulo, descripcion_organizacion, url, imgs, tecnologias_usadas]
const portfolio = [
  [0, "Grupo Fotográfico Centro", `Desarrollé un Sistema de Gestión de Concursos Fotográficos para El GFC (Grupo Fotográfico Centro) que agrupa desde 
      el año 1967 a los fotoclubes del centro este de la provincia de Buenos Aires 
      pertenecientes a la F.A.F (Federación Argentina de Fotografía). <br><br>Las ciudades que se encuentran representadas actualmente son: Balcarce, 
      Benito Juarez, Necochea, Olavarria y Tandil. 
      <br><br> El sistema permite el registro de fotoclubes, salones, fotógrafos, obras, etc. 
      Cuenta como objetivo la promoción de la actividad fotográfica en el ámbito fotoclubista y el aprendizaje continuo.`, "https://www.grupofotograficocentro.com/", ["gfc_1.webp", "gfc_2.webp", "gfc_3.webp"], ["PHP", "Yii", "Postgres", "Angular", "Ionic"]],
  [1, "Buscador e Histórico de Precios", `Desarrollé un sistema de control de scrapers para la obtención de precios de diversas fuentes, registrando
      datos de más de 40 comercios realizando seguimiento de más de 30mil precios de diversos tipos de artículos, implementé una
      la funcionalidad de busqueda de precios y la posibilidad de visualizar su evolución a lo largo del tiempo.`, "https://precios.greenborn.com.ar/", ["precios_1.webp", "precios_2.webp", "precios_3.webp"], ["NodeJS", "Express", "MariaDB", "Vue", "Bootstrap", "Python", "Selenium", "Código Abierto"]],
  [2, "Instancia propia de Redmine", `Gestiono una instancia propia de Redmine para la organización de las tareas del día a día.`, "https://redmine.greenborn.com.ar/", ["redmine_1.webp", "redmine_2.webp"], ["Redmine", "Nginx", "MariaDB"]],
  [3, "Web Hosting Wordpress", `Proporciono servicios de hosting de Wordpress, actualización de plugins y temas, backups, etc. 
      por el momento para un cliente de un blog literario denominado Titanes de Cristal.`, "https://greenborn.com.ar/", ["wp_1.webp", "wp_2.webp"], ["WordPress", "Nginx", "PHP-FPM", "MariaDB"]],
  [4, "Mapa de Quejas y Reclamos", `Desarrollé un tablero público de reclamos en donde cualquier usuario puede subir una queja geolocandizándola con 
      su ubicación actual o la que proporcione, una breve descripción y hasta tres imágenes.
      <br><br> Uno de sus objetivos es ser una prueba de concepto y base para posibles aplicaciones que requieran la geolocalización.`, "https://mapa.greenborn.com.ar", ["mapa_1.webp", "mapa_2.webp", "mapa_3.webp"], ["Open Street Map", "Vue", "Express", "NodeJS", "MariaDB", "MariaDB", "Código Abierto"]],
  [5, "Componente Vue Cursor Custom", `Componente Vue.js para personalizar el cursor del mouse con efectos visuales avanzados.`, "https://www.npmjs.com/package/@greenborn/vue-custom-cursor", ["vue_mouse_1.webp"], ["Vue.js", "JavaScript", "NPM"]],
  [6, "Chat Público", `Sistema de chat en tiempo real para comunicación pública con tecnologías modernas.`, "https://chat.greenborn.com.ar/", ["chat_1.webp"], ["WebSocket", "Node.js", "Vue.js"]]
];

// Datos de tecnologías [id, name, description, url, order, img_src]
const tecnologias = [
  [1, "PHP", "PHP es un lenguaje de programación para desarrollar aplicaciones y crear sitios web que conquista cada día más seguidores. Fácil de usar y en constante perfeccionamiento es una opción segura para aquellos que desean trabajar en proyectos calificados y sin complicaciones.", "https://www.php.net/", 0, "img/php.svg"],
  [2, "HTML", "El HTML5 es un estándar que sirve para definir la estructura, el diseño y el contenido de una página web. En realidad, se trata de un código, un lenguaje (HTML) que define los contenidos que forman parte de una página web, como imágenes, texto, vídeos, juegos, marcos, estilo de letra, etc.", "https://developer.mozilla.org/en-US/docs/Web/HTML", 10, "img/html.svg"],
  [3, "Bootstrap", "Bootstrap es un framework que permite a los desarrolladores web construir páginas web responsives de una forma más rápida y sencilla. En este sentido, proporciona un conjunto de componentes y plantillas CSS, HTML y JavaScript que cualquiera puede utilizar o modificar de manera gratuita.", "https://getbootstrap.com/", 20, "img/bootstrap.svg"],
  [4, "JavaScript", "JavaScript es un lenguaje de programación que los desarrolladores utilizan para hacer páginas web interactivas. Desde actualizar fuentes de redes sociales a mostrar animaciones y mapas interactivos, las funciones de JavaScript pueden mejorar la experiencia del usuario de un sitio web.", "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/What_is_JavaScript", 30, "img/js.svg"],
  [5, "TypeScript", "TypeScript es un lenguaje orientado a objetos (como el lenguaje R, por ejemplo). Esto quiere decir que tanto el cliente como el servidor tienen acceso a la escritura de código. Además, se trata de un código abierto. Por otro lado, destaca por ser multiplataforma y, por consiguiente, ser portátil.", "https://www.typescriptlang.org/", 40, "img/ts.svg"],
  [6, "Python", "Python es un lenguaje de programación ampliamente utilizado en las aplicaciones web, el desarrollo de software, la ciencia de datos y el machine learning (ML).", "https://www.python.org/", 50, "img/py.svg"],
  [7, "Java", "El lenguaje de programación Java se usa en plataformas y dispositivos, debido a su código fácilmente transferible. Entre los usos más populares de Java se incluyen el software empresarial, desarrollo de aplicaciones móviles, aplicaciones web, aplicaciones basadas en la nube, juegos y aplicaciones de IoT.", "https://www.java.com", 50, "img/java.svg"],
  [8, "Django", "Django es un proyecto de Python gratuito y de código abierto con una comunidad activa que revisa y mantiene el software. Una organización sin fines de lucro llamada Django Software Foundation promueve y respalda el uso y el mantenimiento de Django.", "https://www.djangoproject.com/", 60, "img/dj.svg"],
  [9, "Maria DB", "MariaDB es un sistema de gestión de bases de datos relacionales (RDBMS) gratuito y de código abierto. Fue creado por los desarrolladores originales de MySQL por la preocupación de que MySQL pasara a ser comercializado después de que Oracle lo adquiriera en 2009.", "https://mariadb.org/", 70, "img/mariadb.svg"],
  [10, "WordPress", "WordPress es un sistema de gestión de contenidos (CMS) que permite crear y administrar sitios web de manera sencilla y sin necesidad de utilizar un lenguaje de programación: Es gratuito y de código abierto, Es versátil y adaptable, Es fácil de usar, Tiene una amplia gama de temas y plugins, Está respaldado por una comunidad global.", "https://wordpress.com/", 80, "img/wp.svg"]
];

// Datos de redes sociales [id, title, image, external_link]
const redesSociales = [
  [0, "Facebook", "assets/img/facebook.svg", "https://www.facebook.com/Greenborn-100550959124104"],
  [10, "Instagram", "assets/img/instagram.svg", "https://www.instagram.com/greenborn_soft/"],
  [40, "Linkedin", "assets/img/linkedin.svg", "https://www.linkedin.com/company/greenborn"]
];

// Datos de navegación [section_id, label, active]
const enlaces = [
  ["seccion-inicio", "Inicio", true],
  ["seccion-servicios", "Servicios", false],
  ["seccion-metodologia", "Metodología", false],
  ["seccion-portfolio", "Portfolio", false],
  ["seccion-tecnologias", "Tecnologías", false],
  ["seccion-contacto", "Contacto", false]
];

// Variables globales
let animationInterval;
let currentImageIndexes = {};

// SEO Meta Tags para cada sección
const seoMeta = [
  ["seccion-inicio", "Greenborn - Desarrollo Web y Aplicaciones Móviles", "Desarrollo de aplicaciones web, móviles y soluciones tecnológicas personalizadas en Buenos Aires, Argentina"],
  ["seccion-servicios", "Servicios de Desarrollo Web - Greenborn", "Desarrollo de apps móviles, web scraping, migración web, solución de errores y hosting"],
  ["seccion-metodologia", "Metodología de Trabajo - Greenborn", "Proceso completo desde entrevista inicial hasta soporte post-venta para proyectos web"],
  ["seccion-portfolio", "Portfolio de Proyectos - Greenborn", "Casos de éxito: sistemas fotográficos, buscadores de precios, hosting WordPress y más"],
  ["seccion-tecnologias", "Tecnologías - Greenborn", "PHP, JavaScript, Python, Vue.js, React Native, Django, WordPress y más tecnologías"],
  ["seccion-contacto", "Contacto - Greenborn", "Contacta con nosotros para tu próximo proyecto de desarrollo web o aplicación móvil"]
];

// Función para actualizar SEO
function updateSEO(sectionId) {
  const meta = seoMeta.find(m => m[0] === sectionId);
  if (!meta) return;
  
  const [_, title, description] = meta;
  $D.title = title;
  
  let metaDesc = $.qS('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = $.cE('meta');
    metaDesc.setAttribute('name', 'description');
    $.qS('head').appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', description);
}

// Función para agregar datos estructurados
function addStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Greenborn",
    "url": "https://greenborn.com.ar",
    "logo": "https://greenborn.com.ar/logo300x300.png",
    "description": "Desarrollo de aplicaciones web, móviles y soluciones tecnológicas",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "AR",
      "addressRegion": "Buenos Aires"
    },
    "sameAs": [
      "https://www.facebook.com/Greenborn-100550959124104",
      "https://www.instagram.com/greenborn_soft/",
      "https://www.linkedin.com/company/greenborn"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "Spanish"
    },
    "offers": servicios.map(s => ({
      "@type": "Service",
      "name": s[1],
      "description": s[2],
      "provider": {
        "@type": "Organization",
        "name": "Greenborn"
      }
    })),
    "knowsAbout": tecnologias.map(t => t[1])
  };
  
  let script = $.qS('script[type="application/ld+json"]');
  if (!script) {
    script = $.cE('script');
    script.type = 'application/ld+json';
    $.qS('head').appendChild(script);
  }
  script.textContent = JSON.stringify(structuredData);
}

// Función para inicializar el efecto Matrix
function initMatrixEffect() {
  const canvas = $.gId('canv');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  const resizeCanvas = () => {
    canvas.width = $W.innerWidth;
    canvas.height = $W.innerHeight;
  };
  
  resizeCanvas();
  
  const w = canvas.width;
  const h = canvas.height;
  const cols = Math.floor(w / 25) + 1;
  const ypos = Array(cols).fill(0);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  animationInterval = setInterval(() => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = 'rgba(0, 212, 170, 0.1)';
    ctx.font = '12pt monospace';
    
    ypos.forEach((y, ind) => {
      const text = String.fromCharCode(Math.random() * 128);
      const x = ind * 25;
      ctx.fillText(text, x, y);
      if (y > 100 + Math.random() * 10000) ypos[ind] = 0;
      else ypos[ind] = y + 25;
    });
  }, 100);

  $W.addEventListener('resize', resizeCanvas);
}

// Función para cargar servicios
function loadServices() {
  const grid = $.gId('services-grid');
  if (!grid) return;

  grid.innerHTML = '';
  
  servicios.forEach((servicio, index) => {
    const [id, name, description, order, img_src] = servicio;
    const wrapper = $.cE('div');
    wrapper.className = 'service-card-wrapper';
    wrapper.style.animationDelay = `${index * 0.1}s`;
    
    wrapper.innerHTML = `
      <div class="service-card-modern">
        <div class="card-content">
          <div class="card-background" style="background-image: url('${img_src}')"></div>
          
          <div class="card-overlay">
            <div class="service-icon">
              <img src="${img_src}" alt="Icono de ${name} - Greenborn" class="icon-image" title="${name}" loading="lazy" />
            </div>
            
            <div class="service-info">
              <h3 class="service-title">${name}</h3>
              <p class="service-description">${description}</p>
            </div>
            
            <div class="service-cta">
              <a href="#seccion-contacto" class="learn-more" title="Contactar sobre ${name}">Saber más →</a>
            </div>
          </div>
        </div>
      </div>
    `;
    
    apC(grid, wrapper);
  });
}

// Función para cargar metodología
function loadMethodology() {
  const timeline = $.gId('methodology-timeline');
  if (!timeline) return;

  timeline.innerHTML = '';
  
  metodologia.forEach((step, index) => {
    const [id, number, title, description, icon] = step;
    const stepDiv = $.cE('div');
    stepDiv.className = `timeline-step ${index % 2 === 1 ? 'step-right' : ''}`;
    stepDiv.style.animationDelay = `${index * 0.2}s`;
    
    stepDiv.innerHTML = `
      <div class="step-number">
        <div class="number-circle">
          <span class="number">${number}</span>
        </div>
      </div>
      
      <div class="step-content">
        <div class="step-card">
          <div class="step-icon">
            <i class="${icon}"></i>
          </div>
          <h3 class="step-title">${title}</h3>
          <p class="step-description">${description}</p>
        </div>
      </div>
    `;
    
    apC(timeline, stepDiv);
  });
}

// Función para cargar portfolio
function loadPortfolio() {
  const grid = $.gId('portfolio-grid');
  if (!grid) return;

  grid.innerHTML = '';
  
  portfolio.forEach((proyecto, index) => {
    const [id, titulo, descripcion_organizacion, url, imgs, tecnologias_usadas] = proyecto;
    const wrapper = $.cE('div');
    wrapper.className = 'portfolio-item-wrapper';
    wrapper.style.animationDelay = `${index * 0.1}s`;
    
    const techTags = tecnologias_usadas.map(tech => 
      `<span class="tech-tag">${tech}</span>`
    ).join('');
    
    wrapper.innerHTML = `
      <div class="portfolio-card-modern">
        <div class="portfolio-card-content">
          
          <div class="portfolio-carousel">
            <div class="portfolio-images" data-project-id="${id}">
              ${imgs.map((img, imgIndex) => 
                `<img class="portfolio-image ${imgIndex === 0 ? 'active' : ''}" 
                     src="img/portfolio/${img}" 
                     alt="${titulo} - Proyecto Greenborn ${imgIndex + 1}" 
                     title="${titulo}"
                     loading="${imgIndex === 0 ? 'eager' : 'lazy'}"
                     style="display: ${imgIndex === 0 ? 'block' : 'none'}" />`
              ).join('')}
            </div>
          </div>

          <div class="portfolio-overlay">
            <div class="overlay-content">
              
              <h3 class="project-title">${titulo}</h3>
              
              <div class="project-description">${descripcion_organizacion}</div>
              
              <div class="project-technologies">
                <div class="tech-tags">
                  ${techTags}
                </div>
              </div>
              
              <div class="project-cta">
                <a href="${url}" target="_blank" class="visit-project">
                  <i class="fas fa-external-link-alt"></i>
                  Visitar Proyecto
                </a>
              </div>
              
            </div>
          </div>

        </div>
      </div>
    `;
    
    apC(grid, wrapper);
    
    // Inicializar carrusel para este proyecto
    initCarousel(id, imgs);
  });
}

// Función para inicializar carrusel de imágenes
function initCarousel(projectId, images) {
  if (images.length <= 1) return;
  
  currentImageIndexes[projectId] = 0;
  const randomInterval = Math.floor(Math.random() * 3000) + 2000;
  
  setInterval(() => {
    const container = $.qS(`.portfolio-images[data-project-id="${projectId}"]`);
    if (!container) return;
    
    const currentImages = ecSA(container, '.portfolio-image');
    const currentIndex = currentImageIndexes[projectId];
    const nextIndex = (currentIndex + 1) % images.length;
    
    // Ocultar imagen actual
    if (currentImages[currentIndex]) {
      currentImages[currentIndex].style.display = 'none';
      currentImages[currentIndex].classList.remove('active');
    }
    
    // Mostrar siguiente imagen
    if (currentImages[nextIndex]) {
      currentImages[nextIndex].style.display = 'block';
      currentImages[nextIndex].classList.add('active');
    }
    
    currentImageIndexes[projectId] = nextIndex;
  }, randomInterval);
}

// Función para cargar tecnologías
function loadTechnologies() {
  const grid = $.gId('technologies-grid');
  if (!grid) return;

  grid.innerHTML = '';
  
  tecnologias.forEach((tech, index) => {
    const [id, name, description, url, order, img_src] = tech;
    const wrapper = $.cE('div');
    wrapper.className = 'tech-card-wrapper';
    wrapper.style.animationDelay = `${index * 0.1}s`;
    
    wrapper.innerHTML = `
      <div class="tech-card-modern">
        <div class="tech-card-content">
          
          <div class="tech-logo">
            <a href="${url}" target="_blank" class="tech-link" title="Ver más sobre ${name}">
              <img src="${img_src}" alt="Logo de ${name} - Tecnología Greenborn" class="tech-image" loading="lazy" />
            </a>
          </div>
          
          <div class="tech-info">
            <h3 class="tech-name">${name}</h3>
            <p class="tech-description">${description}</p>
            
            <div class="tech-cta">
              <a href="${url}" target="_blank" class="tech-learn-more">
                Ver más →
              </a>
            </div>
          </div>
          
        </div>
      </div>
    `;
    
    apC(grid, wrapper);
  });
}

// Función para cargar redes sociales
function loadSocialLinks() {
  const container = $.gId('social-links');
  if (!container) return;

  container.innerHTML = '';
  
  redesSociales.forEach(red => {
    const [id, title, image, external_link] = red;
    const link = $.cE('a');
    link.href = external_link;
    link.target = '_blank';
    link.className = 'social-link';
    link.title = title;
    
    link.innerHTML = `<img src="${image}" alt="${title} - Red Social Greenborn" class="social-icon" loading="lazy" />`;
    
    apC(container, link);
  });
}

// Función para cargar navegación
function loadNavigation() {
  const navList = $.gId('nav-list');
  if (!navList) return;

  navList.innerHTML = '';
  
  enlaces.forEach(enlace => {
    const [section_id, label, active] = enlace;
    const li = $.cE('li');
    li.className = `nav-item ${active ? 'nav-item-active' : ''}`;
    
    li.innerHTML = `
      <button class="nav-link" data-section="${section_id}">
        <span class="nav-icon">
          <i class="${getIconForSection(section_id)}"></i>
        </span>
        <span class="nav-text">${label}</span>
        <span class="nav-indicator"></span>
      </button>
    `;
    
    apC(navList, li);
  });
}

// Función para obtener icono de sección
function getIconForSection(sectionId) {
  const icons = {
    'seccion-inicio': 'fas fa-home',
    'seccion-servicios': 'fas fa-cogs',
    'seccion-metodologia': 'fas fa-route',
    'seccion-portfolio': 'fas fa-briefcase',
    'seccion-tecnologias': 'fas fa-code',
    'seccion-contacto': 'fas fa-envelope'
  };
  return icons[sectionId] || 'fas fa-circle';
}

// Función para manejar el menú lateral
function initSideMenu() {
  const menuToggle = $.gId('menu-toggle');
  const menuOverlay = $.gId('menu-overlay');
  const menuPanel = $.gId('menu-panel');
  const modernMenu = $.gId('menu-lateral');
  
  if (!menuToggle || !menuOverlay || !menuPanel || !modernMenu) return;
  
  let isOpen = false;
  
  // Función para abrir el menú
  function openMenu() {
    isOpen = true;
    menuToggle.classList.add('active');
    menuOverlay.classList.add('active');
    menuPanel.classList.add('active');
    $D.body.style.overflow = 'hidden';
  }
  
  // Función para cerrar el menú
  function closeMenu() {
    isOpen = false;
    menuToggle.classList.remove('active');
    menuOverlay.classList.remove('active');
    menuPanel.classList.remove('active');
    $D.body.style.overflow = '';
  }
  
  // Toggle del menú
  menuToggle.addEventListener('click', () => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });
  
  // Cerrar menú al hacer clic en overlay
  menuOverlay.addEventListener('click', closeMenu);
  
  // Función para verificar posición del header
  function checkHeaderPosition() {
    const headerSection = $.gId('seccion-inicio');
    if (headerSection) {
      const headerTop = headerSection.offsetTop;
      const headerBottom = headerTop + headerSection.offsetHeight;
      const scrollY = $W.scrollY + $W.innerHeight;
      
      if (scrollY > headerTop && $W.scrollY < headerBottom) {
        modernMenu.classList.add('menu-hidden');
      } else {
        modernMenu.classList.remove('menu-hidden');
      }
    }
  }
  
  // Verificar posición inicial
  checkHeaderPosition();
  
  // Escuchar scroll para ocultar/mostrar menú en header
  $W.addEventListener('scroll', checkHeaderPosition);
  
  // Manejar clics en enlaces de navegación
  const navLinks = $.sA('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('data-section');
      
      // Actualizar enlaces activos
      enlaces.forEach(enlace => {
        enlace[2] = enlace[0] === sectionId; // enlace[0] es section_id, enlace[2] es active
      });
      
      // Actualizar SEO
      updateSEO(sectionId);
      
      // Actualizar URL sin recargar
      if (history.pushState) {
        history.pushState(null, null, `#${sectionId}`);
      }
      
      // Actualizar UI
      $.sA('.nav-item').forEach(item => {
        item.classList.remove('nav-item-active');
      });
      link.closest('.nav-item').classList.add('nav-item-active');
      
      // Scroll suave a la sección
      const section = $.gId(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
      
      // Cerrar menú
      closeMenu();
    });
  });
  
  // Actualizar enlaces activos basado en scroll
  $W.addEventListener('scroll', function() {
    for (let i = 0; i < enlaces.length; i++) {
      const section = $.gId(enlaces[i][0]); // enlaces[i][0] es section_id
      if (section && $W.scrollY > section.offsetTop - 100) {
        enlaces[i][2] = true; // enlaces[i][2] es active
        // Actualizar UI
        $.sA('.nav-item').forEach(item => {
          item.classList.remove('nav-item-active');
        });
        const activeLink = $.qS(`[data-section="${enlaces[i][0]}"]`);
        if (activeLink) {
          activeLink.closest('.nav-item').classList.add('nav-item-active');
        }
      } else {
        enlaces[i][2] = false; // enlaces[i][2] es active
      }
    }
  });
}

// Función para manejar el widget de WhatsApp
function initWhatsAppWidget() {
  const button = $.gId('whatsapp-button');
  const popup = $.gId('whatsapp-popup');
  
  if (!button || !popup) return;
  
  button.addEventListener('click', () => {
    popup.classList.toggle('show');
  });
  
  // Cerrar popup al hacer clic fuera
  $D.addEventListener('click', (e) => {
    if (!button.contains(e.target) && !popup.contains(e.target)) {
      popup.classList.remove('show');
    }
  });
}

// Función para manejar el formulario de contacto
function initContactForm() {
  const form = $.gId('contact-form');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Simular envío del formulario
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    console.log('Datos del formulario:', data);
    
    // Mostrar modal de éxito
    showModal('¡Mensaje enviado correctamente! Te contactaremos pronto.');
    
    // Limpiar formulario
    form.reset();
  });
}

// Función para mostrar modal
function showModal(message) {
  const modal = $.gId('modal-overlay');
  const messageEl = $.gId('modal-message');
  
  if (!modal || !messageEl) return;
  
  messageEl.textContent = message;
  modal.style.display = 'flex';
}

// Función para cerrar modal
function closeModal() {
  const modal = $.gId('modal-overlay');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Función para detectar sección activa en scroll
function initScrollSpy() {
  const sections = $.sA('.seccion');
  const navItems = $.sA('.nav-item');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id;
        
        // Actualizar navegación
        navItems.forEach(item => {
          item.classList.remove('nav-item-active');
          const link = item.querySelector('.nav-link');
          if (link && link.getAttribute('data-section') === sectionId) {
            item.classList.add('nav-item-active');
          }
        });
        
        // Actualizar datos de enlaces
        enlaces.forEach(enlace => {
          enlace[2] = enlace[0] === sectionId; // enlace[0] es section_id, enlace[2] es active
        });
        
        // Actualizar SEO
        updateSEO(sectionId);
      }
    });
  }, {
    threshold: 0.5
  });
  
  sections.forEach(section => {
    observer.observe(section);
  });
}

// Función para smooth scroll en enlaces
function initSmoothScroll() {
  const links = $.sA('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = link.getAttribute('href').substring(1);
      const targetSection = $.gId(targetId);
      
      if (targetSection) {
        targetSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Función para añadir efectos de hover en tarjetas de servicio
function initServiceCardEffects() {
  $D.addEventListener('mousemove', (e) => {
    const cards = $.sA('.service-card-modern');
    
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        const cardContent = card.querySelector('.card-content');
        if (cardContent) {
          cardContent.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }
      }
    });
  });
  
  // Reset transform cuando el mouse sale de la tarjeta
  $.sA('.service-card-modern').forEach(card => {
    card.addEventListener('mouseleave', () => {
      const cardContent = card.querySelector('.card-content');
      if (cardContent) {
        cardContent.style.transform = 'rotateX(0deg) rotateY(0deg)';
      }
    });
  });
}

// Función para inicializar animaciones al scroll
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in');
      }
    });
  }, {
    threshold: 0.1
  });
  
  // Observar elementos con animación
  const animatedElements = $.sA('.service-card-wrapper, .portfolio-item-wrapper, .tech-card-wrapper, .timeline-step');
  animatedElements.forEach(el => observer.observe(el));
}

// Función principal de inicialización
function init() {
  // Inicializar SEO
  addStructuredData();
  updateSEO('seccion-inicio');
  
  // Inicializar efectos visuales
  initMatrixEffect();
  
  // Cargar contenido dinámico
  loadServices();
  loadMethodology();
  loadPortfolio();
  loadTechnologies();
  loadSocialLinks();
  loadNavigation();
  
  // Inicializar funcionalidades
  initSideMenu();
  initWhatsAppWidget();
  initContactForm();
  initScrollSpy();
  initSmoothScroll();
  initServiceCardEffects();
  initScrollAnimations();
  
  // Exponer función closeModal globalmente
  $W.closeModal = closeModal;
}

// Inicializar cuando el DOM esté listo
if ($D.readyState === 'loading') {
  $D.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Limpiar intervalos al cerrar la página
$W.addEventListener('beforeunload', () => {
  if (animationInterval) {
    clearInterval(animationInterval);
  }
});
