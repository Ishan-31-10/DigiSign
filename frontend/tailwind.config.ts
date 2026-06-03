import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          200: '#bdd1ff',
          300: '#90b1ff',
          400: '#5e87ff',
          500: '#3a63f5',
          600: '#2a48d6',
          700: '#2238ad',
          800: '#1f3289',
          900: '#1d2d6e',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.04)',
        soft: '0 10px 30px -10px rgba(58,99,245,0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
