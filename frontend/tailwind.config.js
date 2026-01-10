/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Используем class-based dark mode для гибкости
  theme: {
    extend: {
      colors: {
        // Современная система цветов с поддержкой opacity через Tailwind
        background: {
          DEFAULT: '#0a0a0a',
          pure: '#0a0a0a',
        },
        surface: {
          DEFAULT: '#121212',
          pure: '#121212',
        },
        primary: {
          DEFAULT: '#f0f0f0',
          pure: '#f0f0f0',
        },
        secondary: {
          DEFAULT: '#888888',
          pure: '#888888',
        },
        accent: {
          cyan: {
            DEFAULT: '#00d9ff',
            pure: '#00d9ff',
            light: '#33e0ff',
            dark: '#00b8d9',
          },
          magenta: {
            DEFAULT: '#ff00ff',
            pure: '#ff00ff',
            light: '#ff33ff',
            dark: '#cc00cc',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      // Современные тени и эффекты
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 217, 255, 0.3)',
        'glow-magenta': '0 0 20px rgba(255, 0, 255, 0.3)',
        'glow-cyan-lg': '0 0 40px rgba(0, 217, 255, 0.5)',
        'glow-magenta-lg': '0 0 40px rgba(255, 0, 255, 0.5)',
      },
      // Современные переходы
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      // Поддержка backdrop blur
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
  // Оптимизация для production
  corePlugins: {
    // Отключаем неиспользуемые плагины для уменьшения размера
    preflight: true,
  },
}

