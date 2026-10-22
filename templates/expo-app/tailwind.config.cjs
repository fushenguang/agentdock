/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f8f9fb',
        surface: '#ffffff',
        surfaceWarm: '#fffaf3',
        surfaceRaise: '#fffdf9',
        ink: '#1a1d23',
        inkSoft: '#3d4350',
        muted: '#6b7280',
        line: '#e0e2e7',
        lineWarm: '#ecdcc3',
        accent: '#d98d2d',
        accentDark: '#b8731f',
        accentSoft: '#fbf1e3',
        attention: '#c76a35',
        success: '#2f7d54',
        warning: '#c79a2f',
        danger: '#bd4535',
        violet: '#8b5cf6',
        sky: '#3b82f6',
      },
    },
  },
  plugins: [],
}
