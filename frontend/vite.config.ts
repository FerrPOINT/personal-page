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
              // Vendor chunks
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                if (id.includes('@react-three/fiber') || id.includes('@react-three/drei')) {
                  return 'three-vendor';
                }
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
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
