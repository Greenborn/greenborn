import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base relativo: el build se sirve desde /juegos_virales/ dentro del sitio principal
export default defineConfig({
  base: './',
  plugins: [vue()],
})
