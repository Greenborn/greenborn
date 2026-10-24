<template>
  <article class="tech-card">
    <div class="tech-head">
      <a :href="data.url" target="_blank" rel="noopener" class="tech-logo" :aria-label="`Sitio oficial de ${data.name}`">
        <img :src="data.img_src" :alt="data.name" class="tech-image" />
      </a>

      <div class="tech-heading">
        <h3 class="tech-name">{{ data.name }}</h3>
        <a :href="data.url" target="_blank" rel="noopener" class="tech-link">
          Sitio oficial <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>

    <p class="tech-description">{{ data.description }}</p>
  </article>
</template>

<script setup>
defineProps({ data: { type: Object, required: true } })
</script>

<style scoped>
.tech-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem;
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  background: linear-gradient(160deg, var(--surface-raised-strong) 0%, var(--surface-raised) 100%);
  box-shadow: var(--shadow-card);
  transition:
    transform var(--transition-medium),
    border-color var(--transition-medium),
    box-shadow var(--transition-medium);
}

.tech-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-green);
  box-shadow: var(--shadow-hover), var(--ring-green);
}

.tech-head {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
}

.tech-logo {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 54px;
  height: 54px;
  border: 1px solid var(--border-light);
  border-radius: var(--r-sm);
  background: rgba(255, 255, 255, 0.04);
  transition: border-color var(--transition-medium), background var(--transition-medium);
}

.tech-logo:hover {
  border-color: var(--border-green);
  background: rgba(0, 212, 170, 0.08);
}

.tech-image {
  width: 32px;
  height: 32px;
  transition: transform var(--transition-medium);
}

.tech-card:hover .tech-image {
  transform: scale(1.08);
}

.tech-heading {
  min-width: 0;
}

.tech-name {
  color: var(--text-light);
  font-size: var(--fs-h3);
  font-weight: 700;
  line-height: 1.2;
}

.tech-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.2rem;
  color: var(--primary-green);
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: gap var(--transition-fast), color var(--transition-fast);
}

.tech-link:hover {
  gap: 0.6rem;
  color: var(--accent-green);
}

.tech-description {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
  overflow: hidden;
  color: var(--text-gray);
  font-size: var(--fs-sm);
  line-height: 1.65;
}

@media (max-width: 768px) {
  .tech-card {
    padding: 1.25rem;
  }

  .tech-description {
    -webkit-line-clamp: 4;
  }
}
</style>
