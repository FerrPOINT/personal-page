import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig(({ mode }) => {
    // Load .env from project root (parent directory)
    const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
    return {
      root: '.',
      publicDir: 'public',
      build: {
        outDir: 'dist',
        sourcemap: false,
        // Оптимизация CSS для production
        cssCodeSplit: true,
        cssMinify: true,
        // Оптимизация chunk size
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Separate translations into their own chunks for better code splitting
              if (id.includes('i18n/translations/ru.json')) {
                return 'translations-ru';
              }
              if (id.includes('i18n/translations/en.json')) {
                return 'translations-en';
              }
              // Vendor chunks - ALL node_modules in react-vendor to avoid initialization order issues
              // The Activity error occurs when vendor chunk tries to use React before it's initialized
              // Solution: put everything in react-vendor to ensure React loads first
              if (id.includes('node_modules')) {
                // Put ALL dependencies in react-vendor to guarantee React loads before any other code
                // This ensures no code tries to access React APIs before React is initialized
                return 'react-vendor';
              }
            },
          },
        },
      },
      server: {
        port: 8888,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:9000',
            changeOrigin: true,
            secure: false,
          },
        },
      },
      plugins: [react()],
      css: {
        postcss: {
          plugins: [
            tailwindcss,
            autoprefixer,
          ],
        },
      },
      define: {
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
