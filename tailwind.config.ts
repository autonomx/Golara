import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rosewood: '#6f2438',
        blush: '#f8e8ec',
        cream: '#fff8f1',
        olive: '#6a7052'
      },
      fontFamily: {
        display: ['Georgia', 'serif']
      }
    }
  },
  plugins: []
};

export default config;
