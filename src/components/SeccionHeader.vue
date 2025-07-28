<template>
<div class="header-modern" id="seccion-inicio">
  <EfectoMatrix />
  <div class="header-content">
    <div class="container-modern">
      <div class="header-grid">
        
        <!-- Contenido principal -->
        <div class="header-main">
          <div class="brand-section">
            <div class="logo-container">
              <div class="logo-text">
                <span class="brand-title">GREENBORN</span>
              </div>
              <div class="logo-subtitle">
                Software en Crecimiento
              </div>
            </div>
            
            <div class="tagline">
              <p class="tagline-text">
                Desarrollamos soluciones de software libre que transforman ideas en realidad digital
              </p>
            </div>
            
            <div class="cta-section">
              <a href="#seccion-servicios" class="btn-modern btn-primary">
                Nuestros Servicios
              </a>
              <a href="#seccion-portfolio" class="btn-modern btn-secondary">
                Ver Portfolio
              </a>
            </div>
          </div>
        </div>
        
        <!-- Elementos visuales -->
        <div class="header-visual">
          <div class="floating-elements">
            <div class="floating-card card-1">
              <div class="card-icon">🚀</div>
              <div class="card-text">Desarrollo Ágil</div>
            </div>
            <div class="floating-card card-2">
              <div class="card-icon">💻</div>
              <div class="card-text">Software Libre</div>
            </div>
            <div class="floating-card card-3">
              <div class="card-icon">🔧</div>
              <div class="card-text">Soluciones Personalizadas</div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  </div>
  
  <!-- Scroll indicator -->
  <div class="scroll-indicator">
    <div class="scroll-dot"></div>
  </div>
</div>
</template>

<script setup>
import EfectoMatrix from './genericos/EfectoMatrix.vue'
</script>

<style scoped>
.header-modern {
  height: 100svh;
  position: relative;
  background: linear-gradient(135deg, var(--bg-dark) 0%, #1a1a1a 50%, var(--bg-dark) 100%);
  overflow: hidden;
}

.header-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  align-items: center;
}

.header-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  height: 100%;
}

.header-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}

.brand-section {
  max-width: 600px;
}

.logo-container {
  margin-bottom: 2rem;
}

.logo-text {
  margin-bottom: 1rem;
}

.brand-title {
  font-family: "BebasNeue";
  font-size: clamp(4rem, 8vw, 8rem);
  line-height: 0.9;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--accent-green) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
  position: relative;
  animation: brandTitleAnimation 2s ease-out forwards;
  /* Mejorar contraste con sombra de texto */
  text-shadow: 
    0 0 20px rgba(0, 212, 170, 0.5),
    0 0 40px rgba(0, 212, 170, 0.3),
    0 0 60px rgba(0, 212, 170, 0.1);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8));
}

.brand-title::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--accent-green) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: brandTitleGlow 3s ease-in-out infinite alternate;
  opacity: 0;
}

@keyframes brandTitleAnimation {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.8);
    filter: blur(10px);
  }
  50% {
    opacity: 0.7;
    transform: translateY(-5px) scale(1.05);
    filter: blur(2px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes brandTitleGlow {
  0% {
    opacity: 0;
    transform: scale(1);
  }
  100% {
    opacity: 0.3;
    transform: scale(1.02);
  }
}

.logo-subtitle {
  font-size: clamp(1.2rem, 2.5vw, 2rem);
  color: var(--text-light);
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  animation: subtitleAnimation 2s ease-out 0.5s forwards;
  opacity: 0;
  transform: translateY(20px);
  /* Mejorar contraste */
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@keyframes subtitleAnimation {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.tagline {
  margin-bottom: 3rem;
  animation: taglineAnimation 2s ease-out 1s forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes taglineAnimation {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.tagline-text {
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  line-height: 1.6;
  color: var(--text-light);
  font-weight: 500;
  max-width: 500px;
  /* Mejorar contraste */
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.4);
  padding: 1.5rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.cta-section {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  animation: ctaAnimation 2s ease-out 1.5s forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes ctaAnimation {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--secondary-green) 100%);
  /* Mejorar contraste */
  box-shadow: 
    0 4px 16px rgba(0, 212, 170, 0.4),
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(0, 212, 170, 0.3);
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.btn-primary:hover {
  box-shadow: 
    0 8px 24px rgba(0, 212, 170, 0.6),
    0 12px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(0, 212, 170, 0.1);
  border: 2px solid var(--primary-green);
  color: var(--primary-green);
  /* Mejorar contraste */
  backdrop-filter: blur(10px);
  box-shadow: 
    0 4px 16px rgba(0, 212, 170, 0.2),
    0 8px 32px rgba(0, 0, 0, 0.3);
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.btn-secondary:hover {
  background: var(--primary-green);
  color: var(--bg-dark);
  box-shadow: 
    0 8px 24px rgba(0, 212, 170, 0.6),
    0 12px 40px rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
}

/* Elementos flotantes */
.header-visual {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-elements {
  position: relative;
  width: 400px;
  height: 400px;
}

.floating-card {
  position: absolute;
  background: var(--bg-gradient-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: var(--shadow-card);
  transition: var(--transition-medium);
  animation: float 6s ease-in-out infinite;
}

.floating-card:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: var(--shadow-hover);
}

.card-1 {
  top: 0;
  left: 0;
  animation-delay: 0s;
}

.card-2 {
  top: 50%;
  right: 0;
  animation-delay: 2s;
}

.card-3 {
  bottom: 0;
  left: 50%;
  animation-delay: 4s;
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.card-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-light);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* Scroll indicator */
.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
}

.scroll-dot {
  width: 8px;
  height: 8px;
  background: var(--primary-green);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

/* Responsive */
@media (max-width: 1024px) {
  .header-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }
  
  .header-visual {
    order: -1;
    height: 300px;
  }
  
  .floating-elements {
    width: 300px;
    height: 300px;
  }
}

@media (max-width: 768px) {
  .cta-section {
    justify-content: center;
  }
  
  .floating-elements {
    width: 250px;
    height: 250px;
  }
  
  .floating-card {
    padding: 1rem;
  }
  
  .card-icon {
    font-size: 1.5rem;
  }
  
  .card-text {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .header-grid {
    gap: 1rem;
  }
  
  .floating-elements {
    width: 200px;
    height: 200px;
  }
  
  .floating-card {
    padding: 0.8rem;
  }
  
  .card-icon {
    font-size: 1.2rem;
  }
  
  .card-text {
    font-size: 0.7rem;
  }
}
</style>