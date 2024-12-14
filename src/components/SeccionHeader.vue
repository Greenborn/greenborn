<template>
<div class="row h-100vh bg-back-0" id="seccion-inicio">
  <!--<EfectoMatrix />-->
  <div class="bg-green2">
    <div class="col">
      <div class="row h-100vh justify-content-center align-items-center">

        <div class="col-auto text-center">
          <div class="w-100">
            <div class="text-gb"><TextEffect text="GREENBORN" /></div>
            <div class="text-h-2">Software en Crecimiento</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import TextEffect from './genericos/TextEffect.vue'
</script>

<style>
.text-gb{
  font-family: "BebasNeue";
  font-size: 15rem;
  line-height: 7.5rem;
  padding-top: 4rem;
}
.text-h-2{
  font-size: 5rem;
}

.bg-green2{
    background-color: #011d00;
    background: linear-gradient(180deg, rgba(1,29,0,0.5) 0%, rgba(1,29,0,1) 90%, rgba(1,29,0,1) 100%); 
    color: #fff;
    width: 100%;
    height: 100%;
    position: absolute;
}

.bg-back-0{
  background-color: #000;
}
</style>