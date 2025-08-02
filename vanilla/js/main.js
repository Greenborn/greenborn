const $ = {
  gId: (i) => document.getElementById(i),
  d: {
    sA: (s) => document.querySelectorAll(s),
    cE: (t) => document.createElement(t)
  }
};
// Datos de servicios
const servicios = [
  { 
    id: 1, 
    name: "Desarrollo de APP's Móviles", 
    description: "Programamos la APP que necesita, para luego poder exportarla a plataformas Android e IOs, utilizamos Frameworks híbridos como Ionic y React Native.", 
    order: 10, 
    img_src: "img/icon1.svg" 
  }, 
  { 
    id: 2, 
    name: "Web Scraping", 
    description: "Descargamos información de sitios públicos de su elección para que Ud. pueda disponer de dicha información ya sea en formatos .CSV, Hoja de Cálculo, Base de datos u otros a determinar.", 
    order: 20, 
    img_src: "img/icon2.svg" 
  }, 
  { 
    id: 3, 
    name: "Migración Web", 
    description: "Migramos el contenido de su actual página web, sin importar en que CMS esté desarrollada o otro CMS de su elección, nueva APP Móvil o de Escritorio.", 
    order: 30, 
    img_src: "img/icon3.svg" 
  }, 
  { 
    id: 4, 
    name: "Solución de Errores", 
    description: "Resolvemos aquellos errores que pudieran estar presentes en el código de su APP o que se deban a defectos de configuración de su servidor.", 
    order: 40, 
    img_src: "img/icon4.svg" 
  }, 
  { 
    id: 5, 
    name: "Alojamiento Web", 
    description: "El Web Hosting más conveniente.", 
    order: 50, 
    img_src: "img/icon5.svg" 
  }
];

// Datos de metodología
const metodologia = [
  {
    id: 1,
    number: 1,
    title: "Entrevista Inicial",
    description: "Nos entrevistamos contigo para clarificar las necesidades, relevar requerimientos y dimensionar el alcance del proyecto.",
    icon: "fas fa-comments"
  },
  {
    id: 2,
    number: 2,
    title: "Propuesta",
    description: "A partir del relevamiento de la entrevista, creamos una propuesta de desarrollo indicando las tecnologías a utilizar, diseño y arquitectura.",
    icon: "fas fa-file-alt"
  },
  {
    id: 3,
    number: 3,
    title: "Preparación",
    description: "Montamos un sitio de pruebas actualizado periódicamente donde podrás constatar el avance y realizar correcciones. Definimos el Producto Mínimo Viable.",
    icon: "fas fa-cogs"
  },
  {
    id: 4,
    number: 4,
    title: "Desarrollo",
    description: "Damos inicio al proceso de implementación manteniendo actualizado el sitio de pruebas y en contacto constante durante todo el proceso.",
    icon: "fas fa-code"
  },
  {
    id: 5,
    number: 5,
    title: "Testing",
    description: "Realizamos pruebas exhaustivas del sistema para garantizar su funcionamiento correcto, rendimiento óptimo y experiencia de usuario satisfactoria.",
    icon: "fas fa-vial"
  },
  {
    id: 6,
    number: 6,
    title: "Implementación",
    description: "Con cada objetivo completado y validado, realizamos la instalación del sistema en su ubicación definitiva.",
    icon: "fas fa-rocket"
  },
  {
    id: 7,
    number: 7,
    title: "Soporte",
    description: "Brindamos soporte post-venta para dudas sobre el uso, nuevas funcionalidades o corrección de bugs.",
    icon: "fas fa-headset"
  }
];

