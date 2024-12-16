<template>
<div class="row bg-green1 h-100vh disable-select">
  <div class="col">
    Seccion de Contacto
  </div>
</div>
<!--
<div class="row disable-select text-center ">
  <div class="col">
    <h2 class="w-100">Contacto</h2>
    <p class="text-center mb-3">Para responder consultas / realizar cotizaciones.</p>
  </div>
</div>

<div class="container">
  <div class="row">
    
    <div class="col-12 col-lg-4 bg-contact-1 v-100 disable-select">
      <div class="row mt-4">
        <div class="col p-5">
          <h3>Información de contacto</h3>
          <p>Completa el formulario y en el plazo de 24 hs te responderemos</p>
        </div>
      </div>
    </div>
  
    <div class="col-12 col-lg-8 p-5">
      <div class="row mt-4">

          <div class="mb-3 col-12 col-sm-6">
            <label for="name" class="form-label">Nombre</label>
            <input type="text" class="form-control" id="name" placeholder="Juan"
                    v-model="form_.name">
          </div>

          <div class="mb-3 col-12 col-sm-6">
            <label for="surname" class="form-label">Apellido</label>
            <input type="text" class="form-control" id="surname" placeholder="Perez"
                    v-model="form_.surname">
          </div>

      </div>

      <div class="row">

        <div class="mb-3 col-12 col-sm-6">
          <label for="email" class="form-label">E-Mail</label>
          <input type="email" class="form-control" id="email" placeholder="juan.perz@emailprovider.com"
                  v-model="form_.email">
        </div>

        <div class="mb-3 col-12 col-sm-6">
          <label for="tel" class="form-label">Teléfono</label>
          <input type="text" class="form-control" id="tel" placeholder="+1 234 2344"
                  v-model="form_.tel" >
        </div>
        
      </div>

      <div class="row">

        <div class="mb-3 col-12">
          <label for="message" class="form-label">Mensaje</label>
          <textarea class="form-control" id="message" rows="6"
                    v-model="form_.message" ></textarea>
        </div>
        
      </div>

      <div class="row">

        <div class="col"></div>
        <div class="col-auto">
          <button type="button" class="btn btn-primary" @click="sendMessage">Enviar Mensaje</button>
        </div>
      </div>
      
    </div>
  </div>
</div>-->
</template>

<script setup>
import { ref } from 'vue'

const form_ = ref({})

function sendMessage() {   
}
</script>