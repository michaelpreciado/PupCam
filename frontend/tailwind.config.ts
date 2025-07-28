import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glassHigh: 'rgba(255,255,255,0.12)',
        glassLow: 'rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
};

export default config; 