// Datos de portfolio
const portfolio = [
  {
    id: 0,
    titulo: "Grupo Fotográfico Centro",
    descripcion_organizacion: `Desarrollé un Sistema de Gestión de Concursos Fotográficos para El GFC (Grupo Fotográfico Centro) que agrupa desde 
      el año 1967 a los fotoclubes del centro este de la provincia de Buenos Aires 
      pertenecientes a la F.A.F (Federación Argentina de Fotografía). <br><br>Las ciudades que se encuentran representadas actualmente son: Balcarce, 
      Benito Juarez, Necochea, Olavarria y Tandil. 
      <br><br> El sistema permite el registro de fotoclubes, salones, fotógrafos, obras, etc. 
      Cuenta como objetivo la promoción de la actividad fotográfica en el ámbito fotoclubista y el aprendizaje continuo.`,
    url: "https://www.grupofotograficocentro.com/",
    imgs: ["gfc_1.webp", "gfc_2.webp", "gfc_3.webp"],
    tecnologias_usadas: ["PHP", "Yii", "Postgres", "Angular", "Ionic"]
  },
  {
    id: 1,
    titulo: "Buscador e Histórico de Precios",
    descripcion_organizacion: `Desarrollé un sistema de control de scrapers para la obtención de precios de diversas fuentes, registrando
      datos de más de 40 comercios realizando seguimiento de más de 30mil precios de diversos tipos de artículos, implementé una
      la funcionalidad de busqueda de precios y la posibilidad de visualizar su evolución a lo largo del tiempo.`,
    url: "https://precios.greenborn.com.ar/",
    imgs: ["precios_1.webp", "precios_2.webp", "precios_3.webp"],
    tecnologias_usadas: ["NodeJS", "Express", "MariaDB", "Vue", "Bootstrap", "Python", "Selenium", "Código Abierto"]
  },
  {
    id: 2,
    titulo: "Instancia propia de Redmine",
    descripcion_organizacion: `Gestiono una instancia propia de Redmine para la organización de las tareas del día a día.`,
    url: "https://redmine.greenborn.com.ar/",
    imgs: ["redmine_1.webp", "redmine_2.webp"],
    tecnologias_usadas: ["Redmine", "Nginx", "MariaDB"]
  },
  {
    id: 3,
    titulo: "Web Hosting Wordpress",
    descripcion_organizacion: `Proporciono servicios de hosting de Wordpress, actualización de plugins y temas, backups, etc. 
      por el momento para un cliente de un blog literario denominado Titanes de Cristal.`,
    url: "https://greenborn.com.ar/",
    imgs: ["wp_1.webp", "wp_2.webp"],
    tecnologias_usadas: ["WordPress", "Nginx", "PHP-FPM", "MariaDB"]
  },
  {
    id: 4,
    titulo: "Mapa de Quejas y Reclamos",
    descripcion_organizacion: `Desarrollé un tablero público de reclamos en donde cualquier usuario puede subir una queja geolocandizándola con 
      su ubicación actual o la que proporcione, una breve descripción y hasta tres imágenes.
      <br><br> Uno de sus objetivos es ser una prueba de concepto y base para posibles aplicaciones que requieran la geolocalización.`,
    url: "https://mapa.greenborn.com.ar",
    imgs: ["mapa_1.webp", "mapa_2.webp", "mapa_3.webp"],
    tecnologias_usadas: ["Open Street Map", "Vue", "Express", "NodeJS", "MariaDB", "MariaDB", "Código Abierto"]
  },
  {
    id: 5,
    titulo: "Componente Vue Cursor Custom",
    descripcion_organizacion: `Componente Vue.js para personalizar el cursor del mouse con efectos visuales avanzados.`,
    url: "https://www.npmjs.com/package/@greenborn/vue-custom-cursor",
    imgs: ["vue_mouse_1.webp"],
    tecnologias_usadas: ["Vue.js", "JavaScript", "NPM"]
  },
  {
    id: 6,
    titulo: "Chat Público",
    descripcion_organizacion: `Sistema de chat en tiempo real para comunicación pública con tecnologías modernas.`,
    url: "https://chat.greenborn.com.ar/",
    imgs: ["chat_1.webp"],
    tecnologias_usadas: ["WebSocket", "Node.js", "Vue.js"]
  }
];

