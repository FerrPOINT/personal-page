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
              // Vendor chunks - React and ALL React-dependent libraries in one chunk
              if (id.includes('node_modules')) {
                // React core libraries
                if (id.includes('react') || id.includes('react-dom') || id.includes('react/jsx-runtime')) {
                  return 'react-vendor';
                }
                // ALL React-dependent libraries MUST be in react-vendor to avoid initialization order issues
                if (
                  id.includes('@react-three') || 
                  id.includes('framer-motion') || 
                  id.includes('react-hook-form') || 
                  id.includes('recharts') ||
                  id.includes('lucide-react') ||
                  id.includes('three') && !id.includes('three/examples')
                ) {
                  return 'react-vendor';
                }
                // All other vendor libraries (non-React dependencies)
                return 'vendor';
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
