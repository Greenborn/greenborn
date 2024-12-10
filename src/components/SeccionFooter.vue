<template>
<div class="row app-footer pt-2">
  <div class="p-4 container app-footer-container">
    
    <div class="row">
      <div class="col-12 col-sm-6 text-center disable-select">
        <p><span class="copyleft">&copy;</span> 2024 Greenborn - Desarrollo de Software</p>
      </div>

      <div class="col-12 col-sm-6">
        <div class="row">
          <div class="col"></div>

          <div class="col-auto disable-select"><p>Nuestras redes:</p></div>
          
          <div class="col-auto d-flex flex-row justify-content-center alig-items-center">
            <div class="row">
              <div class="col" v-for="r in listado_contactos" :key="r">
                    <a :href="r.e" target="_blank"><img :src="r.i" class="img-contact"/></a>
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

const listado_contactos = ref([
    {
      id:0, 
      t:"Facebook", 
      i:"assets/img/facebook.svg",
      e:"https://www.facebook.com/Greenborn-100550959124104"
    },
    {
      id:10, 
      t:"Instagram", 
      i:"assets/img/instagram.svg",
      e:"https://www.instagram.com/greenborn_soft/"
    },
    {
      id:30, 
      t:"Discord", 
      i:"assets/img/discord.svg",
      e:"https://discord.gg/ZH36cEh2"
    },
    {
      id:40, 
      t:"Linkedin", 
      i:"assets/img/linkedin.svg",
      e:"https://www.linkedin.com/company/greenborn"
    },
  ])
</script>