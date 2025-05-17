import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  base: '/some-tracker/',
  plugins: [svelte()],
  assetsInclude: ['**/*.wasm'],
  build: {
    target: 'esnext'
  }
})
