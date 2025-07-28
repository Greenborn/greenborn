<template>
  <div class="portfolio-section seccion" id="seccion-portfolio">
    <div class="container-modern">
      
      <!-- Header de la sección -->
      <div class="section-header">
        <h2 class="section-title">Nuestro Portfolio</h2>
        <p class="section-subtitle">
          Proyectos que demuestran nuestra experiencia en desarrollo de software libre
        </p>
      </div>

      <!-- Grid de proyectos -->
      <div class="portfolio-grid">
        <div 
          v-for="(proyecto, index) in trabajos" 
          :key="proyecto.id"
          class="portfolio-item-wrapper"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <SubSecPortfolio :data="proyecto" />
        </div>
      </div>

      <!-- CTA de portfolio -->
      <div class="portfolio-cta">
        <div class="cta-content">
          <h3>¿Te gusta nuestro trabajo?</h3>
          <p>Hablemos sobre tu próximo proyecto y cómo podemos ayudarte a alcanzar tus objetivos</p>
          <a href="#seccion-contacto" class="btn-modern">
            Iniciar Proyecto
          </a>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SubSecPortfolio from './SubSecPortfolio.vue';

const trabajos = ref([
  {
    id: 0,
    titulo: "Grupo Fotográfico Centro",
    descripcion_organizacion: `Desarrollé un Sistema de Gestión de Concursos Fotográficos para El GFC (Grupo Fotográfico Centro) que agrupa desde 
      el año 1967 a los fotoclubes del centro este de la provincia de Buenos Aires 
      pertenecientes a la F.A.F (Federación Argentina de Fotografía). <br><br>Las ciudades que se encuentran representadas actualmente son: Balcarce, 
      Benito Juarez, Necochea, Olavarria y Tandil. 
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
])
</script>

<style scoped>
.portfolio-section {
  background: var(--bg-gradient-dark);
  position: relative;
}

.portfolio-section::before {
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

.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.portfolio-item-wrapper {
  animation: fadeInUp 0.8s ease-out both;
}

.portfolio-cta {
  text-align: center;
  padding: 3rem;
  background: var(--bg-gradient-card);
  border-radius: 20px;
  border: 1px solid var(--border-light);
  margin-top: 2rem;
  animation: fadeInUp 0.8s ease-out 0.5s both;
}

.cta-content h3 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  margin-bottom: 1rem;
  color: var(--text-light);
}

.cta-content p {
  font-size: 1.1rem;
  color: var(--text-gray);
  margin-bottom: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

/* Responsive */
@media (max-width: 768px) {
  .portfolio-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .portfolio-cta {
    padding: 2rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .section-header {
    margin-bottom: 3rem;
  }
  
  .portfolio-cta {
    padding: 1.5rem 1rem;
  }
}
</style>