/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12345B',
        slate: '#536B84',
        paper: '#F4F8FC',
        line: '#D8E3EF',
        brass: '#D6A84F',
        moss: '#14866D',
        rust: '#C34F5A',
        navy: '#12345B',
        royal: '#1E5AA8',
        sky: '#E8F2FF',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
