<template>
<canvas ref="canvas" class="efecto-matrix" aria-hidden="true" />
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const canvas = ref(null)

const COL_W = 24        // ancho de columna en px
const STEP = 24         // avance vertical por tick
const TICK_MS = 95

let ctx = null
let timer = null
let cols = 0
let ypos = []

/* Dibuja a la resolución real del dispositivo: en pantallas HiDPI el canvas
   se veía borroso porque el backing store usaba tamaño CSS. */
function resizeCanvas() {
  const el = canvas.value
  if (!el) return

  const dpr = window.devicePixelRatio || 1
  const { width, height } = el.getBoundingClientRect()
  if (!width || !height) return

  el.width = Math.round(width * dpr)
  el.height = Math.round(height * dpr)

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.font = '13px "BitstreamVeraMono", monospace'
  ctx.textBaseline = 'top'

  cols = Math.ceil(width / COL_W) + 1
  // Arranque desfasado: evita que todas las columnas caigan en bloque
  ypos = Array.from({ length: cols }, () => Math.random() * -height)

  ctx.fillStyle = '#07090a'
  ctx.fillRect(0, 0, width, height)
}

function draw() {
  const el = canvas.value
  if (!el) return

  const dpr = window.devicePixelRatio || 1
  const w = el.width / dpr
  const h = el.height / dpr

  // Rastro: cada tick oscurece lo anterior en vez de borrarlo
  ctx.fillStyle = 'rgba(7, 9, 10, 0.05)'
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(0, 212, 170, 0.72)'

  for (let i = 0; i < cols; i++) {
    // Rango imprimible de ASCII: antes salían caracteres de control invisibles
    const char = String.fromCharCode(33 + Math.floor(Math.random() * 93))
    ctx.fillText(char, i * COL_W, ypos[i])

    ypos[i] = ypos[i] > h + Math.random() * h ? 0 : ypos[i] + STEP
  }
}

onMounted(() => {
  const el = canvas.value
  if (!el) return

  ctx = el.getContext('2d')
  resizeCanvas()

  // Respeta la preferencia de menos movimiento: deja el fondo estático
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!prefersReducedMotion) {
    timer = setInterval(draw, TICK_MS)
  }

  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped>
.efecto-matrix {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  /* El rastro cae hacia arriba, como en el original */
  transform: rotate(180deg);
  opacity: 0.9;
}
</style>
