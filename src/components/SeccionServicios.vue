<template>
  <div class="row h-100vh bg-green1 disable-select">
    <div class="col p-5">

      <div class="row">
        <div class="col">
          <div class="text-h-2">Servicios</div>
        </div>
      </div>


      <div class="row justifify-content-center" v-for="s in listado_servicios" :key="s">
        <div class="col-12 col-md-10 col-lg-4 offset-md-1 offset-lg-4 ">
          <div class="row">

            <div class="col-sm-auto">
              <div class="row">
                <div class="col"></div>
                <div class="col-auto mb-3"><img class="icon-f-img disable-select"
                    :src="'https://clientes.api.greenborn.com.ar/' + s.img_src" /></div>
                <div class="col"></div>
              </div>
            </div>

            <div class="col">
              <div class="row">
                <div class="col text-center">
                  <h3>{{ s.name }}</h3>
                </div>
              </div>

              <div class="row">
                <div class="col-12 text-justify">
                  <p>{{ s.description }}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
  
</template>

<script setup>
import { ref } from 'vue'

const listado_servicios = ref([{ "id": 1, "name": "Desarrollo de APP's Moviles", "description": "Programamos la APP que necesita, para luego poder exportarla a plataformas Android e IOs, utilizamos Frameworks hibridos como Ionic y React Native.", "order": 10, "img_src": "public/img/icon1.svg" }, { "id": 2, "name": "Web Scraping", "description": "Descargamos información de sitios públicos de su elección para que Ud. pueda disponer de dicha información ya sea en formatos .CSV, Hoja de Cálculo,  Base de datos u otros a determinar.", "order": 20, "img_src": "public/img/icon2.svg" }, { "id": 3, "name": "Migración Web", "description": "Migramos el contenido de su actual página web, sin importar en que CMS esté desarrollada o otro CMS de su elección, nueva APP Movil o de Escritorio.", "order": 30, "img_src": "public/img/icon3.svg" }, { "id": 4, "name": "Solución de Errores", "description": "Resolvemos aquellos errores que pudieran estar presentes en el código de su APP o que se deban a defectos de configuración de su servidor.", "order": 40, "img_src": "public/img/icon4.svg" }, { "id": 5, "name": "Alojamiento Web", "description": "El Web Hosting más conveniente.", "order": 50, "img_src": "public/img/icon5.svg" }])
</script>