<template>
<footer class="footer-modern">
  <div class="container-modern">

    <div class="footer-content">

      <!-- Información de la empresa -->
      <div class="footer-brand-col">
        <div class="footer-brand">
          <h3 class="brand-name">Greenborn</h3>
          <p class="brand-tagline">Software en Crecimiento</p>
        </div>
        <p class="footer-description">
          Desarrollamos soluciones de software libre que transforman ideas en realidad digital.
          Especialistas en desarrollo web, aplicaciones móviles y soluciones personalizadas.
        </p>
      </div>

      <!-- Navegación -->
      <nav class="footer-col" aria-label="Navegación del sitio">
        <h4 class="footer-title">Navegación</h4>
        <ul class="footer-links">
          <li><a href="#seccion-inicio">Inicio</a></li>
          <li><a href="#seccion-servicios">Servicios</a></li>
          <li><a href="#seccion-metodologia">Metodología</a></li>
          <li><a href="#seccion-tecnologias">Tecnologías</a></li>
          <li><a href="#seccion-contacto">Contacto</a></li>
        </ul>
      </nav>

      <!-- Contacto -->
      <div class="footer-col">
        <h4 class="footer-title">Contacto</h4>
        <ul class="footer-contact">
          <li>
            <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
            Tandil, Buenos Aires, Argentina
          </li>
          <li>
            <i class="fas fa-envelope" aria-hidden="true"></i>
            <a href="mailto:info@greenborn.com">info@greenborn.com</a>
          </li>
        </ul>
      </div>

    </div>

    <!-- Redes sociales y copyright -->
    <div class="footer-bottom">

      <div class="copyright">
        <span class="copyleft">&copy;</span> {{ year }} Greenborn · Desarrollo de Software Libre
      </div>

      <ul class="legal-links">
        <li>
          <a href="https://greenborn.com.ar/politica-privacidad.html" target="_blank" rel="noopener">Política de Privacidad</a>
        </li>
        <li>
          <a href="https://greenborn.com.ar/condiciones-servicio.html" target="_blank" rel="noopener">Condiciones de Servicio</a>
        </li>
      </ul>

      <div class="social-links">
        <a
          v-for="red in listado_contactos"
          :key="red.id"
          :href="red.e"
          target="_blank"
          rel="noopener"
          class="social-link"
          :title="red.t"
          :aria-label="red.t"
        >
          <img :src="red.i" :alt="red.t" class="social-icon" />
        </a>
      </div>

    </div>

  </div>
</footer>
</template>

<script setup>
import { ref } from 'vue'

import Linkedin from '../assets/img/linkedin.svg'
import Instagram from '../assets/img/instagram.svg'
import Facebook from '../assets/img/facebook.svg'

const year = new Date().getFullYear()

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
  position: relative;
  padding: var(--sp-7) 0 var(--sp-5);
  background: var(--surface-1);
  border-top: 1px solid var(--border-light);
}

.footer-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    var(--border-green) 50%,
    transparent 100%);
}

.footer-content {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  gap: var(--sp-6);
  padding-bottom: var(--sp-6);
}

.footer-brand-col {
  max-width: 26rem;
}

.footer-brand {
  margin-bottom: var(--sp-3);
}

.brand-name {
  margin-bottom: 0.2rem;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.02em;
  background: linear-gradient(120deg, var(--primary-green) 0%, var(--accent-green) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-tagline {
  color: var(--text-gray);
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.footer-description {
  color: var(--text-gray);
  font-size: var(--fs-sm);
  line-height: 1.65;
}

.footer-title {
  margin-bottom: var(--sp-3);
  color: var(--text-light);
  font-size: var(--fs-xs);
  font-weight: 650;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.footer-links,
.footer-contact,
.legal-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 0.65rem;
}

.footer-links a {
  color: var(--text-gray);
  font-size: var(--fs-sm);
  transition: color var(--transition-fast);
}

.footer-links a:hover {
  color: var(--primary-green);
}

.footer-contact li {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin-bottom: 0.85rem;
  color: var(--text-gray);
  font-size: var(--fs-sm);
  line-height: 1.5;
}

.footer-contact i {
  width: 1rem;
  margin-top: 0.2rem;
  color: var(--primary-green);
  font-size: 0.85rem;
}

.footer-contact a {
  color: var(--text-gray);
}

.footer-contact a:hover {
  color: var(--primary-green);
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--sp-3);
  padding-top: var(--sp-4);
  border-top: 1px solid var(--border-light);
}

.copyright {
  color: var(--text-faint);
  font-size: var(--fs-xs);
}

.copyleft {
  color: var(--primary-green);
}

.legal-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-4);
}

.legal-links a {
  color: var(--text-faint);
  font-size: var(--fs-xs);
  transition: color var(--transition-fast);
}

.legal-links a:hover {
  color: var(--primary-green);
}

.social-links {
  display: flex;
  gap: 0.6rem;
}

.social-link {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-light);
  border-radius: var(--r-sm);
  background: var(--surface-raised);
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast);
}

.social-link:hover {
  transform: translateY(-2px);
  border-color: var(--border-green);
  background: rgba(0, 212, 170, 0.1);
}

.social-icon {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1);
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.social-link:hover .social-icon {
  opacity: 1;
}

@media (max-width: 1024px) {
  .footer-content {
    grid-template-columns: 1fr 1fr;
  }

  .footer-brand-col {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: var(--sp-5);
  }

  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }

  .legal-links {
    gap: var(--sp-3);
  }
}
</style>
