import { defineConfig } from 'vite';

// Honour an externally assigned port (PORT env) and otherwise fall back to
// Vite's default, moving to the next free port if it is already taken.
const port = Number(process.env.PORT) || 5173;

export default defineConfig({
  base: '/lego-spaceship/',
  server: {
    host: true,
    port,
    strictPort: false,
    open: false,
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
});
