import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:       '#0a0a0a',
        surface:  '#141414',
        elevated: '#1e1e1e',
        border:   '#2a2a2a',
        tx:       '#f0f0f0',      // text primary
        ts:       '#a0a0a0',      // text secondary
        tm:       '#606060',      // text muted
        accent:   '#6366f1',
        'accent-light': '#818cf8',
        health:   '#22c55e',
        meals:    '#f97316',
        budget:   '#3b82f6',
        books:    '#a855f7',
        todos:    '#eab308',
        ok:       '#22c55e',
        warn:     '#f59e0b',
        danger:   '#ef4444',
        // Oura
        'oura-optimal': '#22c55e',
        'oura-good':    '#84cc16',
        'oura-fair':    '#f59e0b',
        'oura-poor':    '#ef4444',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