// Datos de tecnologías
const tecnologias = [
  {
    id: 1,
    name: "PHP",
    description: "PHP es un lenguaje de programación para desarrollar aplicaciones y crear sitios web que conquista cada día más seguidores. Fácil de usar y en constante perfeccionamiento es una opción segura para aquellos que desean trabajar en proyectos calificados y sin complicaciones.",
    url: "https://www.php.net/",
    order: 0,
    img_src: "img/php.svg"
  },
  {
    id: 2,
    name: "HTML",
    description: "El HTML5 es un estándar que sirve para definir la estructura, el diseño y el contenido de una página web. En realidad, se trata de un código, un lenguaje (HTML) que define los contenidos que forman parte de una página web, como imágenes, texto, vídeos, juegos, marcos, estilo de letra, etc.",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
    order: 10,
    img_src: "img/html.svg"
  },
  {
    id: 3,
    name: "Bootstrap",
    description: "Bootstrap es un framework que permite a los desarrolladores web construir páginas web responsives de una forma más rápida y sencilla. En este sentido, proporciona un conjunto de componentes y plantillas CSS, HTML y JavaScript que cualquiera puede utilizar o modificar de manera gratuita.",
    url: "https://getbootstrap.com/",
    order: 20,
    img_src: "img/bootstrap.svg"
  },
  {
    id: 4,
    name: "JavaScript",
    description: "JavaScript es un lenguaje de programación que los desarrolladores utilizan para hacer páginas web interactivas. Desde actualizar fuentes de redes sociales a mostrar animaciones y mapas interactivos, las funciones de JavaScript pueden mejorar la experiencia del usuario de un sitio web.",
    url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/What_is_JavaScript",
    order: 30,
    img_src: "img/js.svg"
  },
  {
    id: 5,
    name: "TypeScript",
    description: "TypeScript es un lenguaje orientado a objetos (como el lenguaje R, por ejemplo). Esto quiere decir que tanto el cliente como el servidor tienen acceso a la escritura de código. Además, se trata de un código abierto. Por otro lado, destaca por ser multiplataforma y, por consiguiente, ser portátil.",
    url: "https://www.typescriptlang.org/",
    order: 40,
    img_src: "img/ts.svg"
  },
  {
    id: 6,
    name: "Python",
    description: "Python es un lenguaje de programación ampliamente utilizado en las aplicaciones web, el desarrollo de software, la ciencia de datos y el machine learning (ML).",
    url: "https://www.python.org/",
    order: 50,
    img_src: "img/py.svg"
  },
  {
    id: 7,
    name: "Java",
    description: "El lenguaje de programación Java se usa en plataformas y dispositivos, debido a su código fácilmente transferible. Entre los usos más populares de Java se incluyen el software empresarial, desarrollo de aplicaciones móviles, aplicaciones web, aplicaciones basadas en la nube, juegos y aplicaciones de IoT.",
    url: "https://www.java.com",
    order: 50,
    img_src: "img/java.svg"
  },
  {
    id: 8,
    name: "Django",
    description: "Django es un proyecto de Python gratuito y de código abierto con una comunidad activa que revisa y mantiene el software. Una organización sin fines de lucro llamada Django Software Foundation promueve y respalda el uso y el mantenimiento de Django.",
    url: "https://www.djangoproject.com/",
    order: 60,
    img_src: "img/dj.svg"
  },
  {
    id: 9,
    name: "Maria DB",
    description: "MariaDB es un sistema de gestión de bases de datos relacionales (RDBMS) gratuito y de código abierto. Fue creado por los desarrolladores originales de MySQL por la preocupación de que MySQL pasara a ser comercializado después de que Oracle lo adquiriera en 2009.",
    url: "https://mariadb.org/",
    order: 70,
    img_src: "img/mariadb.svg"
  },
  {
    id: 10,
    name: "WordPress",
    description: "WordPress es un sistema de gestión de contenidos (CMS) que permite crear y administrar sitios web de manera sencilla y sin necesidad de utilizar un lenguaje de programación: Es gratuito y de código abierto, Es versátil y adaptable, Es fácil de usar, Tiene una amplia gama de temas y plugins, Está respaldado por una comunidad global.",
    url: "https://wordpress.com/",
    order: 80,
    img_src: "img/wp.svg"
  }
];

// Datos de redes sociales
const redesSociales = [
  {
    id: 0, 
    t: "Facebook", 
    i: "assets/img/facebook.svg",
    e: "https://www.facebook.com/Greenborn-100550959124104"
  },
  {
    id: 10, 
    t: "Instagram", 
    i: "assets/img/instagram.svg",
    e: "https://www.instagram.com/greenborn_soft/"
  },
  {
    id: 40, 
    t: "Linkedin", 
    i: "assets/img/linkedin.svg",
    e: "https://www.linkedin.com/company/greenborn"
  }
];

// Datos de navegación
const enlaces = [
  { section_id: "seccion-inicio", label: "Inicio", active: true },
  { section_id: "seccion-servicios", label: "Servicios", active: false },
  { section_id: "seccion-metodologia", label: "Metodología", active: false },
  { section_id: "seccion-portfolio", label: "Portfolio", active: false },
  { section_id: "seccion-tecnologias", label: "Tecnologías", active: false },
  { section_id: "seccion-contacto", label: "Contacto", active: false }
];

// Variables globales
let animationInterval;
let currentImageIndexes = {};

// Función para inicializar el efecto Matrix
function initMatrixEffect() {
  const canvas = $.gId('canv');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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

  window.addEventListener('resize', resizeCanvas);
}

