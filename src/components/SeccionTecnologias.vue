<template>
<div class="row disable-select text-center">
  <h2 class="mb-3 w-100">Tecnologías</h2>
</div>

<div class="row">
  <div class="col-12">
    
    <div class="container">
      <div class="row">
        <div class="col d-none d-lg-block"></div>
        <div class="d-flex flex-row col-6 col-sm-3 col-md-2 col-lg-1 justify-content-center alig-items-center p-4"
              v-for="r in listado_tecnologias_leng" :key="r">
              <a href="{{r.url}}" target="_blank"><img :src="'https://clientes.api.greenborn.com.ar/'+r.img_src" class="img-tecno"/></a>
        </div>
        <div class="col d-none d-lg-block"></div>
      </div>
    </div>
  
  </div>
</div>
</template>

<script setup>
import { ref } from 'vue'

const listado_tecnologias_leng = ref([{"id":1,"name":"PHP","description":"","url":"https://www.php.net/","order":0,"img_src":"public/img/php.svg"},{"id":2,"name":"HTML","description":"","url":"https://developer.mozilla.org/en-US/docs/Web/HTML","order":10,"img_src":"public/img/html.svg"},{"id":3,"name":"Bootstrap","description":"","url":"https://getbootstrap.com/","order":20,"img_src":"public/img/bootstrap.svg"},{"id":4,"name":"JavaScript","description":"","url":"https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/What_is_JavaScript","order":30,"img_src":"public/img/js.svg"},{"id":5,"name":"TypeScript","description":"","url":"https://www.typescriptlang.org/","order":40,"img_src":"public/img/ts.svg"},{"id":6,"name":"Python","description":"","url":"https://www.python.org/","order":50,"img_src":"public/img/py.svg"},{"id":7,"name":"Java","description":"","url":"https://www.java.com","order":50,"img_src":"public/img/java.svg"},{"id":8,"name":"Django","description":"","url":"https://www.djangoproject.com/","order":60,"img_src":"public/img/dj.svg"},{"id":9,"name":"Maria DB","description":"","url":"https://mariadb.org/","order":70,"img_src":"public/img/mariadb.svg"},{"id":10,"name":"WordPress","description":"","url":"https://wordpress.com/","order":80,"img_src":"public/img/wp.svg"}])
</script>