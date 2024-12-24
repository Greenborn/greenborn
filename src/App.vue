<template>
<SeccionHeader />
<SeccionNosotros />
<SeccionServicios />
<MetodologiaTrabajo />
<SeccionPortfolio />
<SeccionTecnologias />
<SeccionFooter />
<CustomCursor :config='{ highlighted_tags: [ "a", "button", ".text-res-1", ".circ-met", ".text-effect", ".menu-item" ], 
                            transform_time: ".2s", click_effect_enabled: false }' />
<MenuLateralFlotante />
</template>

<script setup>
import { ref } from 'vue'

import SeccionHeader from './components/SeccionHeader.vue'
import SeccionTecnologias from './components/SeccionTecnologias.vue'
import SeccionPortfolio from './components/SeccionPortfolio.vue'
import SeccionContacto from './components/SeccionContacto.vue'
import SeccionFooter from './components/SeccionFooter.vue'
import SeccionServicios from './components/SeccionServicios.vue'
import MetodologiaTrabajo from './components/MetodologiaTrabajo.vue'
import SeccionNosotros from './components/SeccionNosotros.vue'
import MenuLateralFlotante from './components/genericos/MenuLateralFlotante.vue'
</script>

