<template>
<div class="footer-modern">
  <div class="container-modern">
    
    <div class="footer-content">
      
      <!-- Información de la empresa -->
      <div class="footer-section">
        <div class="footer-brand">
          <h3 class="brand-name">Greenborn</h3>
          <p class="brand-tagline">Software en Crecimiento</p>
        </div>
        <p class="footer-description">
          Desarrollamos soluciones de software libre que transforman ideas en realidad digital.
          Especialistas en desarrollo web, aplicaciones móviles y soluciones personalizadas.
        </p>
      </div>

      <!-- Enlaces rápidos -->
      <div class="footer-section">
        <h4 class="footer-title">Enlaces Rápidos</h4>
        <ul class="footer-links">
          <li><a href="#seccion-servicios">Servicios</a></li>
          <li><a href="#seccion-portfolio">Portfolio</a></li>
          <li><a href="#seccion-tecnologias">Tecnologías</a></li>
          <li><a href="#seccion-contacto">Contacto</a></li>
        </ul>
      </div>

      <!-- Servicios -->
      <div class="footer-section">
        <h4 class="footer-title">Servicios</h4>
        <ul class="footer-links">
          <li>Desarrollo de APP's Móviles</li>
          <li>Web Scraping</li>
          <li>Migración Web</li>
          <li>Solución de Errores</li>
          <li>Alojamiento Web</li>
        </ul>
      </div>

      <!-- Contacto -->
      <div class="footer-section">
        <h4 class="footer-title">Contacto</h4>
        <div class="contact-info">
          <p><i class="fas fa-envelope"></i> info@greenborn.com.ar</p>
          <p><i class="fas fa-phone"></i> +54 249 427 9833</p>
          <p><i class="fas fa-map-marker-alt"></i> Argentina</p>
        </div>
      </div>

    </div>

    <!-- Redes sociales y copyright -->
    <div class="footer-bottom">
      
      <div class="social-links">
        <a 
          v-for="red in listado_contactos" 
          :key="red.id"
          :href="red.e" 
          target="_blank"
          class="social-link"
          :title="red.t"
        >
          <img :src="red.i" :alt="red.t" class="social-icon" />
        </a>
      </div>

      <div class="copyright">
        <p>
          <span class="copyleft">&copy;</span> 2025 Greenborn - Desarrollo de Software Libre
        </p>
      </div>

    </div>

  </div>
</div>
</template>

<script setup>
import { ref } from 'vue'

import Linkedin from '../assets/img/linkedin.svg'
import Instagram from '../assets/img/instagram.svg'
import Facebook from '../assets/img/facebook.svg'

const listado_contactos = ref([
  {
    id: 0, 
    t: "Facebook", 
    i: Facebook,
    e: "https://www.facebook.com/Greenborn-100550959124104"
  },
  {
    id: 10, 
    t: "Instagram", 
    i: Instagram,
    e: "https://www.instagram.com/greenborn_soft/"
  },
  {
    id: 40, 
    t: "Linkedin", 
    i: Linkedin,
    e: "https://www.linkedin.com/company/greenborn"
  },
])
</script>

<style scoped>
.footer-modern {
  background: var(--bg-dark);
  border-top: 1px solid var(--border-light);
  padding: 4rem 0 2rem;
  position: relative;
}

.footer-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--primary-green) 50%, transparent 100%);
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
}

.footer-section {
  animation: fadeInUp 0.8s ease-out both;
}

.footer-brand {
  margin-bottom: 1.5rem;
}

.brand-name {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--accent-green) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.brand-tagline {
  color: var(--text-gray);
  font-size: 1rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.footer-description {
  color: var(--text-gray);
  line-height: 1.6;
  max-width: 400px;
}

.footer-title {
  color: var(--text-light);
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 0.75rem;
}

.footer-links a {
  color: var(--text-gray);
  text-decoration: none;
  transition: var(--transition-medium);
  font-size: 0.95rem;
}

.footer-links a:hover {
  color: var(--primary-green);
}

.footer-links li {
  color: var(--text-gray);
  font-size: 0.95rem;
}

.contact-info p {
  color: var(--text-gray);
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.contact-info i {
  color: var(--primary-green);
  width: 16px;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2rem;
  border-top: 1px solid var(--border-light);
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-gradient-card);
  border: 1px solid var(--border-light);
  border-radius: 50%;
  transition: var(--transition-medium);
}

.social-link:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-green);
}

.social-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
  opacity: 0.7;
  transition: var(--transition-medium);
}

.social-link:hover .social-icon {
  opacity: 1;
  filter: brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(140deg);
}

.copyright {
  color: var(--text-gray);
  font-size: 0.9rem;
}

.copyleft {
  color: var(--primary-green);
}

/* Responsive */
@media (max-width: 1024px) {
  .footer-content {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
  
  .social-links {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .footer-modern {
    padding: 3rem 0 1.5rem;
  }
  
  .brand-name {
    font-size: 1.5rem;
  }
  
  .footer-title {
    font-size: 1.1rem;
  }
}
</style>