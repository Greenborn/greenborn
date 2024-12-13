<template>
<SeccionHeader />
<SeccionServicios />
<SeccionTecnologias />
<SeccionPortfolio />
<SeccionContacto />
<SeccionFooter />
<CustomCursor :config='{ highlighted_tags: [ "a", "button" ], transform_time: ".1s" }' />
</template>

<script setup>
import { ref } from 'vue'

import SeccionHeader from './components/SeccionHeader.vue'
import SeccionTecnologias from './components/SeccionTecnologias.vue'
import SeccionPortfolio from './components/SeccionPortfolio.vue'
import SeccionContacto from './components/SeccionContacto.vue'
import SeccionFooter from './components/SeccionFooter.vue'
import SeccionServicios from './components/SeccionServicios.vue'
</script>

