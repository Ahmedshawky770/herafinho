import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

export default {
  content: ['./src/**/*.{ts,tsx}', './src/app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        secondary: {
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        arabic: ['var(--font-arabic)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.rtl-flip': {
          transform: 'scaleX(-1)',
        },
        '.text-balance': {
          textWrap: 'balance',
        },
      });
    }),
  ],
} satisfies Config;