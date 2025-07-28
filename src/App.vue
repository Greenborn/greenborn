<template>
<SeccionHeader />
<SeccionServicios />
<MetodologiaTrabajo />
<SeccionPortfolio />
<SeccionTecnologias />
<SeccionContacto />
<SeccionFooter />
<CustomCursor :config='{ highlighted_tags: [ "a", "button", ".text-res-1", ".circ-met", ".text-effect", ".menu-item" ], 
                            transform_time: ".2s", click_effect_enabled: false }' />
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
  {
    text: "Testing",
    phone: "542494067516"
  },
])

import SeccionHeader from './components/SeccionHeader.vue'
import SeccionTecnologias from './components/SeccionTecnologias.vue'
import SeccionPortfolio from './components/SeccionPortfolio.vue'
import SeccionContacto from './components/SeccionContacto.vue'
import SeccionFooter from './components/SeccionFooter.vue'
import SeccionServicios from './components/SeccionServicios.vue'
import MetodologiaTrabajo from './components/MetodologiaTrabajo.vue'
import MenuLateralFlotante from './components/genericos/MenuLateralFlotante.vue'
</script>

