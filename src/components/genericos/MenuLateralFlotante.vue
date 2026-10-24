<template>
  <!-- Menú flotante moderno -->
  <div class="modern-menu">
    
    <!-- Botón hamburguesa -->
    <button 
      class="menu-toggle" 
      :class="{ 'menu-toggle-active': desplegado }"
      @click="toggleMenu"
      aria-label="Toggle menu"
    >
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>

    <!-- Overlay del menú -->
    <div 
      class="menu-overlay" 
      :class="{ 'overlay-active': desplegado }"
      @click="closeMenu"
    ></div>

    <!-- Panel del menú -->
    <div class="menu-panel" :class="{ 'panel-active': desplegado }">
      
      <!-- Header del menú -->
      <div class="menu-header">
        <div class="menu-brand">
          <span class="brand-text">Greenborn</span>
          <span class="brand-subtitle">Software en Crecimiento</span>
        </div>
      </div>

      <!-- Navegación -->
      <nav class="menu-navigation">
        <ul class="nav-list">
          <li 
            v-for="enlace in enlaces" 
            :key="enlace.section_id"
            class="nav-item"
            :class="{ 'nav-item-active': enlace.active }"
          >
            <button 
              class="nav-link"
              @click="clickEnlace(enlace)"
            >
              <span class="nav-icon">
                <i :class="getIconForSection(enlace.section_id)"></i>
              </span>
              <span class="nav-text">{{ enlace.label }}</span>
              <span class="nav-indicator"></span>
            </button>
          </li>
        </ul>
      </nav>

      <!-- Footer del menú -->
      <div class="menu-footer">
        <div class="menu-brand">
          <span class="brand-text">Greenborn</span>
          <span class="brand-subtitle">Software en Crecimiento</span>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const desplegado = ref(false)

const enlaces = ref([
  { label: 'Inicio', active: true, section_id: "seccion-inicio", element: null },
  { label: 'Servicios', active: false, section_id: "seccion-servicios", element: null },
  { label: 'Metodología', active: false, section_id: "seccion-metodologia", element: null },
  // Portfolio oculto temporalmente (la sección está comentada en App.vue).
  // Si no se quita, al hacer scroll se accede a element.offsetTop con element null.
  // { label: 'Portfolio', active: false, section_id: "seccion-portfolio", element: null },
  { label: 'Tecnologías', active: false, section_id: "seccion-tecnologias", element: null },
  { label: 'Contacto', active: false, section_id: "seccion-contacto", element: null },
])

const enlace_activo = ref(enlaces.value[0])

function getIconForSection(sectionId) {
  const icons = {
    'seccion-inicio': 'fas fa-home',
    'seccion-servicios': 'fas fa-cogs',
    'seccion-metodologia': 'fas fa-tasks',
    'seccion-portfolio': 'fas fa-briefcase',
    'seccion-tecnologias': 'fas fa-code',
    'seccion-contacto': 'fas fa-envelope'
  }
  return icons[sectionId] || 'fas fa-circle'
}

