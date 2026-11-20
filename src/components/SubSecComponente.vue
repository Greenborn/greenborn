<template>
  <article class="demo-card">
    <span class="demo-badge">{{ data.categoria }}</span>
    <h3 class="demo-name">{{ data.nombre }}</h3>
    <p class="demo-summary">{{ data.resumen }}</p>

    <div class="demo-footer">
      <span class="demo-version">v{{ data.version }}</span>
      <button type="button" class="demo-more" @click="abierto = true">
        Ver detalle <span aria-hidden="true">→</span>
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="abierto"
        class="demo-modal-overlay"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`demo-title-${data.slug}`"
        @click.self="cerrar"
      >
        <div class="demo-modal">
          <button type="button" class="demo-modal-close" aria-label="Cerrar" @click="cerrar">×</button>

          <span class="demo-badge">{{ data.categoria }}</span>
          <h3 :id="`demo-title-${data.slug}`" class="demo-modal-title">{{ data.nombre }}</h3>
          <p class="demo-modal-pkg">{{ data.paquete }} · v{{ data.version }}</p>

          <p class="demo-modal-text">{{ data.detalle?.descripcion }}</p>

          <template v-if="data.detalle?.caracteristicas?.length">
            <h4 class="demo-modal-sub">Características</h4>
            <ul class="demo-list">
              <li v-for="c in data.detalle.caracteristicas" :key="c">{{ c }}</li>
            </ul>
          </template>

          <template v-if="data.detalle?.casos_uso?.length">
            <h4 class="demo-modal-sub">Casos de uso</h4>
            <ul class="demo-list">
              <li v-for="c in data.detalle.casos_uso" :key="c">{{ c }}</li>
            </ul>
          </template>

          <div v-if="data.detalle?.tecnologias?.length" class="demo-tags">
            <span v-for="t in data.detalle.tecnologias" :key="t" class="demo-tag">{{ t }}</span>
          </div>
        </div>
      </div>
    </Teleport>
  </article>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'

defineProps({ data: { type: Object, required: true } })

const abierto = ref(false)

function cerrar() {
  abierto.value = false
}

function onKey(e) {
  if (e.key === 'Escape') cerrar()
}

watch(abierto, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
  if (v) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  if (abierto.value) document.body.style.overflow = ''
})
</script>

<style scoped>
.demo-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem;
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  background: linear-gradient(160deg, var(--surface-raised-strong) 0%, var(--surface-raised) 100%);
  box-shadow: var(--shadow-card);
  transition:
    transform var(--transition-medium),
    border-color var(--transition-medium),
    box-shadow var(--transition-medium);
}

.demo-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-green);
  box-shadow: var(--shadow-hover), var(--ring-green);
}

.demo-badge {
  align-self: flex-start;
  margin-bottom: var(--sp-2);
  padding: 0.2rem 0.7rem;
  border: 1px solid var(--border-green);
  border-radius: var(--r-pill);
  background: rgba(0, 212, 170, 0.08);
  color: var(--primary-green);
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.demo-name {
  margin-bottom: var(--sp-2);
  color: var(--text-light);
  font-size: var(--fs-h3);
  font-weight: 700;
  line-height: 1.2;
}

.demo-summary {
  flex: 1;
  color: var(--text-gray);
  font-size: var(--fs-sm);
  line-height: 1.65;
}

.demo-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--sp-4);
  padding-top: var(--sp-3);
  border-top: 1px solid var(--border-light);
}

.demo-version {
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}

.demo-more {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--primary-green);
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: gap var(--transition-fast), color var(--transition-fast);
}

.demo-more:hover {
  gap: 0.6rem;
  color: var(--accent-green);
}

/* Modal (teleportado a body: los estilos scoped siguen aplicando por el data-v) */
.demo-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
}

.demo-modal {
  position: relative;
  width: min(640px, 100%);
  max-height: 88vh;
  overflow-y: auto;
  padding: 2rem;
  border: 1px solid var(--border-green);
  border-radius: var(--r-lg);
  background: var(--surface-2);
  box-shadow: var(--shadow-hover);
}

.demo-modal-close {
  position: absolute;
  top: 0.75rem;
  right: 1rem;
  border: none;
  background: none;
  color: var(--text-gray);
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.demo-modal-close:hover {
  color: var(--primary-green);
}

.demo-modal-title {
  color: var(--text-light);
  font-size: var(--fs-h3);
  font-weight: 700;
}

.demo-modal-pkg {
  margin: 0.2rem 0 var(--sp-3);
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  word-break: break-all;
}

.demo-modal-text {
  color: var(--text-body);
  font-size: var(--fs-sm);
  line-height: 1.7;
}

.demo-modal-sub {
  margin: var(--sp-4) 0 var(--sp-1);
  color: var(--primary-green);
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.demo-list {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--text-body);
  font-size: var(--fs-sm);
  line-height: 1.7;
}

.demo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: var(--sp-4);
}

.demo-tag {
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--border-light);
  border-radius: var(--r-pill);
  color: var(--text-gray);
  font-size: var(--fs-xs);
}

@media (max-width: 600px) {
  .demo-modal {
    padding: 1.5rem 1.25rem;
  }
}
</style>
