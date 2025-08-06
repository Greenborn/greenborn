<template>
  <div class="tech-card-modern">
    <div class="tech-card-content">
      
      <!-.tech-image[alt="Django"] {
  filter: drop-shadow(0 0 10px rgba(0, 255, 65, 0.4));
}

.tech-image[alt="Maria DB"] {
  filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.4));
}

.tech-image[alt="PHP"] {
  filter: drop-shadow(0 0 10px rgba(0, 191, 255, 0.4));
}

.tech-image[alt="HTML5"] {
  filter: drop-shadow(0 0 10px rgba(255, 69, 0, 0.4));
}

.tech-image[alt="Bootstrap"] {
  filter: drop-shadow(0 0 10px rgba(255, 0, 255, 0.4));
}

.tech-image[alt="JavaScript"] {
  filter: drop-shadow(0 0 10px rgba(255, 255, 0, 0.4));
}

.tech-image[alt="Python"] {
  filter: drop-shadow(0 0 10px rgba(0, 191, 255, 0.4));
}

.tech-image[alt="WordPress"] {
  filter: drop-shadow(0 0 10px rgba(32, 178, 170, 0.4));
}de la tecnología -->
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
  border-color: var(--primary-green-light);
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
  filter: brightness(0.8) contrast(1.2) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  opacity: 0.9;
  transition: var(--transition-medium);
}

/* Filtros específicos para iconos problemáticos */
.tech-image[alt="JavaScript"] {
  filter: brightness(1) contrast(1) drop-shadow(0 2px 6px rgba(247, 223, 30, 0.4));
}

.tech-image[alt="Bootstrap"] {
  filter: brightness(1) contrast(1) drop-shadow(0 2px 6px rgba(121, 82, 179, 0.4));
}

.tech-image[alt="HTML5"] {
  filter: brightness(1) contrast(1) drop-shadow(0 2px 6px rgba(227, 79, 38, 0.4));
}

.tech-image[alt="PHP"] {
  filter: brightness(1) contrast(1) drop-shadow(0 2px 6px rgba(119, 123, 179, 0.4));
}

.tech-image[alt="Python"] {
  filter: brightness(1) contrast(1) drop-shadow(0 2px 6px rgba(75, 139, 190, 0.4));
}

.tech-image[alt="Maria DB"] {
  filter: brightness(1) contrast(1) drop-shadow(0 2px 6px rgba(0, 255, 255, 0.4));
}

.tech-image[alt="Django"] {
  filter: brightness(1) contrast(1) drop-shadow(0 2px 6px rgba(0, 255, 65, 0.4));
}

.tech-image[alt="WordPress"] {
  filter: brightness(1) contrast(1) drop-shadow(0 2px 6px rgba(74, 157, 211, 0.4));
}

.tech-card-modern:hover .tech-image {
  opacity: 1;
  filter: brightness(1.1) contrast(1.2) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  transform: scale(1.05);
}

.tech-card-modern:hover .tech-image[alt="JavaScript"] {
  filter: brightness(1.1) contrast(1.1) drop-shadow(0 4px 10px rgba(247, 223, 30, 0.7));
}

.tech-card-modern:hover .tech-image[alt="Bootstrap"] {
  filter: brightness(1.1) contrast(1.1) drop-shadow(0 4px 10px rgba(121, 82, 179, 0.7));
}

.tech-card-modern:hover .tech-image[alt="HTML5"] {
  filter: brightness(1.1) contrast(1.1) drop-shadow(0 4px 10px rgba(227, 79, 38, 0.7));
}

.tech-card-modern:hover .tech-image[alt="PHP"] {
  filter: brightness(1.1) contrast(1.1) drop-shadow(0 4px 10px rgba(119, 123, 179, 0.7));
}

.tech-card-modern:hover .tech-image[alt="Python"] {
  filter: brightness(1.1) contrast(1.1) drop-shadow(0 4px 10px rgba(75, 139, 190, 0.7));
}

.tech-card-modern:hover .tech-image[alt="Maria DB"] {
  filter: brightness(1.1) contrast(1.1) drop-shadow(0 4px 10px rgba(0, 255, 255, 0.7));
}

.tech-card-modern:hover .tech-image[alt="Django"] {
  filter: brightness(1.1) contrast(1.1) drop-shadow(0 4px 10px rgba(0, 255, 65, 0.7));
}

.tech-card-modern:hover .tech-image[alt="WordPress"] {
  filter: brightness(1.1) contrast(1.1) drop-shadow(0 4px 10px rgba(74, 157, 211, 0.7));
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