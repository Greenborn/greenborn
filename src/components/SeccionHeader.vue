<template>
<header class="header-modern" id="seccion-inicio">
  <EfectoMatrix />

  <!-- Velo sobre el canvas: garantiza contraste del texto sin tener que
       ponerle una caja oscura a cada elemento -->
  <div class="header-scrim" aria-hidden="true"></div>
  <div class="header-glow" aria-hidden="true"></div>

  <div class="header-content">
    <div class="container-modern">
      <div class="header-grid">

        <!-- Contenido principal -->
        <div class="header-main">
          <div class="brand-section">
            <p class="header-eyebrow">
              <span class="eyebrow-dot"></span>
              Software libre · Tandil, Argentina
            </p>

            <div class="logo-container">
              <h1 class="logo-text">
                <span class="brand-title">GREENBORN</span>
              </h1>
              <p class="logo-subtitle">Software en Crecimiento</p>
            </div>

            <p class="tagline-text">
              Desarrollamos soluciones de software libre que transforman
              ideas en realidad digital.
            </p>

            <div class="cta-section">
              <a href="#seccion-servicios" class="btn-modern btn-lg">
                Nuestros Servicios
              </a>
              <a href="#seccion-contacto" class="btn-modern btn-ghost btn-lg">
                Conversemos
              </a>
<!-- Botón "Ver Portfolio" oculto temporalmente (sección Portfolio comentada en App.vue)
              <a href="#seccion-portfolio" class="btn-modern btn-ghost btn-lg">
                Ver Portfolio
              </a>
-->
            </div>
          </div>
        </div>

        <!-- Elementos visuales -->
        <div class="header-visual" aria-hidden="true">
          <div class="floating-elements">
            <div
              v-for="(item, index) in highlights"
              :key="item.label"
              class="floating-card"
              :style="{ animationDelay: `${index * 0.9}s` }"
            >
              <span class="card-icon"><i :class="item.icon"></i></span>
              <span class="card-text">{{ item.label }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- Indicador de scroll -->
  <a href="#seccion-servicios" class="scroll-indicator" aria-label="Ir a servicios">
    <span class="scroll-mouse"><span class="scroll-wheel"></span></span>
    <span class="scroll-label">Scroll</span>
  </a>
</header>
</template>

<script setup>
import { ref } from 'vue'
import EfectoMatrix from './genericos/EfectoMatrix.vue'

const highlights = ref([
  { icon: 'fas fa-rocket', label: 'Desarrollo Ágil' },
  { icon: 'fas fa-code-branch', label: 'Software Libre' },
  { icon: 'fas fa-sliders-h', label: 'Soluciones a Medida' },
])
</script>

<style scoped>
.header-modern {
  min-height: 100svh;
  position: relative;
  display: flex;
  align-items: center;
  background: var(--surface-0);
  overflow: hidden;
  width: 100%;
}

/* Capas de fondo sobre el canvas del efecto matrix */
.header-scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(180deg, rgba(7, 9, 10, 0.58) 0%, rgba(7, 9, 10, 0.26) 45%, var(--surface-0) 100%),
    radial-gradient(ellipse 70% 60% at 22% 45%, rgba(7, 9, 10, 0.82) 0%, rgba(7, 9, 10, 0.35) 55%, transparent 75%);
  pointer-events: none;
}

.header-glow {
  position: absolute;
  top: -10%;
  right: -5%;
  width: 60vw;
  height: 60vw;
  max-width: 820px;
  max-height: 820px;
  z-index: 1;
  background: radial-gradient(circle,
    rgba(0, 212, 170, 0.13) 0%,
    rgba(0, 212, 170, 0.04) 40%,
    transparent 70%);
  pointer-events: none;
}

.header-content {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 7rem 0 6rem;
}

.header-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: var(--sp-7);
  align-items: center;
}

.brand-section {
  max-width: 36rem;
}

/* Etiqueta superior */
.header-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: var(--sp-4);
  padding: 0.4rem 0.95rem;
  border: 1px solid var(--border-green);
  border-radius: var(--r-pill);
  background: rgba(0, 212, 170, 0.07);
  color: var(--primary-green);
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  animation: fadeInUp 0.8s ease-out both;
}

.eyebrow-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary-green);
  box-shadow: 0 0 10px var(--primary-green);
  animation: pulse 2.4s ease-in-out infinite;
}

.logo-container {
  margin-bottom: var(--sp-4);
}

.logo-text {
  margin: 0;
  line-height: 1;
}

