<template>
  <div class="row bg-green1 h-100vh disable-select" id="seccion-portfolio">
    <div class="col p-5 mt-5">

      <div class="row p-5 justifify-content-center">
        <div class="col col-md-6 col-lg-4 col-xl-3 p-2"  v-for="s in trabajos" :key="s">

          <SubSecPortfolio :data="s" />

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
    titulo: "Grupo Fotográfico Centro",
    descripcion_organizacion: `Desarrollé un Sistema de Gestión de Concursos Fotográficos para El GFC (Grupo Fotográfico Centro) que agrupa desde 
      el año 1967 a los fotoclubes del centro este de la provincia de Buenos Aires 
      pertenecientes a la F.A.F (Federación Argentina de Fotografía). <br><br>Las ciudades que se encuentran representadas actualmente son: Balcarce, 
      Benito Juarez, Necochea, Olavarria y Tandil. 
      Cuenta como objetivo la promoción de la actividad fotográfica en el ámbito fotoclubista y el aprendizaje continuo.`,
    url: "https://www.grupofotograficocentro.com/",
    tecnologias_usadas: ["PHP", "Yii", "Postgres", "Angular", "Ionic"]
  },
  {
    titulo: "Buscador e Histórico de Precios",
    descripcion_organizacion: `Desarrollé un sistema de control de scrapers para la obtención de precios de diversas fuentes, registrando
      datos de más de 40 comercios realizando seguimiento de más de 30mil precios de diversos tipos de artículos, implementé una
      la funcionalidad de busqueda de precios y la posibilidad de visualizar su evolución a lo largo del tiempo.`,
    url: "https://precios.greenborn.com.ar/",
    tecnologias_usadas: ["NodeJS", "Express", "MariaDB", "Vue", "Bootstrap", "Python", "Selenium", "Código Abierto"]
  },
  {
    titulo: "Instancia propia de Redmine",
    descripcion_organizacion: `Gestiono una instancia propia de Redmine para la organización de las tareas del día a día.`,
    url: "https://redmine.greenborn.com.ar/",
    tecnologias_usadas: ["Redmine", "Nginx", "MariaDB"]
  },
  {
    titulo: "Web Hosting Wordpress",
    descripcion_organizacion: `Proporciono servicios de hosting de Wordpress, actualización de plugins y temas, backups, etc. 
      por el momento para un cliente de un blog literario denominado Titanes de Cristal.`,
    url: "https://titanesdecristal.com/",
    tecnologias_usadas: ["WordPress", "Nginx", "PHP-FPM", "MariaDB"]
  },
  {
    titulo: "Mapa de Quejas y Reclamos",
    descripcion_organizacion: `Desarrollé un tablero público de reclamos en donde cualquier usuario puede subir una queja geolocandizándola con 
      su ubicación actual o la que proporcione, una breve descripción y hasta tres imágenes.
      <br><br> Uno de sus objetivos es ser una prueba de concepto y base para posibles aplicaciones que requieran la geolocalización.`,
    url: "https://mapa.greenborn.com.ar",
    tecnologias_usadas: ["Open Street Map", "Vue", "Express", "NodeJS", "MariaDB", "MariaDB", "Código Abierto"]
  }
])
</script>

<style scoped>
  .card{
    color: #000;
  }
</style>