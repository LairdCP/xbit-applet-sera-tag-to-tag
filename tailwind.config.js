/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,vue,html}'
  ],
  theme: {
    extend: {
      colors: {
        'canvas-slate-500': '#728295',
        'canvas-slate-600': '#485462',
        'canvas-slate-700': '#313a44',
        'canvas-slate-800': '#2B3136',
        'canvas-gray-500': '#707070',
        'canvas-pink-300': '#B845E3',
        'canvas-sky-300': '#7DB7FF',
        'canvas-sky-500': '#5797F7',
        'canvas-sky-700': '#1870EF',
      }
    }
  },
  plugins: []
}
