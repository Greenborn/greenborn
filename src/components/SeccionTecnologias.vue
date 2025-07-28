<template>
<div class="technologies-section seccion" id="seccion-tecnologias">
  <div class="container-modern">
    
    <!-- Header de la sección -->
    <div class="section-header">
      <h2 class="section-title">Tecnologías</h2>
      <p class="section-subtitle">
        Utilizamos las mejores tecnologías de software libre para crear soluciones robustas y escalables
      </p>
    </div>

    <!-- Grid de tecnologías -->
    <div class="technologies-grid">
      <div 
        v-for="(tech, index) in listado_tecnologias_leng" 
        :key="tech.id"
        class="tech-card-wrapper"
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <SubSecTecnologia :data="tech" />
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-number">10+</div>
          <div class="stat-label">Tecnologías</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">100%</div>
          <div class="stat-label">Software Libre</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">∞</div>
          <div class="stat-label">Posibilidades</div>
        </div>
      </div>
    </div>

  </div>
</div>
</template>

<script setup>
import { ref } from 'vue'
import SubSecTecnologia from './SubSecTecnologia.vue';

import IconHtml from '/img/html.svg'
import IconPHP from '/img/php.svg'
import IconBootstrap from '/img/bootstrap.svg'
import IconJs from '/img/js.svg'
import IconTs from '/img/ts.svg'
import IconPy from '/img/py.svg'
import IconJava from '/img/java.svg'
import IconDj from '/img/dj.svg'
import IconMariaDB from '/img/mariadb.svg'
import IconWP from '/img/wp.svg'

const listado_tecnologias_leng = ref([
  {"id":1,"name":"PHP","description":"PHP es un lenguaje de programación para desarrollar aplicaciones y crear sitios web que conquista cada día más seguidores. Fácil de usar y en constante perfeccionamiento es una opción segura para aquellos que desean trabajar en proyectos calificados y sin complicaciones.","url":"https://www.php.net/","order":0,
  "img_src":IconPHP},
  {"id":2,"name":"HTML","description":"El HTML5 es un estándar que sirve para definir la estructura, el diseño y el contenido de una página web. En realidad, se trata de un código, un lenguaje (HTML) que define los contenidos que forman parte de una página web, como imágenes, texto, vídeos, juegos, marcos, estilo de letra, etc.","url":"https://developer.mozilla.org/en-US/docs/Web/HTML","order":10,
  "img_src":IconHtml},
  {"id":3,"name":"Bootstrap","description":"Bootstrap es un framework que permite a los desarrolladores web construir páginas web responsives de una forma más rápida y sencilla. En este sentido, proporciona un conjunto de componentes y plantillas CSS, HTML y JavaScript que cualquiera puede utilizar o modificar de manera gratuita.","url":"https://getbootstrap.com/","order":20,
  "img_src":IconBootstrap},
  {"id":4,"name":"JavaScript","description":"JavaScript es un lenguaje de programación que los desarrolladores utilizan para hacer páginas web interactivas. Desde actualizar fuentes de redes sociales a mostrar animaciones y mapas interactivos, las funciones de JavaScript pueden mejorar la experiencia del usuario de un sitio web.","url":"https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/What_is_JavaScript","order":30,
  "img_src":IconJs},
  {"id":5,"name":"TypeScript","description":"TypeScript es un lenguaje orientado a objetos (como el lenguaje R, por ejemplo). Esto quiere decir que tanto el cliente como el servidor tienen acceso a la escritura de código. Además, se trata de un código abierto. Por otro lado, destaca por ser multiplataforma y, por consiguiente, ser portátil.","url":"https://www.typescriptlang.org/","order":40,
  "img_src":IconTs},
  {"id":6,"name":"Python","description":"Python es un lenguaje de programación ampliamente utilizado en las aplicaciones web, el desarrollo de software, la ciencia de datos y el machine learning (ML).","url":"https://www.python.org/","order":50,
  "img_src":IconPy},
  {"id":7,"name":"Java","description":"El lenguaje de programación Java se usa en plataformas y dispositivos, debido a su código fácilmente transferible. Entre los usos más populares de Java se incluyen el software empresarial, desarrollo de aplicaciones móviles, aplicaciones web, aplicaciones basadas en la nube, juegos y aplicaciones de IoT.","url":"https://www.java.com","order":50,
  "img_src":IconJava},
  {"id":8,"name":"Django","description":"Django es un proyecto de Python gratuito y de código abierto con una comunidad activa que revisa y mantiene el software. Una organización sin fines de lucro llamada Django Software Foundation promueve y respalda el uso y el mantenimiento de Django.","url":"https://www.djangoproject.com/","order":60,
  "img_src":IconDj},
  {"id":9,"name":"Maria DB","description":"MariaDB es un sistema de gestión de bases de datos relacionales (RDBMS) gratuito y de código abierto. Fue creado por los desarrolladores originales de MySQL por la preocupación de que MySQL pasara a ser comercializado después de que Oracle lo adquiriera en 2009.","url":"https://mariadb.org/","order":70,
  "img_src":IconMariaDB},
  {"id":10,"name":"WordPress","description":"WordPress es un sistema de gestión de contenidos (CMS) que permite crear y administrar sitios web de manera sencilla y sin necesidad de utilizar un lenguaje de programación: Es gratuito y de código abierto, Es versátil y adaptable, Es fácil de usar, Tiene una amplia gama de temas y plugins, Está respaldado por una comunidad global.","url":"https://wordpress.com/","order":80,
  "img_src":IconWP}])
</script>

<style scoped>
.technologies-section {
  background: var(--bg-gradient-dark);
  position: relative;
}

.technologies-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--primary-green) 50%, transparent 100%);
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
  animation: fadeInUp 0.8s ease-out;
}

.section-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--accent-green) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: clamp(1.1rem, 2vw, 1.3rem);
  color: var(--text-gray);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.technologies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.tech-card-wrapper {
  animation: fadeInUp 0.8s ease-out both;
}

.stats-section {
  text-align: center;
  padding: 3rem;
  background: var(--bg-gradient-card);
  border-radius: 20px;
  border: 1px solid var(--border-light);
  margin-top: 2rem;
  animation: fadeInUp 0.8s ease-out 0.5s both;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--accent-green) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  animation: pulse 2s infinite;
}

.stat-label {
  font-size: 1.1rem;
  color: var(--text-gray);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Responsive */
@media (max-width: 768px) {
  .technologies-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .stats-section {
    padding: 2rem 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 480px) {
  .section-header {
    margin-bottom: 3rem;
  }
  
  .stats-section {
    padding: 1.5rem 1rem;
  }
}
</style>