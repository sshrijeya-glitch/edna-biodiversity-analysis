/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep scientific navy / blue-green base
        abyss: '#04141C',   // deepest — landing background, sidebar
        hull: '#0A2230',    // dark panels
        trench: '#0E2E3E',  // raised dark surface
        line: '#16455A',    // hairline on dark

        // Blue-green accents (restrained, never neon)
        teal: '#2FA98F',    // primary action
        kelp: '#4FC3A1',    // secondary / positive
        seafoam: '#7FD4C1', // chart series, soft highlight

        // Signals
        amber: '#D99A4E',   // caution / unclassified
        rust: '#B5483C',    // error / rejected

        // Light surfaces
        mist: '#F1F5F6',    // app background
        paper: '#FFFFFF',   // cards
        ink: '#0A2230',     // body text on light
        muted: '#5F7C8A',   // secondary text
        hair: '#DDE6E9',    // hairline on light
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
      borderRadius: { xl2: '1.25rem' },
      keyframes: {
        drift: { '0%': { transform: 'translateY(0)' }, '100%': { transform: 'translateY(-40px)' } },
        fadeUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        pulseSoft: { '0%,100%': { opacity: 0.35 }, '50%': { opacity: 1 } },
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
