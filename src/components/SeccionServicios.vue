<template>
  <div class="services-section seccion" id="seccion-servicios">
    <div class="container-modern">
      
      <!-- Header de la sección -->
      <div class="section-header">
        <h2 class="section-title">Nuestros Servicios</h2>
        <p class="section-subtitle">
          Soluciones integrales de desarrollo de software libre para tu negocio
        </p>
      </div>

      <!-- Grid de servicios -->
      <div class="services-grid">
        <div 
          v-for="(service, index) in listado_servicios" 
          :key="service.id"
          class="service-card-wrapper"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <SubSecServicio :data="service" />
        </div>
      </div>

      <!-- CTA adicional -->
      <div class="services-cta">
        <div class="cta-content">
          <h3>¿Necesitas algo específico?</h3>
          <p>Contáctanos para discutir tu proyecto personalizado</p>
          <a href="#seccion-contacto" class="btn-modern">
            Consulta Gratuita
          </a>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SubSecServicio from './SubSecServicio.vue';

import IconN1 from '/img/icon1.svg'
import IconN2 from '/img/icon2.svg'
import IconN3 from '/img/icon3.svg' 
import IconN4 from '/img/icon4.svg' 
import IconN5 from '/img/icon5.svg' 

const listado_servicios = ref([
  { 
    "id": 1, 
    "name": "Desarrollo de APP's Móviles", 
    "description": "Programamos la APP que necesita, para luego poder exportarla a plataformas Android e IOs, utilizamos Frameworks híbridos como Ionic y React Native.", 
    "order": 10, 
    "img_src": IconN1 
  }, 
  { 
    "id": 2, 
    "name": "Web Scraping", 
    "description": "Descargamos información de sitios públicos de su elección para que Ud. pueda disponer de dicha información ya sea en formatos .CSV, Hoja de Cálculo, Base de datos u otros a determinar.", 
    "order": 20, 
    "img_src": IconN2 
  }, 
  { 
    "id": 3, 
    "name": "Migración Web", 
    "description": "Migramos el contenido de su actual página web, sin importar en que CMS esté desarrollada o otro CMS de su elección, nueva APP Móvil o de Escritorio.", 
    "order": 30, 
    "img_src": IconN3 
  }, 
  { 
    "id": 4, 
    "name": "Solución de Errores", 
    "description": "Resolvemos aquellos errores que pudieran estar presentes en el código de su APP o que se deban a defectos de configuración de su servidor.", 
    "order": 40, 
    "img_src": IconN4 
  }, 
  { 
    "id": 5, 
    "name": "Alojamiento Web", 
    "description": "El Web Hosting más conveniente.", 
    "order": 50, 
    "img_src": IconN5 
  },
  {
    "id": 6,
    "name": "Cuenta Greenborn",
    "description": "Accede a todas las mini aplicaciones y servicios exclusivos con tu cuenta Greenborn. Gestiona tu identidad digital y mejora tu experiencia de usuario.",
    "order": 60,
    "img_src": IconN1,
    "link": "https://greenborn.com.ar/cuenta-usuario.html"
  }
])
</script>

<style scoped>
.services-section {
  background: var(--bg-gradient-dark);
  position: relative;
}

.services-section::before {
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

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.service-card-wrapper {
  animation: fadeInUp 0.8s ease-out both;
}

.services-cta {
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
  .services-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .services-cta {
    padding: 2rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .section-header {
    margin-bottom: 3rem;
  }
  
  .services-cta {
    padding: 1.5rem 1rem;
  }
}
</style>