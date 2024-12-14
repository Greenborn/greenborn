<template>
<div class="row h-100vh" id="seccion-tecnologias">
  <div class="col  p-5 mt-5">

    <div class="row mt-5  justify-content-center alig-items-center">
      <div class="col-auto">
        <div class="row justify-content-center alig-items-center">

          
          <SubSecTecnologia v-for="r in listado_tecnologias_leng" :key="r" :data="r" />
        
        </div>
      </div>
        
    </div>

  </div>
</div>

</template>

<script setup>
import { ref } from 'vue'
import SubSecTecnologia from './SubSecTecnologia.vue';

const listado_tecnologias_leng = ref([{"id":1,"name":"PHP","description":"","url":"https://www.php.net/","order":0,"img_src":"public/img/php.svg"},{"id":2,"name":"HTML","description":"","url":"https://developer.mozilla.org/en-US/docs/Web/HTML","order":10,"img_src":"public/img/html.svg"},{"id":3,"name":"Bootstrap","description":"","url":"https://getbootstrap.com/","order":20,"img_src":"public/img/bootstrap.svg"},{"id":4,"name":"JavaScript","description":"","url":"https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/What_is_JavaScript","order":30,"img_src":"public/img/js.svg"},{"id":5,"name":"TypeScript","description":"","url":"https://www.typescriptlang.org/","order":40,"img_src":"public/img/ts.svg"},{"id":6,"name":"Python","description":"","url":"https://www.python.org/","order":50,"img_src":"public/img/py.svg"},{"id":7,"name":"Java","description":"","url":"https://www.java.com","order":50,"img_src":"public/img/java.svg"},{"id":8,"name":"Django","description":"","url":"https://www.djangoproject.com/","order":60,"img_src":"public/img/dj.svg"},{"id":9,"name":"Maria DB","description":"","url":"https://mariadb.org/","order":70,"img_src":"public/img/mariadb.svg"},{"id":10,"name":"WordPress","description":"","url":"https://wordpress.com/","order":80,"img_src":"public/img/wp.svg"}])
</script>

<style>
.img-tecno{
  width: 5rem;
  height: auto;
}
</style>