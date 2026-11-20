<template>
<section class="componentes-section seccion" id="seccion-componentes">
  <div class="container-modern">

    <div class="section-header">
      <p class="section-eyebrow">Componentes</p>
      <h2 class="section-title">Nuestros <em>componentes</em></h2>
      <p class="section-subtitle">
        Componentes y servicios propios que reutilizamos en cada proyecto para entregar más rápido y con mayor calidad.
      </p>
    </div>

    <div class="demos-filters" role="tablist" aria-label="Filtrar por categoría">
      <button
        v-for="cat in categorias"
        :key="cat"
        type="button"
        class="demos-filter"
        :class="{ 'demos-filter--active': cat === filtro }"
        @click="filtro = cat"
      >{{ cat }}</button>
    </div>

    <div class="demos-grid">
      <div
        v-for="(demo, index) in demos_filtradas"
        :key="demo.slug"
        class="demo-card-wrapper"
        :style="{ animationDelay: `${Math.min(index, 8) * 0.06}s` }"
      >
        <SubSecComponente :data="demo" />
      </div>
    </div>

  </div>
</section>
</template>

<script setup>
import { ref, computed } from 'vue'
import SubSecComponente from './SubSecComponente.vue'

// Cada paquete tiene su JSON en src/data/demos/<slug>.json
const modulos = import.meta.glob('../data/demos/*.json', { eager: true, import: 'default' })

const TODAS = 'Todas'
const demos = Object.values(modulos).sort((a, b) =>
  a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre)
)

const categorias = [TODAS, ...new Set(demos.map(d => d.categoria))]
const filtro = ref(TODAS)

const demos_filtradas = computed(() =>
  filtro.value === TODAS ? demos : demos.filter(d => d.categoria === filtro.value)
)
</script>

<style scoped>
.demos-filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--sp-1);
  margin-bottom: var(--sp-5);
}

.demos-filter {
  padding: 0.45rem 1.1rem;
  border: 1px solid var(--border-light);
  border-radius: var(--r-pill);
  background: transparent;
  color: var(--text-gray);
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.demos-filter:hover {
  border-color: var(--border-green);
  color: var(--primary-green);
}

.demos-filter--active {
  border-color: var(--primary-green);
  background: rgba(0, 212, 170, 0.12);
  color: var(--primary-green);
}

.demos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--sp-4);
}

.demo-card-wrapper {
  animation: fadeInUp 0.6s ease-out both;
}

@media (max-width: 600px) {
  .demos-grid {
    grid-template-columns: 1fr;
    gap: var(--sp-3);
  }
}
</style>
