/** @type {import('tailwindcss').Config} */
content: [
  './index.html',
  './*.{js,jsx}',
  './components/**/*.{js,jsx}',
  './pages/**/*.{js,jsx}',
  './hooks/**/*.{js,jsx}',
  './lib/**/*.{js,jsx}',
],
  theme: {
    extend: {
      colors: {
        abyss: '#04141C',
        hull: '#0A2230',
        trench: '#0E2E3E',
        line: '#16455A',

        teal: '#2FA98F',
        kelp: '#4FC3A1',
        seafoam: '#7FD4C1',

        amber: '#D99A4E',
        rust: '#B5483C',

        mist: '#F1F5F6',
        paper: '#FFFFFF',
        ink: '#0A2230',
        muted: '#5F7C8A',
        hair: '#DDE6E9',
      },

      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },

      boxShadow: {
        card: '0 1px 2px rgba(10,34,48,0.04), 0 8px 24px -12px rgba(10,34,48,0.18)',
        lift: '0 2px 4px rgba(10,34,48,0.05), 0 16px 40px -16px rgba(10,34,48,0.28)',
      },

      borderRadius: {
        xl2: '1.25rem',
      },

      keyframes: {
        drift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-40px)' },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'none' },
        },
        pulseSoft: {
          '0%,100%': { opacity: 0.35 },
          '50%': { opacity: 1 },
        },
      },

      animation: {
        drift: 'drift 22s linear infinite alternate',
        fadeUp: 'fadeUp .4s ease-out both',
        pulseSoft: 'pulseSoft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
