/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f7f7f4',
        surface: '#ffffff',
        ink: '#17211d',
        muted: '#69746f',
        line: '#e2e5e0',
        accent: '#4f7c5b',
        attention: '#c76a35',
        success: '#2f7d54',
        warning: '#c79a2f',
        danger: '#bd4535',
      },
    },
  },
  plugins: [],
}
