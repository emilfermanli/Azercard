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
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (!normalized.includes('/node_modules/')) return undefined;

          if (
            normalized.includes('/node_modules/deck.gl/') ||
            normalized.includes('/node_modules/@deck.gl/') ||
            normalized.includes('/node_modules/@luma.gl/') ||
            normalized.includes('/node_modules/@loaders.gl/') ||
            normalized.includes('/node_modules/@math.gl/') ||
            normalized.includes('/node_modules/@probe.gl/') ||
            normalized.includes('/node_modules/mjolnir.js/')
          ) {
            return 'vendor-deckgl';
          }

          if (
            normalized.includes('/node_modules/recharts/') ||
            normalized.includes('/node_modules/d3-') ||
            normalized.includes('/node_modules/victory-vendor/') ||
            normalized.includes('/node_modules/decimal.js-light/') ||
            normalized.includes('/node_modules/react-smooth/')
          ) {
            return 'vendor-recharts';
          }

          if (
            normalized.includes('/node_modules/@reduxjs/') ||
            normalized.includes('/node_modules/react-redux/') ||
            normalized.includes('/node_modules/redux/') ||
            normalized.includes('/node_modules/redux-persist/') ||
            normalized.includes('/node_modules/immer/') ||
            normalized.includes('/node_modules/reselect/')
          ) {
            return 'vendor-redux';
          }

          if (normalized.includes('/node_modules/@tanstack/')) {
            return 'vendor-table';
          }

          if (
            normalized.includes('/node_modules/react-select/') ||
            normalized.includes('/node_modules/@emotion/')
          ) {
            return 'vendor-select';
          }

          if (
            normalized.includes('/node_modules/lucide-react/') ||
            normalized.includes('/node_modules/@radix-ui/') ||
            normalized.includes('/node_modules/embla-carousel')
          ) {
            return 'vendor-ui';
          }

          if (
            normalized.includes('/node_modules/react/') ||
            normalized.includes('/node_modules/react-dom/') ||
            normalized.includes('/node_modules/react-router') ||
            normalized.includes('/node_modules/@remix-run/') ||
            normalized.includes('/node_modules/scheduler/') ||
            normalized.includes('/node_modules/use-sync-external-store/')
          ) {
            return 'vendor-react';
          }

          return undefined;
        },
      },
    },
  },
});
