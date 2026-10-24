<template>
  <div class="methodology-section seccion" id="seccion-metodologia">
    <div class="container-modern">
      
      <!-- Header de la sección -->
      <div class="section-header">
        <p class="section-eyebrow">Metodología</p>
        <h2 class="section-title">Cómo <em>trabajamos</em></h2>
        <p class="section-subtitle">
          Un proceso ágil y transparente para llevar tu proyecto del concepto a la realidad
        </p>
      </div>

      <!-- Timeline de metodología -->
      <div class="methodology-timeline">
        <div 
          v-for="(step, index) in methodologySteps" 
          :key="step.id"
          class="timeline-step"
          :class="{ 'step-right': index % 2 === 1 }"
          :style="{ animationDelay: `${index * 0.2}s` }"
        >
          
          <!-- Número del paso -->
          <div class="step-number">
            <div class="number-circle">
              <span class="number">{{ step.number }}</span>
            </div>
          </div>
          
          <!-- Contenido del paso -->
          <div class="step-content">
            <div class="step-card">
              <div class="step-head">
                <div class="step-icon">
                  <i :class="step.icon"></i>
                </div>
                <h3 class="step-title">{{ step.title }}</h3>
              </div>
              <p class="step-description">{{ step.description }}</p>
            </div>
          </div>
          
        </div>
      </div>

      <!-- CTA de metodología -->
      <div class="cta-panel">
        <h3>¿Listo para comenzar?</h3>
        <p>Agendá una consulta gratuita y descubrí cómo podemos transformar tu idea en realidad.</p>
        <a href="#seccion-contacto" class="btn-modern">
          Agendar consulta
        </a>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const methodologySteps = ref([
  {
    id: 1,
    number: 1,
    title: "Entrevista Inicial",
    description: "Nos entrevistamos contigo para clarificar las necesidades, relevar requerimientos y dimensionar el alcance del proyecto.",
    icon: "fas fa-comments"
  },
  {
    id: 2,
    number: 2,
    title: "Propuesta",
    description: "A partir del relevamiento de la entrevista, creamos una propuesta de desarrollo indicando las tecnologías a utilizar, diseño y arquitectura.",
    icon: "fas fa-file-alt"
  },
  {
    id: 3,
    number: 3,
    title: "Preparación",
    description: "Montamos un sitio de pruebas actualizado periódicamente donde podrás constatar el avance y realizar correcciones. Definimos el Producto Mínimo Viable.",
    icon: "fas fa-cogs"
  },
  {
    id: 4,
    number: 4,
    title: "Desarrollo",
    description: "Damos inicio al proceso de implementación manteniendo actualizado el sitio de pruebas y en contacto constante durante todo el proceso.",
    icon: "fas fa-code"
  },
  {
    id: 5,
    number: 5,
    title: "Testing",
    description: "Realizamos pruebas exhaustivas del sistema para garantizar su funcionamiento correcto, rendimiento óptimo y experiencia de usuario satisfactoria.",
    icon: "fas fa-vial"
  },
  {
    id: 6,
    number: 6,
    title: "Implementación",
    description: "Con cada objetivo completado y validado, realizamos la instalación del sistema en su ubicación definitiva.",
    icon: "fas fa-rocket"
  },
  {
    id: 7,
    number: 7,
    title: "Soporte",
    description: "Brindamos soporte post-venta para dudas sobre el uso, nuevas funcionalidades o corrección de bugs.",
    icon: "fas fa-headset"
  }
])
</script>

<style scoped>
.methodology-timeline {
  position: relative;
  max-width: 960px;
  margin: 0 auto var(--sp-7);
}

.methodology-timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(180deg,
    transparent 0%,
    var(--border-green) 12%,
    var(--border-green) 88%,
    transparent 100%);
  transform: translateX(-50%);
}

.timeline-step {
  position: relative;
  margin-bottom: var(--sp-6);
  animation: fadeInUp 0.8s ease-out both;
}

.timeline-step:last-child {
  margin-bottom: 0;
}

.step-number {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  z-index: 2;
}

.number-circle {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border: 1px solid var(--border-green);
  border-radius: 50%;
  background: var(--surface-1);
  box-shadow: var(--glow-green);
  transition: transform var(--transition-medium), border-color var(--transition-medium);
}

.timeline-step:hover .number-circle {
  transform: scale(1.08);
  border-color: var(--primary-green);
}

.number {
  font-family: var(--font-display);
  font-size: 1.6rem;
  line-height: 1;
  color: var(--primary-green);
}

.step-content {
  width: 44%;
  padding-top: 0.5rem;
}

.step-right .step-content {
  margin-left: auto;
}

.step-card {
  height: 100%;
  padding: 1.6rem 1.75rem;
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  background: linear-gradient(160deg, var(--surface-raised-strong) 0%, var(--surface-raised) 100%);
  box-shadow: var(--shadow-card);
  transition:
    transform var(--transition-medium),
    border-color var(--transition-medium),
    box-shadow var(--transition-medium);
}

.step-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-green);
  box-shadow: var(--shadow-hover), var(--ring-green);
}

.step-head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}

.step-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-green);
  border-radius: var(--r-sm);
  background: rgba(0, 212, 170, 0.1);
  color: var(--primary-green);
  font-size: 1rem;
}

.step-title {
  color: var(--text-light);
  font-size: var(--fs-h3);
  font-weight: 700;
  line-height: 1.25;
}

.step-description {
  color: var(--text-gray);
  font-size: var(--fs-sm);
  line-height: 1.65;
}

@media (max-width: 768px) {
  .methodology-timeline::before {
    left: 26px;
  }

  .step-number {
    left: 26px;
    transform: translateX(-50%);
  }

  .number-circle {
    width: 46px;
    height: 46px;
  }

  .number {
    font-size: 1.35rem;
  }

  .step-content,
  .step-right .step-content {
    width: calc(100% - 68px);
    margin-left: 68px;
    padding-top: 0;
  }

  .timeline-step {
    margin-bottom: var(--sp-4);
  }
}

@media (max-width: 480px) {
  .step-card {
    padding: 1.25rem;
  }

  .step-head {
    align-items: flex-start;
  }
}
</style>
