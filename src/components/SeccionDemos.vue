<template>
<section class="juegos-section seccion" id="seccion-demos">
  <div class="container-modern">

    <div class="section-header">
      <p class="section-eyebrow">Demos</p>
      <h2 class="section-title">Probá nuestras <em>demos</em></h2>
      <p class="section-subtitle">Proyectos jugables que podés probar directamente en el navegador.</p>
    </div>

    <div class="juegos-grid">
      <article v-for="demo in demos" :key="demo.url" class="juego-card">
        <a :href="demo.url" class="juego-imagen" tabindex="-1" aria-hidden="true">
          <img :src="demo.imagen" alt="" width="1920" height="919" loading="lazy">
        </a>
        <div class="juego-cuerpo">
          <h3 class="juego-nombre">{{ demo.nombre }}</h3>
          <p class="juego-resumen">{{ demo.resumen }}</p>
          <a :href="demo.url" class="juego-enlace" :aria-label="`Jugar ${demo.nombre}`">
            Jugar <span aria-hidden="true">→</span>
          </a>
        </div>
      </article>
    </div>

  </div>
</section>
</template>

<script setup>
// Misma imagen que usa el juego en su metaetiqueta og:image.
import imgVendedores from '../../juegos_virales/vendedores-capital/assets/og/og-vendedores-capital.png'

const demos = [
  {
    nombre: 'Vendedores Capital 2D',
    resumen: 'Minijuego de vista cenital: vendé tu mercadería por las calles de Buenos Aires sin que te detengan. Una parodia para sensibilizar sobre la realidad de la venta callejera.',
    url: '/juegos_virales/vendedores-capital/',
    imagen: imgVendedores,
  },
]
</script>

<style scoped>
.juegos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 560px));
  justify-content: center;
  gap: var(--sp-4);
}

.juego-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  background: linear-gradient(160deg, var(--surface-raised-strong) 0%, var(--surface-raised) 100%);
  box-shadow: var(--shadow-card);
  transition:
    transform var(--transition-medium),
    border-color var(--transition-medium),
    box-shadow var(--transition-medium);
}

.juego-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-green);
  box-shadow: var(--shadow-hover), var(--ring-green);
}

.juego-imagen { display: block; }

.juego-imagen img {
  display: block;
  width: 100%;
  height: auto;
}

.juego-cuerpo {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 1.5rem;
}

.juego-nombre {
  margin-bottom: var(--sp-2);
  color: var(--text-light);
  font-size: var(--fs-h3);
  font-weight: 700;
  line-height: 1.2;
}

.juego-resumen {
  flex: 1;
  color: var(--text-gray);
  font-size: var(--fs-sm);
  line-height: 1.65;
}

.juego-enlace {
  align-self: flex-start;
  margin-top: var(--sp-3);
  padding: 0.6rem 1.4rem;
  border: 1px solid var(--primary-green);
  border-radius: var(--r-pill);
  background: rgba(0, 212, 170, 0.12);
  color: var(--primary-green);
  font-size: var(--fs-sm);
  font-weight: 600;
  text-decoration: none;
}

.juego-enlace:hover { background: rgba(0, 212, 170, 0.24); }
</style>
