/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'f1-red':    'rgb(var(--f1-red-rgb) / <alpha-value>)',
        'f1-black':  'var(--f1-black)',
        'f1-dark':   'var(--f1-dark)',
        'f1-gray':   'var(--f1-gray)',
        'f1-card':   'var(--f1-card)',
        'f1-card-hover': 'var(--f1-card-hover)',
        'f1-darker': 'var(--f1-darker)',
        'f1-green':  'var(--f1-green)',
        'f1-white':  'var(--f1-white)',
        'f1-body':   'var(--f1-body)',
        'f1-light':  'var(--f1-light)',
        'f1-surface':'var(--f1-surface)',
        'f1-border': 'var(--f1-border)',
        // BMW M tricolor — accessible as bg-m-blue-light / text-m-red etc.
        'm-blue-light': '#0066b1',
        'm-blue-dark':  '#1c69d4',
        'm-red':        '#e22718',
      },
      borderRadius: {
        'r-xs': '4px',
        'r-sm': '6px',
        'r-md': '8px',
        'r-lg': '12px',
        'r-xl': '16px',
      },
      fontFamily: {
        'f1':  ['Cormorant Garamond', 'EB Garamond', 'Georgia', 'serif'],
        'body': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      // App toggles `.light` on <html> for light mode; default (no class) = dark.
      addVariant('light', ':where(:root.light) &')
    },
  ],
}
