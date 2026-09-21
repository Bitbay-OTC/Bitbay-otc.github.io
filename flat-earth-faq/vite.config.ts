import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps the built bundle working whether the site is served from a
// domain root, a GitHub Pages project path, or opened straight off disk.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
  },
});