.brand-title {
  display: inline-block;
  font-family: var(--font-display);
  font-size: var(--fs-display);
  font-weight: 400;
  line-height: 0.9;
  letter-spacing: 0.01em;
  background: linear-gradient(120deg,
    var(--primary-green) 0%,
    var(--accent-green) 55%,
    var(--primary-green-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  /* Un solo halo, suave: antes se apilaban tres sombras + drop-shadow */
  filter: drop-shadow(0 6px 28px rgba(0, 212, 170, 0.28));
  animation: brandTitleAnimation 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes brandTitleAnimation {
  from {
    opacity: 0;
    transform: translateY(24px);
    filter: blur(8px) drop-shadow(0 6px 28px rgba(0, 212, 170, 0.28));
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0) drop-shadow(0 6px 28px rgba(0, 212, 170, 0.28));
  }
}

.logo-subtitle {
  margin-top: 0.35rem;
  color: var(--text-light);
  font-size: clamp(1rem, 1.8vw, 1.35rem);
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  animation: fadeInUp 0.9s ease-out 0.25s both;
}

.tagline-text {
  margin-bottom: var(--sp-6);
  max-width: 30rem;
  color: var(--text-body);
  font-size: var(--fs-lead);
  line-height: 1.65;
  animation: fadeInUp 0.9s ease-out 0.4s both;
}

.cta-section {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  animation: fadeInUp 0.9s ease-out 0.55s both;
}

/* --- Columna visual: tarjetas escalonadas --- */
.header-visual {
  display: flex;
  justify-content: center;
}

.floating-elements {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  width: min(100%, 22rem);
}

.floating-card {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 1.1rem 1.3rem;
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.025) 100%);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-card);
  transition: transform var(--transition-medium),
              border-color var(--transition-medium),
              box-shadow var(--transition-medium);
  animation: floatCard 7s ease-in-out infinite;
}

/* Escalonado horizontal: da profundidad sin posicionamiento absoluto */
.floating-card:nth-child(1) { margin-right: 2.5rem; }
.floating-card:nth-child(2) { margin-left: 2.5rem; }
.floating-card:nth-child(3) { margin-right: 1.25rem; }

.floating-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-green);
  box-shadow: var(--shadow-hover), var(--ring-green);
}

.card-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: var(--r-sm);
  background: linear-gradient(135deg, rgba(0, 212, 170, 0.22) 0%, rgba(0, 184, 148, 0.1) 100%);
  border: 1px solid var(--border-green);
  color: var(--primary-green);
  font-size: 1.1rem;
}

.card-text {
  color: var(--text-light);
  font-size: var(--fs-sm);
  font-weight: 600;
  line-height: 1.3;
}

@keyframes floatCard {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

/* --- Indicador de scroll --- */
.scroll-indicator {
  position: absolute;
  bottom: 1.75rem;
  left: 50%;
  translate: -50% 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-faint);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.scroll-indicator:hover {
  color: var(--primary-green);
}

.scroll-mouse {
  display: flex;
  justify-content: center;
  width: 22px;
  height: 34px;
  padding-top: 6px;
  border: 1px solid currentColor;
  border-radius: var(--r-pill);
}

.scroll-wheel {
  width: 3px;
  height: 7px;
  border-radius: var(--r-pill);
  background: var(--primary-green);
  animation: scrollWheel 1.8s ease-in-out infinite;
}

.scroll-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

@keyframes scrollWheel {
  0% { opacity: 0; transform: translateY(-4px); }
  40% { opacity: 1; }
  100% { opacity: 0; transform: translateY(10px); }
}

/* --- Responsive --- */
@media (max-width: 1024px) {
  .header-grid {
    grid-template-columns: 1fr;
    gap: var(--sp-6);
    text-align: center;
  }

  .brand-section {
    max-width: none;
    margin: 0 auto;
  }

  .tagline-text {
    margin-left: auto;
    margin-right: auto;
  }

  .cta-section {
    justify-content: center;
  }

  .floating-elements {
    flex-direction: row;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .floating-card {
    flex-direction: column;
    text-align: center;
    gap: var(--sp-2);
    flex: 1 1 8rem;
    max-width: 11rem;
    margin: 0 !important;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 6rem 0 5rem;
  }

  .logo-subtitle {
    letter-spacing: 0.16em;
  }

  .cta-section .btn-modern {
    flex: 1 1 12rem;
  }
}

@media (max-width: 480px) {
  .floating-card {
    padding: 0.9rem;
    flex: 1 1 6rem;
  }

  .card-icon {
    width: 38px;
    height: 38px;
    font-size: 1rem;
  }

  .card-text {
    font-size: var(--fs-xs);
  }

  .scroll-indicator {
    display: none;
  }
}
</style>
