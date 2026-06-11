/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'f1-red': '#E10600',
        'f1-black': 'var(--f1-black)',
        'f1-dark': 'var(--f1-dark)',
        'f1-gray': 'var(--f1-gray)',
        'f1-card': 'var(--f1-card)',
        'f1-green': 'var(--f1-green)',
        'f1-white': 'var(--f1-white)',
        'f1-light': 'var(--f1-light)',
        'f1-surface': 'var(--f1-surface)',
        'f1-border': 'var(--f1-border)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
}
