import { defineConfig } from 'vite';

// Deployed as a GitHub Pages organisation site (bitbay-otc.github.io), which
// serves from the domain root. If this ever moves to a project page, set
// `base` to '/<repo>/' and the router's hash routes keep working unchanged.
export default defineConfig({
  base: '/',
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
  },
});
