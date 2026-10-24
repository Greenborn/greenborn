<template>
  <article
    ref="card"
    class="service-card"
    @mousemove="handleMouseMove"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="card-inner" :style="cardStyle()">
      <span class="card-glow" aria-hidden="true"></span>

      <div class="service-icon">
        <img :src="data.img_src" :alt="data.name" class="icon-image" />
      </div>

      <h3 class="service-title">{{ data.name }}</h3>
      <p class="service-description">{{ data.description }}</p>

      <a
        v-if="data.link"
        :href="data.link"
        class="service-link"
        target="_blank"
        rel="noopener"
      >
        Ir a Cuenta Greenborn
        <span aria-hidden="true">→</span>
      </a>
      <a v-else href="#seccion-contacto" class="service-link">
        Saber más
        <span aria-hidden="true">→</span>
      </a>
    </div>
  </article>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

defineProps({ data: { type: Object, required: true } })

const card = ref(null)
const mouseX = ref(0)
const mouseY = ref(0)
let leaveTimer = null

function handleMouseMove(e) {
  if (!card.value) return
  if (window.matchMedia('(hover: none)').matches) return

  const rect = card.value.getBoundingClientRect()
  mouseX.value = (e.clientX - rect.left - rect.width / 2) / rect.width
  mouseY.value = (e.clientY - rect.top - rect.height / 2) / rect.height
}

function handleMouseEnter() {
  clearTimeout(leaveTimer)
}

function handleMouseLeave() {
  leaveTimer = setTimeout(() => {
    mouseX.value = 0
    mouseY.value = 0
  }, 250)
}

function cardStyle() {
  return {
    transform: `rotateY(${mouseX.value * 5}deg) rotateX(${-mouseY.value * 5}deg)`,
  }
}

onUnmounted(() => clearTimeout(leaveTimer))
</script>

<style scoped>
.service-card {
  height: 100%;
  perspective: 900px;
}

.card-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 22rem;
  padding: 2rem;
  overflow: hidden;
  border: 1px solid var(--border-light);
  border-radius: var(--r-lg);
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.015) 100%);
  box-shadow: var(--shadow-card);
  transform-style: preserve-3d;
  transition:
    transform var(--transition-medium),
    border-color var(--transition-medium),
    box-shadow var(--transition-medium);
}

.card-glow {
  position: absolute;
  top: -55%;
  right: -30%;
  width: 16rem;
  height: 16rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 212, 170, 0.16) 0%, transparent 70%);
  opacity: 0;
  transition: opacity var(--transition-medium);
  pointer-events: none;
}

.service-card:hover .card-inner {
  border-color: var(--border-green);
  box-shadow: var(--shadow-hover), var(--ring-green);
}

.service-card:hover .card-glow {
  opacity: 1;
}

.service-icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: var(--sp-4);
  border: 1px solid var(--border-green);
  border-radius: var(--r-md);
  background: linear-gradient(135deg, rgba(0, 212, 170, 0.18) 0%, rgba(0, 184, 148, 0.06) 100%);
  transition: transform var(--transition-medium), border-color var(--transition-medium);
}

.service-card:hover .service-icon {
  transform: translateZ(20px) scale(1.05);
  border-color: var(--primary-green);
}

.icon-image {
  width: 30px;
  height: 30px;
  filter: brightness(0) invert(1);
  opacity: 0.85;
}

.service-title {
  margin-bottom: var(--sp-2);
  color: var(--text-light);
  font-size: var(--fs-h3);
  font-weight: 700;
  line-height: 1.25;
}

.service-description {
  flex: 1;
  margin-bottom: var(--sp-5);
  color: var(--text-gray);
  font-size: var(--fs-sm);
  line-height: 1.65;
}

.service-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  align-self: flex-start;
  color: var(--primary-green);
  font-size: var(--fs-xs);
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: gap var(--transition-fast), color var(--transition-fast);
}

.service-link:hover {
  gap: 0.75rem;
  color: var(--accent-green);
}

@media (max-width: 768px) {
  .card-inner {
    min-height: 0;
    padding: 1.6rem;
  }
}
</style>
