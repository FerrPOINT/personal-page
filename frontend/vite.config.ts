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
                // ALL React-dependent libraries and their dependencies MUST be in react-vendor
                // This includes transitive dependencies that might import React
                if (
                  id.includes('@react-three') || 
                  id.includes('framer-motion') || 
                  id.includes('react-hook-form') || 
                  id.includes('recharts') ||
                  id.includes('lucide-react') ||
                  id.includes('three') ||
                  id.includes('zustand') ||
                  id.includes('@use-gesture') ||
                  id.includes('suspend-react') ||
                  id.includes('leva') ||
                  id.includes('maath') ||
                  id.includes('meshline') ||
                  id.includes('lamina') ||
                  id.includes('react-spring') ||
                  id.includes('react-use-gesture') ||
                  id.includes('d3-') ||
                  id.includes('@types/react')
                ) {
                  return 'react-vendor';
                }
                // All other vendor libraries (truly non-React dependencies like build tools, etc.)
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
