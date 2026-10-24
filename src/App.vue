<template>
<a class="skip-link" href="#seccion-servicios">Saltar al contenido</a>
<SeccionHeader />
<SeccionServicios />
<MetodologiaTrabajo />
<!--
  SECCIÓN PORTFOLIO OCULTA (temporalmente)
  Se comentó el componente para que no se muestre en la página. El archivo
  components/SeccionPortfolio.vue NO fue eliminado.
  Para volver a mostrarla: descomentar esta línea, el import de abajo,
  y la entrada "Portfolio" en components/genericos/MenuLateralFlotante.vue
  y el botón "Ver Portfolio" en components/SeccionHeader.vue.
  <SeccionPortfolio />
-->
<SeccionTecnologias />
<SeccionContacto />
<SeccionFooter />
<!--<CustomCursor :config='{ highlighted_tags: [ "a", "button", ".text-res-1", ".circ-met", ".text-effect", ".menu-item" ], 
                            transform_time: ".2s", click_effect_enabled: false }' />-->
<MenuLateralFlotante />
<WhatsAppWidget phone="542494279833" :quick_replies="quick_replies" />
</template>

<script setup>
import { ref } from 'vue'

const quick_replies = ref([
  {
    text: "Desarrollo de APP's",
    phone: "542494279833"
  },
])

import SeccionHeader from './components/SeccionHeader.vue'
import SeccionTecnologias from './components/SeccionTecnologias.vue'
// Oculto temporalmente (ver comentario en el template):
// import SeccionPortfolio from './components/SeccionPortfolio.vue'
import SeccionContacto from './components/SeccionContacto.vue'
import SeccionFooter from './components/SeccionFooter.vue'
import SeccionServicios from './components/SeccionServicios.vue'
import MetodologiaTrabajo from './components/MetodologiaTrabajo.vue'
import MenuLateralFlotante from './components/genericos/MenuLateralFlotante.vue'
</script>

