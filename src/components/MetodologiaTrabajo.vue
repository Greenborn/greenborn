<template>
  <div class="methodology-section seccion" id="seccion-metodologia">
    <div class="container-modern">
      
      <!-- Header de la sección -->
      <div class="section-header">
        <h2 class="section-title">Nuestra Metodología</h2>
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
              <div class="step-icon">
                <i :class="step.icon"></i>
              </div>
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-description">{{ step.description }}</p>
            </div>
          </div>
          
        </div>
      </div>

      <!-- CTA de metodología -->
      <div class="methodology-cta">
        <div class="cta-content">
          <h3>¿Listo para comenzar?</h3>
          <p>Agenda una consulta gratuita y descubre cómo podemos transformar tu idea en realidad</p>
          <a href="#seccion-contacto" class="btn-modern">
            Agendar Consulta
          </a>
        </div>
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
.methodology-section {
  background: var(--bg-gradient-dark);
  position: relative;
}

.methodology-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--primary-green) 50%, transparent 100%);
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
  animation: fadeInUp 0.8s ease-out;
}

.section-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--accent-green) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: clamp(1.1rem, 2vw, 1.3rem);
  color: var(--text-gray);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.methodology-timeline {
  position: relative;
  max-width: 1000px;
  margin: 0 auto 4rem;
}

.methodology-timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, var(--primary-green) 0%, transparent 50%, var(--primary-green) 100%);
  transform: translateX(-50%);
}

.timeline-step {
  position: relative;
  margin-bottom: 4rem;
  animation: fadeInUp 0.8s ease-out both;
}

.step-number {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  z-index: 10;
}

.number-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--secondary-green) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 212, 170, 0.3);
  transition: var(--transition-medium);
}

.timeline-step:hover .number-circle {
  transform: scale(1.1);
  box-shadow: 0 8px 30px rgba(0, 212, 170, 0.4);
}

.number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-light);
}

.step-content {
  width: 45%;
  margin-top: 2rem;
}

.step-right .step-content {
  margin-left: auto;
}

.step-card {
  background: var(--bg-gradient-card);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 2rem;
  transition: var(--transition-medium);
  position: relative;
}

.step-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-green-light);
}

.step-icon {
  text-align: center;
  margin-bottom: 1rem;
}

.step-icon i {
  font-size: 2rem;
  color: var(--primary-green);
}

.step-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 1rem;
  text-align: center;
}

.step-description {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-gray);
  text-align: center;
}

.methodology-cta {
  text-align: center;
  padding: 3rem;
  background: var(--bg-gradient-card);
  border-radius: 20px;
  border: 1px solid var(--border-light);
  margin-top: 2rem;
  animation: fadeInUp 0.8s ease-out 0.5s both;
}

.cta-content h3 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  margin-bottom: 1rem;
  color: var(--text-light);
}

.cta-content p {
  font-size: 1.1rem;
  color: var(--text-gray);
  margin-bottom: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

/* Responsive */
@media (max-width: 768px) {
  .methodology-timeline::before {
    left: 30px;
  }
  
  .step-number {
    left: 30px;
    transform: none;
  }
  
  .step-content {
    width: calc(100% - 80px);
    margin-left: 80px;
  }
  
  .step-right .step-content {
    margin-left: 80px;
  }
  
  .methodology-cta {
    padding: 2rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .step-card {
    padding: 1.5rem;
  }
  
  .step-title {
    font-size: 1.3rem;
  }
  
  .step-description {
    font-size: 0.9rem;
  }
  
  .methodology-cta {
    padding: 1.5rem 1rem;
  }
}
</style>