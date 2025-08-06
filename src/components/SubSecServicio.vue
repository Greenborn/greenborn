<template>
  <div class="service-card-modern"
      @mousemove="handleMouseMove"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      ref="card">
    
    <div class="card-content" :style="cardStyle()">
      <div class="card-background" :style="cardBgStyle()"></div>
      
      <div class="card-overlay">
        <div class="service-icon">
          <img :src="data.img_src" :alt="data.name" class="icon-image" />
        </div>
        
        <div class="service-info">
          <h3 class="service-title">{{ data.name }}</h3>
          <p class="service-description">{{ data.description }}</p>
        </div>
        
        <div class="service-cta">
          <a href="#seccion-contacto" class="learn-more">Saber más →</a>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps([ "data" ])

const width = ref(0)
const height = ref(0)
const mouseX = ref(0)
const mouseY = ref(0)
const mouseLeaveDelay = ref(null)
const card = ref()

onMounted(() => {
  width.value = 400
  height.value = 300
})

function mousePX() {
  return mouseX.value / width.value;
}

function mousePY() {
  return mouseY.value / height.value;
}

function cardBgStyle(){
  const tX = mousePX() * -10; // Reducido de -20 a -10
  const tY = mousePY() * -10; // Reducido de -20 a -10
  return {
    transform: `translateX(${tX}px) translateY(${tY}px) scale(1.05)`, // Reducido scale de 1.1 a 1.05
    backgroundImage: `url(${props.data.img_src})`
  }
}

function cardStyle() {
  const rX = mousePX() * 5; // Reducido de 10 a 5
  const rY = mousePY() * 5; // Reducido de 10 a 5
  return {
    transform: `rotateY(${rX}deg) rotateX(${rY}deg)`,
  };
}

function handleMouseMove(e) {
  mouseX.value = e.pageX - card.value.offsetLeft - width.value/2;
  mouseY.value = e.pageY - card.value.offsetTop - height.value/2;
}

function handleMouseEnter() {
  clearTimeout(mouseLeaveDelay.value);
}

function handleMouseLeave() {
  mouseLeaveDelay.value = setTimeout(()=>{
    mouseX.value = 0;
    mouseY.value = 0;
  }, 300);
}
</script>

<style scoped>
.service-card-modern {
  position: relative;
  height: 400px;
  perspective: 1000px;
  cursor: pointer;
}

.card-content {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.4s ease-out; /* Cambiado de 0.6s cubic-bezier a 0.4s ease-out */
  border-radius: 20px;
  overflow: hidden;
}

.card-background {
  position: absolute;
  top: -20px;
  left: -20px;
  width: calc(100% + 40px);
  height: calc(100% + 40px);
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  opacity: 0.1;
  transition: all 0.4s ease-out; /* Cambiado de 0.6s cubic-bezier a 0.4s ease-out */
  filter: blur(2px);
}

.card-overlay {
  position: relative;
  z-index: 2;
  height: 100%;
  background: linear-gradient(135deg, 
    rgba(0, 212, 170, 0.1) 0%, 
    rgba(0, 184, 148, 0.05) 50%, 
    rgba(0, 0, 0, 0.8) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 170, 0.2);
  border-radius: 20px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.4s ease-out; /* Cambiado de 0.6s cubic-bezier a 0.4s ease-out */
}

.service-icon {
  text-align: center;
  margin-bottom: 1.5rem;
}

.icon-image {
  width: 60px;
  height: 60px;
  filter: brightness(0) invert(1);
  opacity: 0.8;
  transition: all 0.4s ease;
}

.service-info {
  flex: 1;
}

.service-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 1rem;
  line-height: 1.3;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.service-description {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-gray);
  margin-bottom: 1.5rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.service-cta {
  text-align: center;
}

.learn-more {
  color: var(--primary-green);
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

/* Hover effects */
.service-card-modern:hover .card-content {
  transform: translateY(-5px); /* Reducido de -10px a -5px */
  box-shadow: 
    0 10px 20px rgba(0, 212, 170, 0.15), /* Reducida intensidad */
    0 0 0 1px rgba(0, 212, 170, 0.2); /* Reducida intensidad */
}

.service-card-modern:hover .card-background {
  opacity: 0.15; /* Reducido de 0.2 a 0.15 */
  transform: scale(1.02); /* Reducido de 1.05 a 1.02 */
}

.service-card-modern:hover .card-overlay {
  background: linear-gradient(135deg, 
    rgba(0, 212, 170, 0.12) 0%, /* Reducido de 0.15 a 0.12 */
    rgba(0, 184, 148, 0.08) 50%, /* Reducido de 0.1 a 0.08 */
    rgba(0, 0, 0, 0.75) 100%); /* Aumentado de 0.7 a 0.75 */
  border-color: var(--primary-green-light); /* Cambiado a verde claro */
}

.service-card-modern:hover .icon-image {
  transform: scale(1.05); /* Reducido de 1.1 a 1.05 */
  opacity: 0.9; /* Reducido de 1 a 0.9 */
  filter: brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(140deg); /* Reducido saturate de 5 a 3 */
}

.service-card-modern:hover .learn-more {
  color: var(--accent-green);
  transform: translateX(3px); /* Reducido de 5px a 3px */
}

/* Animación de entrada */
.service-card-modern {
  animation: fadeInUp 0.8s ease-out both;
}

/* Responsive */
@media (max-width: 768px) {
  .service-card-modern {
    height: 350px;
  }
  
  .card-overlay {
    padding: 1.5rem;
  }
  
  .service-title {
    font-size: 1.3rem;
  }
  
  .service-description {
    font-size: 0.9rem;
  }
  
  .icon-image {
    width: 50px;
    height: 50px;
  }
}

@media (max-width: 480px) {
  .service-card-modern {
    height: 320px;
  }
  
  .card-overlay {
    padding: 1.2rem;
  }
  
  .service-title {
    font-size: 1.2rem;
  }
  
  .service-description {
    font-size: 0.85rem;
  }
}
</style>