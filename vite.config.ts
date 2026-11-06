import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  publicDir: 'src/public',
  server: { port: 5173 },
  build: { target: 'es2020' },
});

