<template>
  <div class="tech-card-modern">
    <div class="tech-card-content">
      
      <!-- Logo de la tecnología -->
      <div class="tech-logo">
        <a :href="data.url" target="_blank" class="tech-link">
          <img :src="data.img_src" :alt="data.name" class="tech-image" />
        </a>
      </div>
      
      <!-- Información de la tecnología -->
      <div class="tech-info">
        <h3 class="tech-name">{{ data.name }}</h3>
        <p class="tech-description" v-html="data.description"></p>
        
        <div class="tech-cta">
          <a :href="data.url" target="_blank" class="tech-learn-more">
            Ver más →
          </a>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
const props = defineProps([ "data" ])
</script>

<style scoped>
.tech-card-modern {
  background: var(--bg-gradient-card);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 2rem;
  transition: var(--transition-medium);
  height: 100%;
  display: flex;
  flex-direction: column;
  animation: fadeInUp 0.8s ease-out both;
}

.tech-card-modern:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-green);
}

.tech-card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1.5rem;
}

.tech-logo {
  text-align: center;
  flex-shrink: 0;
}

.tech-link {
  display: inline-block;
  transition: var(--transition-medium);
}

.tech-link:hover {
  transform: scale(1.1);
}

.tech-image {
  width: 80px;
  height: 80px;
  filter: brightness(0) invert(1);
  opacity: 0.8;
  transition: var(--transition-medium);
}

.tech-card-modern:hover .tech-image {
  opacity: 1;
  filter: brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(140deg);
}

.tech-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tech-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 1rem;
  text-align: center;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--accent-green) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tech-description {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-gray);
  margin-bottom: 1.5rem;
  flex: 1;
  text-align: center;
}

.tech-cta {
  text-align: center;
  margin-top: auto;
}

.tech-learn-more {
  color: var(--primary-green);
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-decoration: none;
  transition: var(--transition-medium);
  display: inline-block;
}

.tech-learn-more:hover {
  color: var(--accent-green);
  transform: translateX(5px);
}

/* Responsive */
@media (max-width: 768px) {
  .tech-card-modern {
    padding: 1.5rem;
  }
  
  .tech-image {
    width: 60px;
    height: 60px;
  }
  
  .tech-name {
    font-size: 1.3rem;
  }
  
  .tech-description {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .tech-card-modern {
    padding: 1.2rem;
  }
  
  .tech-image {
    width: 50px;
    height: 50px;
  }
  
  .tech-name {
    font-size: 1.2rem;
  }
  
  .tech-description {
    font-size: 0.85rem;
  }
}
</style>