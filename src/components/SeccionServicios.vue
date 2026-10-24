<template>
  <section class="services-section seccion seccion--alt" id="seccion-servicios">
    <div class="container-modern">

      <!-- Header de la sección -->
      <div class="section-header">
        <p class="section-eyebrow">Servicios</p>
        <h2 class="section-title">Lo que <em>hacemos</em></h2>
        <p class="section-subtitle">
          Soluciones integrales de desarrollo de software libre para tu negocio
        </p>
      </div>

      <!-- Grid de servicios -->
      <div class="services-grid">
        <div
          v-for="(service, index) in listado_servicios.filter(s => !s.oculto)"
          :key="service.id"
          class="service-card-wrapper"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <SubSecServicio :data="service" />
        </div>
      </div>

      <!-- CTA adicional -->
      <div class="cta-panel">
        <h3>¿Necesitás algo específico?</h3>
        <p>Contanos tu idea y armamos una propuesta a medida, sin compromiso.</p>
        <a href="#seccion-contacto" class="btn-modern">
          Consulta gratuita
        </a>
      </div>
    </div>

  </section>
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
  // Tarjeta "Cuenta Greenborn" oculta en la navegación principal (grilla de servicios).
  // NO se eliminó: sigue accesible directamente en cuenta-usuario.html.
  // Para volver a mostrarla, quitar "oculto: true".
  {
    "id": 6,
    "name": "Cuenta Greenborn",
    "description": "Accede a todas las mini aplicaciones y servicios exclusivos con tu cuenta Greenborn. Gestiona tu identidad digital y mejora tu experiencia de usuario.",
    "order": 60,
    "img_src": IconN1,
    "link": "https://greenborn.com.ar/cuenta-usuario.html",
    "oculto": true
  }
])
</script>

<style scoped>
.services-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--sp-4);
  margin-bottom: var(--sp-7);
}

.service-card-wrapper {
  flex: 1 1 320px;
  max-width: 380px;
  animation: fadeInUp 0.8s ease-out both;
}

@media (max-width: 768px) {
  .services-grid {
    gap: var(--sp-3);
  }

  .service-card-wrapper {
    flex: 0 1 520px;
    max-width: 520px;
  }
}
</style>