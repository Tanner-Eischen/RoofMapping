import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f1f5f3',
          100: '#e3ebe6',
          200: '#c8d7cd',
          300: '#aac1b1',
          400: '#8dab97',
          500: '#6f967d',
          600: '#597864',
          700: '#445b4b',
          800: '#2f3d33',
          900: '#1a201c',
        },
      },
    },
  },
  plugins: [],
};

export default config;