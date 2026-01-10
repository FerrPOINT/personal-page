/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "#121212",
        primary: "#f0f0f0",
        secondary: "#888888",
        accent: {
          cyan: "#00d9ff",
          magenta: "#ff00ff",
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
      }
    },
  },
  plugins: [],
}

