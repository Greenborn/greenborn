<template>
<div class="row h-100vh bg-back-0" id="seccion-inicio">
  <EfectoMatrix />
  <div class="bg-green2">
    <div class="col">
      <div class="row h-100vh justify-content-center align-items-center">

        <div class="col-auto text-center">
          <div class="w-100">
            <div class="text-gb"><TextEffect text="GREENBORN" /></div>
            <div class="text-h-2 mt-2">Software en Crecimiento</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import EfectoMatrix from './genericos/EfectoMatrix.vue'
import TextEffect from './genericos/TextEffect.vue'
</script>

<style>
.text-gb{
  font-family: "BebasNeue";  
}

.bg-green2{
    background-color: #011d00;
    background: linear-gradient(180deg, rgba(1,29,0,0.8) 0%, rgba(1,29,0,1) 90%, rgba(1,29,0,1) 100%); 
    color: #fff;
    width: 100%;
    height: 100%;
    position: absolute;
}

.bg-back-0{
  background-color: #000;
}

@media (max-width: 500px) {
  .text-gb{
    font-size: 20dvw;
    line-height: 15dvw;
    padding-top: 1dvw;
  }

  .text-h-2{
    font-size: 6dvw;
  }
}

@media (max-width: 900px) {
  .text-gb{
    font-size: 10dvw;
    line-height: 7dvw;
    padding-top: 1dvw;
  }

  .text-h-2{
    font-size: 3dvw;
  }
}

@media (max-width: 1360px) {
  .text-gb{
    font-size: 8dvw;
    line-height: 6dvw;
    padding-top: 1dvw;
  }

  .text-h-2{
    font-size: 2.5dvw;
  }
}

@media (min-width: 1360px) {
  .text-gb{
    font-size: 7dvw;
    line-height: 5dvw;
    padding-top: 1dvw;
  }

  .text-h-2{
    font-size: 2.25dvw;
  }
}
</style>