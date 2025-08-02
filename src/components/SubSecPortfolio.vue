<template>
<div class="portfolio-card-modern">
  <div class="portfolio-card-content">
    
    <!-- Carrusel de imágenes -->
    <div class="portfolio-carousel">
      <div :id="'carrusel_'+ data.id" class="carousel slide" data-ride="carousel">
        <div class="carousel-inner">
          <div 
            class="carousel-item" 
            :class="{'active': index == 0}" 
            v-for="(item, index) in data.imgs" 
            :key="index"
          >
            <img 
              class="portfolio-image" 
              alt="Imagen Portfolio" 
              :src="'/img/portfolio/'+item" 
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay con información -->
    <div class="portfolio-overlay">
      <div class="overlay-content">
        
        <!-- Título del proyecto -->
        <h3 class="project-title">{{ data.titulo }}</h3>
        
        <!-- Descripción -->
        <div class="project-description" v-html="data.descripcion_organizacion"></div>
        
        <!-- Tecnologías -->
        <div class="project-technologies" v-if="data.tecnologias_usadas && data.tecnologias_usadas.length > 0">
          <div class="tech-tags">
            <span 
              v-for="tech in data.tecnologias_usadas" 
              :key="tech" 
              class="tech-tag"
            >
              {{ tech }}
            </span>
          </div>
        </div>
        
        <!-- CTA -->
        <div class="project-cta">
          <a :href="data.url" target="_blank" class="visit-project">
            <i class="fas fa-external-link-alt"></i>
            Visitar Proyecto
          </a>
        </div>
        
      </div>
    </div>

  </div>
</div>
</template>

<script setup>
import { onMounted } from 'vue';

const props = defineProps([ "data" ])

onMounted(() => {
  const random_int = Math.floor(Math.random() * 3000) + 2000

  $(`#carrusel_${props.data.id}`).carousel({
    interval: random_int,
    pause: "false",
    direction: "right"
  });
})
</script>

<style scoped>
.portfolio-card-modern {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: var(--bg-gradient-card);
  border: 1px solid var(--border-light);
  transition: var(--transition-medium);
  height: 400px;
  animation: fadeInUp 0.8s ease-out both;
}

.portfolio-card-modern:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-green);
}

.portfolio-card-content {
  position: relative;
  height: 100%;
}

.portfolio-carousel {
  height: 100%;
}

.carousel {
  height: 100%;
}

.carousel-inner {
  height: 100%;
}

.carousel-item {
  height: 100%;
}

.portfolio-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition-medium);
}

.portfolio-card-modern:hover .portfolio-image {
  transform: scale(1.05);
}

.portfolio-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.8) 0%, 
    rgba(0, 0, 0, 0.6) 50%, 
    rgba(0, 0, 0, 0.9) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: var(--transition-medium);
  padding: 2rem;
}

.portfolio-card-modern:hover .portfolio-overlay {
  opacity: 1;
}

.overlay-content {
  text-align: center;
  color: var(--text-light);
  max-width: 100%;
}

.project-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--accent-green) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.project-description {
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  color: var(--text-gray);
  max-height: 120px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.project-technologies {
  margin-bottom: 1.5rem;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.tech-tag {
  background: rgba(0, 48, 38, 0.2);
  color: var(--primary-green);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid rgba(0, 48, 38, 0.3);
  transition: var(--transition-medium);
}

.tech-tag:hover {
  background: var(--primary-green-dark);
  color: var(--text-light);
}

.project-cta {
  margin-top: auto;
}

.visit-project {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-green);
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-decoration: none;
  transition: var(--transition-medium);
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--primary-green);
  border-radius: 25px;
  background: transparent;
}

.visit-project:hover {
  background: var(--primary-green-dark);
  color: var(--text-light);
  border-color: var(--primary-green-dark);
  transform: translateY(-2px);
  text-decoration: none;
}

.visit-project i {
  font-size: 0.8rem;
}

/* Responsive */
@media (max-width: 768px) {
  .portfolio-card-modern {
    height: 350px;
  }
  
  .portfolio-overlay {
    padding: 1.5rem;
  }
  
  .project-title {
    font-size: 1.3rem;
  }
  
  .project-description {
    font-size: 0.85rem;
    max-height: 100px;
  }
  
  .tech-tag {
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
  }
}

@media (max-width: 480px) {
  .portfolio-card-modern {
    height: 320px;
  }
  
  .portfolio-overlay {
    padding: 1.2rem;
  }
  
  .project-title {
    font-size: 1.2rem;
  }
  
  .project-description {
    font-size: 0.8rem;
    max-height: 80px;
  }
  
  .visit-project {
    font-size: 0.8rem;
    padding: 0.6rem 1.2rem;
  }
}
</style>