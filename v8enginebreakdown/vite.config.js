import { defineConfig } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Development-only recording export. The built application has no server.
const localRecordingExport = {
  name: 'local-recording-export',
  configureServer(server) {
    server.middlewares.use('/__frame', async (req, res, next) => {
      if (req.method !== 'POST') return next();
      const index = Number(req.headers['x-frame-index']);
      if (!Number.isInteger(index) || index < 0 || index > 539) { res.statusCode = 400; res.end('Invalid frame'); return; }
      try {
        const chunks = []; let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 4 * 1024 * 1024) { res.statusCode = 413; res.end('Frame too large'); return; }
          chunks.push(chunk);
        }
        const folder = fileURLToPath(new URL('./artifacts/frames/', import.meta.url));
        await mkdir(folder, { recursive: true });
        await writeFile(`${folder}frame-${String(index).padStart(4, '0')}.jpg`, Buffer.concat(chunks));
        res.statusCode = 200; res.end('Frame saved');
      } catch (error) { res.statusCode = 500; res.end(error.message); }
    });
    server.middlewares.use('/__recording', async (req, res, next) => {
      if (req.method !== 'POST') return next();
      try {
        const chunks = []; let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 128 * 1024 * 1024) { res.statusCode = 413; res.end('Recording too large'); return; }
          chunks.push(chunk);
        }
        const folder = fileURLToPath(new URL('./artifacts/', import.meta.url));
        await mkdir(folder, { recursive: true });
        await writeFile(`${folder}inside-the-v8-overview.webm`, Buffer.concat(chunks));
        res.statusCode = 200; res.end('Recording saved');
      } catch (error) { res.statusCode = 500; res.end(error.message); }
    });
  },
};

export default defineConfig({
  base: '/v8engine/',
  plugins: [localRecordingExport],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
});
