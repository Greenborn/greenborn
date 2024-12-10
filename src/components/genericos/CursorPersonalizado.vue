<template>
<div class="inverter-cursor" :style="estilo"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const estilo = ref({ left: "555px", top: "570.033px" })

onMounted(()=>{
    document.addEventListener('mousemove', (e) => {
        estilo.value.left = (e.clientX - 15) + 'px'
        estilo.value.top = (e.clientY - 15) + 'px'
    })
})
</script>

<style scoped>
.inverter-cursor{
    position: fixed;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    mix-blend-mode: difference;
}
</style>