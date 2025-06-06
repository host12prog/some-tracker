import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/some-tracker/',
  plugins: [svelte(), tailwindcss()],
  assetsInclude: ['**/*.wasm'],
  build: {
    target: 'esnext'
  }
})
