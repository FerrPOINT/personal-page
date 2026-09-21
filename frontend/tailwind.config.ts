import type { Config } from 'tailwindcss';
import { themeCssColor, themeCssTriplet } from './src/theme/palettes';

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Используем class-based dark mode для гибкости
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: themeCssColor('background'),
          pure: themeCssColor('background'),
        },
        surface: {
          DEFAULT: themeCssColor('surface'),
          pure: themeCssColor('surface'),
        },
        primary: {
          DEFAULT: themeCssColor('textPrimary'),
          pure: themeCssColor('textPrimary'),
        },
        secondary: {
          DEFAULT: themeCssColor('textSecondary'),
          pure: themeCssColor('textSecondary'),
        },
        accent: {
          primary: {
            DEFAULT: themeCssColor('accentPrimary'),
            pure: themeCssColor('accentPrimary'),
            light: themeCssColor('accentPrimaryLight'),
            dark: themeCssColor('accentPrimaryDark'),
          },
          secondary: {
            DEFAULT: themeCssColor('accentSecondary'),
            pure: themeCssColor('accentSecondary'),
            light: themeCssColor('accentSecondaryLight'),
            dark: themeCssColor('accentSecondaryDark'),
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
      boxShadow: {
        'glow-primary': `0 0 20px rgb(${themeCssTriplet('accentPrimary')} / 0.3)`,
        'glow-secondary': `0 0 20px rgb(${themeCssTriplet('accentSecondary')} / 0.3)`,
        'glow-primary-lg': `0 0 40px rgb(${themeCssTriplet('accentPrimary')} / 0.5)`,
        'glow-secondary-lg': `0 0 40px rgb(${themeCssTriplet('accentSecondary')} / 0.5)`,
      },
      dropShadow: {
        'accent-primary': `0 0 8px rgb(${themeCssTriplet('accentPrimary')} / 0.75)`,
        'accent-secondary': `0 0 10px rgb(${themeCssTriplet('accentSecondary')} / 0.45)`,
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
};

export default config;

