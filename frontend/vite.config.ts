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
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'three-vendor': ['@react-three/fiber', '@react-three/drei'],
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
