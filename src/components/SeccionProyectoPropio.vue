<template>
  <div class="proyecto-propio-section seccion" id="seccion-proyecto-propio">
    <div class="container-modern">

      <!-- Header de la sección -->
      <div class="section-header">
        <p class="section-eyebrow">Proyecto propio</p>
        <h2 class="section-title">profesionales<em>.top</em></h2>
        <p class="section-subtitle">
          Una plataforma propia, ideada y desarrollada por Greenborn, para conectar a todos
          los profesionales de la ciudad con quienes buscan sus servicios.
        </p>
      </div>

      <!-- Panel del proyecto -->
      <div class="proyecto-card">

        <div class="proyecto-card-header">
          <div class="proyecto-logo">
            <img src="/img/proyectos/profesionales-top-logo.svg" alt="Logo de profesionales.top" />
          </div>
          <div class="proyecto-badge">
            <i class="fas fa-hammer"></i>
            <span>En construcción</span>
          </div>
        </div>

        <h3 class="proyecto-titulo">Un espacio para encontrar y ofrecer servicios profesionales</h3>
        <p class="proyecto-descripcion">
          <strong>profesionales.top</strong> es un desarrollo propio pensado para reunir, en un
          solo lugar, a profesionales y oficios de la ciudad junto con las personas que necesitan
          contratarlos: desde electricistas, plomeros y albañiles hasta abogados, diseñadores
          y técnicos. El objetivo es simplificar la búsqueda, dar visibilidad a quienes
          trabajan en la ciudad y ordenar el contacto entre ambas partes.
        </p>

        <!-- Características -->
        <div class="proyecto-features">
          <div class="feature-item">
            <div class="feature-icon">
              <i class="fas fa-search"></i>
            </div>
            <div class="feature-text">
              <h4>Búsqueda por especialidad</h4>
              <p>Encontrá profesionales filtrando por oficio, especialidad o palabra clave.</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <i class="fas fa-id-card"></i>
            </div>
            <div class="feature-text">
              <h4>Perfiles públicos</h4>
              <p>Cada profesional cuenta con un perfil propio con sus servicios y forma de contacto.</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <i class="fas fa-layer-group"></i>
            </div>
            <div class="feature-text">
              <h4>Panel para cada rol</h4>
              <p>Paneles diferenciados para administradores, profesionales y clientes.</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <i class="fas fa-map-marker-alt"></i>
            </div>
            <div class="feature-text">
              <h4>Pensado para la comunidad</h4>
              <p>Enfocado en la comunidad local, para fortalecer el trabajo de la ciudad.</p>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="proyecto-cta">
          <p class="proyecto-cta-nota">
            El proyecto está en etapa de desarrollo activo. Visitá el sitio para conocer el
            avance y dejarnos tu opinión.
          </p>
          <a href="https://profesionales.top" target="_blank" rel="noopener noreferrer" class="btn-modern">
            Visitar profesionales.top
            <i class="fas fa-arrow-right"></i>
          </a>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.proyecto-propio-section {
  background: var(--surface-0);
  position: relative;
}

.proyecto-propio-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--primary-green) 50%, transparent 100%);
}

.proyecto-card {
  max-width: 820px;
  margin: 0 auto;
  padding: 2.75rem 3rem;
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  background: linear-gradient(160deg, var(--surface-raised-strong) 0%, var(--surface-raised) 100%);
  box-shadow: var(--shadow-card);
  transition:
    border-color var(--transition-medium),
    box-shadow var(--transition-medium);
  animation: fadeInUp 0.8s ease-out both;
}

.proyecto-card:hover {
  border-color: var(--border-green);
  box-shadow: var(--shadow-hover), var(--ring-green);
}

.proyecto-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.proyecto-logo {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  padding: 0.5rem;
  border: 1px solid var(--border-green);
  border-radius: var(--r-sm);
  background: rgba(0, 212, 170, 0.08);
}

.proyecto-logo img {
  width: 100%;
  height: 100%;
}

.proyecto-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  border: 1px solid var(--border-green);
  border-radius: 999px;
  background: rgba(0, 212, 170, 0.1);
  color: var(--primary-green);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.proyecto-titulo {
  font-size: clamp(1.4rem, 3vw, 1.75rem);
  color: var(--text-light);
  margin-bottom: 1rem;
  line-height: 1.3;
}

.proyecto-descripcion {
  color: var(--text-gray);
  font-size: 1.02rem;
  line-height: 1.75;
  margin-bottom: 2.25rem;
}

.proyecto-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2.25rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
}

.feature-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border: 1px solid var(--border-green);
  border-radius: var(--r-sm);
  background: rgba(0, 212, 170, 0.1);
  color: var(--primary-green);
  font-size: 1rem;
}

.feature-text h4 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 0.3rem;
}

.feature-text p {
  font-size: 0.9rem;
  color: var(--text-gray);
  line-height: 1.55;
}

.proyecto-cta {
  padding-top: 1.75rem;
  border-top: 1px solid var(--border-light);
  text-align: center;
}

.proyecto-cta-nota {
  color: var(--text-gray);
  font-size: 0.95rem;
  margin-bottom: 1.25rem;
}

.proyecto-cta .btn-modern {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

/* Responsive */
@media (max-width: 768px) {
  .proyecto-card {
    padding: 2.25rem 2rem;
  }

  .proyecto-features {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}

@media (max-width: 480px) {
  .proyecto-card {
    padding: 1.75rem 1.5rem;
  }

  .proyecto-card-header {
    flex-wrap: wrap;
  }
}
</style>
