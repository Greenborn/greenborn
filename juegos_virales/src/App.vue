<script setup>
import { ref } from 'vue'

const mensaje = ref('Zona experimental: próximamente juegos virales.')
</script>

<template>
  <main class="contenedor">
    <h1>Juegos Virales</h1>
    <p>{{ mensaje }}</p>
  </main>
</template>

<style scoped>
.contenedor {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 16px;
}
</style>
