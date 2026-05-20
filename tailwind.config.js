/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-bg-canvas)',
        panel: 'var(--color-bg-panel)',
        panelHover: 'var(--color-bg-panel-hover)',
        panelSelect: 'var(--color-bg-panel-select)',
      },
    },
  },
  plugins: [],
}

