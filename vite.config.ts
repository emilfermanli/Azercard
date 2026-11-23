import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import generouted from '@generouted/react-router/plugin';
import autoImportComponents from './src/utils/vite-plugin-auto-import-components';

import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), generouted({ format: false }), autoImportComponents(), tailwindcss()],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      '@': path.resolve('src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');

          if (normalized.includes('commonjsHelpers')) {
            return 'vendor-react';
          }

          if (!normalized.includes('/node_modules/')) return undefined;

          if (
            normalized.includes('/node_modules/react/') ||
            normalized.includes('/node_modules/react-dom/') ||
            normalized.includes('/node_modules/react-router') ||
            normalized.includes('/node_modules/@remix-run/') ||
            normalized.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }

          return undefined;
        },
      },
    },
  },
});