function toggleMenu() {
  desplegado.value = !desplegado.value
  if (desplegado.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

function closeMenu() {
  desplegado.value = false
  document.body.style.overflow = ''
}

function clickEnlace(enlace) {
  closeMenu()
  for (let i = 0; i < enlaces.value.length; i++) {
    enlaces.value[i].active = false
  }
  enlace.active = true
  enlace_activo.value = enlace
  enlace.element?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(async () => {
  for (let i = 0; i < enlaces.value.length; i++) {
    const elemento = document.getElementById(enlaces.value[i].section_id)
    enlaces.value[i].element = elemento
  }

  window.addEventListener('scroll', handleScroll, { passive: true })
})

function handleScroll() {
  let actual = enlaces.value[0]
  for (const enlace of enlaces.value) {
    if (enlace.element && window.scrollY >= enlace.element.offsetTop - 150) {
      actual = enlace
    }
  }

  for (const enlace of enlaces.value) {
    enlace.active = enlace === actual
  }
  enlace_activo.value = actual
}

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modern-menu {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 3000;
  /* El contenedor no debe bloquear la página cuando el panel está cerrado */
  pointer-events: none;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

/* Botón hamburguesa */
.menu-toggle {
  position: fixed;
  top: 2rem;
  right: 2rem;
  width: 50px;
  height: 50px;
  background: var(--bg-gradient-card);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  z-index: 3001;
  pointer-events: auto;
}

.menu-toggle:hover {
  transform: scale(1.05);
  border-color: var(--primary-green-light);
  box-shadow: var(--shadow-hover);
}

.menu-toggle-active .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.menu-toggle-active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.menu-toggle-active .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

.hamburger-line {
  width: 20px;
  height: 2px;
  background: var(--primary-green);
  transition: all 0.3s ease;
  border-radius: 1px;
}

/* Overlay */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 2999;
  pointer-events: auto;
}

.overlay-active {
  opacity: 1;
  visibility: visible;
}

/* Panel del menú */
.menu-panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: var(--surface-1);
  border-left: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  z-index: 3000;
  backdrop-filter: blur(20px);
  pointer-events: auto;
}

.panel-active {
  right: 0;
}

/* Header del menú */
.menu-header {
  padding: 3rem 2rem 2rem;
  border-bottom: 1px solid var(--border-light);
}

.menu-brand {
  text-align: center;
}

.brand-text {
  display: block;
  font-family: var(--font-display);
  font-size: 2.25rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  background: linear-gradient(120deg, var(--primary-green) 0%, var(--accent-green) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.brand-subtitle {
  display: block;
  color: var(--text-gray);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Navegación */
.menu-navigation {
  flex: 1;
  padding: 2rem 0;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: 0.5rem;
}

.nav-link {
  width: 100%;
  padding: 1rem 2rem;
  background: transparent;
  border: none;
  color: var(--text-light);
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(0, 212, 170, 0.1);
  color: var(--primary-green);
}

.nav-item-active .nav-link {
  background: rgba(0, 212, 170, 0.15);
  color: var(--primary-green);
}

.nav-icon {
  width: 20px;
  text-align: center;
  color: var(--text-gray);
  transition: color 0.3s ease;
}

.nav-link:hover .nav-icon,
.nav-item-active .nav-icon {
  color: var(--primary-green);
}

.nav-text {
  flex: 1;
}

.nav-indicator {
  width: 4px;
  height: 4px;
  background: var(--primary-green);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-item-active .nav-indicator {
  opacity: 1;
}

/* Footer del menú */
.menu-footer {
  padding: 2rem;
  border-top: 1px solid var(--border-light);
  text-align: center;
}

.menu-footer .menu-brand {
  text-align: center;
}

.menu-footer .brand-text {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--accent-green) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.menu-footer .brand-subtitle {
  display: block;
  color: var(--text-gray);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Responsive */
@media (max-width: 768px) {
  .modern-menu {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 3000;
  }
  .menu-panel {
    width: 100vw;
    left: 0;
    right: -100vw;
    min-width: 0;
    max-width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    opacity: 0;
    pointer-events: none;
    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.2s;
  }
  .menu-panel.panel-active {
    right: 0;
    left: 0;
    opacity: 1;
    pointer-events: auto;
  }
  .menu-overlay {
    width: 100vw;
    height: 100vh;
    left: 0;
    top: 0;
  }
  .menu-toggle {
    top: 1rem;
    right: 1rem;
  }
  .menu-header {
    padding: 2rem 1.5rem 1.5rem;
  }
  .nav-link {
    padding: 1rem 1.5rem;
  }
  .menu-footer {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .brand-text {
    font-size: 1.5rem;
  }
  
  .nav-link {
    font-size: 0.9rem;
  }
}
</style>