// Función para cargar servicios
function loadServices() {
  const grid = $.gId('services-grid');
  if (!grid) return;

  grid.innerHTML = '';
  
  servicios.forEach((servicio, index) => {
    const wrapper = $.d.cE('div');
    wrapper.className = 'service-card-wrapper';
    wrapper.style.animationDelay = `${index * 0.1}s`;
    
    wrapper.innerHTML = `
      <div class="service-card-modern">
        <div class="card-content">
          <div class="card-background" style="background-image: url('${servicio.img_src}')"></div>
          
          <div class="card-overlay">
            <div class="service-icon">
              <img src="${servicio.img_src}" alt="${servicio.name}" class="icon-image" />
            </div>
            
            <div class="service-info">
              <h3 class="service-title">${servicio.name}</h3>
              <p class="service-description">${servicio.description}</p>
            </div>
            
            <div class="service-cta">
              <a href="#seccion-contacto" class="learn-more">Saber más →</a>
            </div>
          </div>
        </div>
      </div>
    `;
    
    grid.appendChild(wrapper);
  });
}

// Función para cargar metodología
function loadMethodology() {
  const timeline = $.gId('methodology-timeline');
  if (!timeline) return;

  timeline.innerHTML = '';
  
  metodologia.forEach((step, index) => {
    const stepDiv = $.d.cE('div');
    stepDiv.className = `timeline-step ${index % 2 === 1 ? 'step-right' : ''}`;
    stepDiv.style.animationDelay = `${index * 0.2}s`;
    
    stepDiv.innerHTML = `
      <div class="step-number">
        <div class="number-circle">
          <span class="number">${step.number}</span>
        </div>
      </div>
      
      <div class="step-content">
        <div class="step-card">
          <div class="step-icon">
            <i class="${step.icon}"></i>
          </div>
          <h3 class="step-title">${step.title}</h3>
          <p class="step-description">${step.description}</p>
        </div>
      </div>
    `;
    
    timeline.appendChild(stepDiv);
  });
}

// Función para cargar portfolio
function loadPortfolio() {
  const grid = $.gId('portfolio-grid');
  if (!grid) return;

  grid.innerHTML = '';
  
  portfolio.forEach((proyecto, index) => {
    const wrapper = $.d.cE('div');
    wrapper.className = 'portfolio-item-wrapper';
    wrapper.style.animationDelay = `${index * 0.1}s`;
    
    const techTags = proyecto.tecnologias_usadas.map(tech => 
      `<span class="tech-tag">${tech}</span>`
    ).join('');
    
    wrapper.innerHTML = `
      <div class="portfolio-card-modern">
        <div class="portfolio-card-content">
          
          <div class="portfolio-carousel">
            <div class="portfolio-images" data-project-id="${proyecto.id}">
              ${proyecto.imgs.map((img, imgIndex) => 
                `<img class="portfolio-image ${imgIndex === 0 ? 'active' : ''}" 
                     src="img/portfolio/${img}" 
                     alt="Imagen Portfolio" 
                     style="display: ${imgIndex === 0 ? 'block' : 'none'}" />`
              ).join('')}
            </div>
          </div>

          <div class="portfolio-overlay">
            <div class="overlay-content">
              
              <h3 class="project-title">${proyecto.titulo}</h3>
              
              <div class="project-description">${proyecto.descripcion_organizacion}</div>
              
              <div class="project-technologies">
                <div class="tech-tags">
                  ${techTags}
                </div>
              </div>
              
              <div class="project-cta">
                <a href="${proyecto.url}" target="_blank" class="visit-project">
                  <i class="fas fa-external-link-alt"></i>
                  Visitar Proyecto
                </a>
              </div>
              
            </div>
          </div>

        </div>
      </div>
    `;
    
    grid.appendChild(wrapper);
    
    // Inicializar carrusel para este proyecto
    initCarousel(proyecto.id, proyecto.imgs);
  });
}

