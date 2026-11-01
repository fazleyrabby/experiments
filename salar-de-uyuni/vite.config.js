import { defineConfig } from 'vite';

export default defineConfig({
  // Relative URLs so the build works under experiments.fazleyrabbi.xyz/salar-de-uyuni/.
  base: './',
  server: { port: 5173, strictPort: true, host: true },
  build: { target: 'es2020', chunkSizeWarningLimit: 1200 },
});
