/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#131313',
        surface: '#131313',
        'surface-container-lowest': '#0e0e0e',
        'surface-container-low': '#1b1b1c',
        'surface-container': '#202020',
        'surface-container-high': '#2a2a2a',
        'surface-container-highest': '#353535',
        primary: '#67d7dd',
        'primary-container': '#1da0a6',
        'on-primary': '#003739',
        'on-primary-container': '#002f31',
        'on-surface': '#e5e2e1',
        'on-surface-variant': '#bcc9c9',
        'outline-variant': '#3d494a',
        success: '#4edea3',
        error: '#ffb4ab',
        warning: '#ffb689',
      },
      fontFamily: {
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