// Función para inicializar carrusel de imágenes
function initCarousel(projectId, images) {
  if (images.length <= 1) return;
  
  currentImageIndexes[projectId] = 0;
  const randomInterval = Math.floor(Math.random() * 3000) + 2000;
  
  setInterval(() => {
    const container = document.querySelector(`.portfolio-images[data-project-id="${projectId}"]`);
    if (!container) return;
    
    const currentImages = container.querySelectorAll('.portfolio-image');
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
    const wrapper = $.d.cE('div');
    wrapper.className = 'tech-card-wrapper';
    wrapper.style.animationDelay = `${index * 0.1}s`;
    
    wrapper.innerHTML = `
      <div class="tech-card-modern">
        <div class="tech-card-content">
          
          <div class="tech-logo">
            <a href="${tech.url}" target="_blank" class="tech-link">
              <img src="${tech.img_src}" alt="${tech.name}" class="tech-image" />
            </a>
          </div>
          
          <div class="tech-info">
            <h3 class="tech-name">${tech.name}</h3>
            <p class="tech-description">${tech.description}</p>
            
            <div class="tech-cta">
              <a href="${tech.url}" target="_blank" class="tech-learn-more">
                Ver más →
              </a>
            </div>
          </div>
          
        </div>
      </div>
    `;
    
    grid.appendChild(wrapper);
  });
}

// Función para cargar redes sociales
function loadSocialLinks() {
  const container = $.gId('social-links');
  if (!container) return;

  container.innerHTML = '';
  
  redesSociales.forEach(red => {
    const link = $.d.cE('a');
    link.href = red.e;
    link.target = '_blank';
    link.className = 'social-link';
    link.title = red.t;
    
    link.innerHTML = `<img src="${red.i}" alt="${red.t}" class="social-icon" />`;
    
    container.appendChild(link);
  });
}

// Función para cargar navegación
function loadNavigation() {
  const navList = $.gId('nav-list');
  if (!navList) return;

  navList.innerHTML = '';
  
  enlaces.forEach(enlace => {
    const li = $.d.cE('li');
    li.className = `nav-item ${enlace.active ? 'nav-item-active' : ''}`;
    
    li.innerHTML = `
      <button class="nav-link" data-section="${enlace.section_id}">
        <span class="nav-icon">
          <i class="${getIconForSection(enlace.section_id)}"></i>
        </span>
        <span class="nav-text">${enlace.label}</span>
        <span class="nav-indicator"></span>
      </button>
    `;
    
    navList.appendChild(li);
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
    document.body.style.overflow = 'hidden';
  }
  
  // Función para cerrar el menú
  function closeMenu() {
    isOpen = false;
    menuToggle.classList.remove('active');
    menuOverlay.classList.remove('active');
    menuPanel.classList.remove('active');
    document.body.style.overflow = '';
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
      const scrollY = window.scrollY + window.innerHeight;
      
      if (scrollY > headerTop && window.scrollY < headerBottom) {
        modernMenu.classList.add('menu-hidden');
      } else {
        modernMenu.classList.remove('menu-hidden');
      }
    }
  }
  
  // Verificar posición inicial
  checkHeaderPosition();
  
  // Escuchar scroll para ocultar/mostrar menú en header
  window.addEventListener('scroll', checkHeaderPosition);
  
  // Manejar clics en enlaces de navegación
  const navLinks = $.d.sA('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('data-section');
      
      // Actualizar enlaces activos
      enlaces.forEach(enlace => {
        enlace.active = enlace.section_id === sectionId;
      });
      
      // Actualizar UI
      $.d.sA('.nav-item').forEach(item => {
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
  window.addEventListener('scroll', function() {
    for (let i = 0; i < enlaces.length; i++) {
      const section = $.gId(enlaces[i].section_id);
      if (section && window.scrollY > section.offsetTop - 100) {
        enlaces[i].active = true;
        // Actualizar UI
        $.d.sA('.nav-item').forEach(item => {
          item.classList.remove('nav-item-active');
        });
        const activeLink = document.querySelector(`[data-section="${enlaces[i].section_id}"]`);
        if (activeLink) {
          activeLink.closest('.nav-item').classList.add('nav-item-active');
        }
      } else {
        enlaces[i].active = false;
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
  document.addEventListener('click', (e) => {
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
  const sections = $.d.sA('.seccion');
  const navItems = $.d.sA('.nav-item');
  
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
          enlace.active = enlace.section_id === sectionId;
        });
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
  const links = $.d.sA('a[href^="#"]');
  
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
  document.addEventListener('mousemove', (e) => {
    const cards = $.d.sA('.service-card-modern');
    
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
  $.d.sA('.service-card-modern').forEach(card => {
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
  const animatedElements = $.d.sA('.service-card-wrapper, .portfolio-item-wrapper, .tech-card-wrapper, .timeline-step');
  animatedElements.forEach(el => observer.observe(el));
}

// Función principal de inicialización
function init() {
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
  window.closeModal = closeModal;
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Limpiar intervalos al cerrar la página
window.addEventListener('beforeunload', () => {
  if (animationInterval) {
    clearInterval(animationInterval);
  }
});
