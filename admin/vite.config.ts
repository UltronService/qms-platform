import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const devHtml = fileURLToPath(new URL('./dev.html', import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: '/qms-platform/admin/',
  build: {
    outDir: 'build-tmp',
    emptyOutDir: true,
    rollupOptions: {
      input: devHtml,
    },
  },
});
