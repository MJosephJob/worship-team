/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight:        'var(--color-midnight)',
        gold:            'var(--color-gold)',
        'gold-light':    'var(--color-gold-light)',
        cream:           'var(--color-cream)',
        'cream-muted':   'var(--color-cream-muted)',
        surface:         'var(--color-surface)',
        'surface-raised':'var(--color-surface-raised)',
        border:          'var(--color-border)',
        success: '#4caf82',
        warning: '#e8a84c',
        danger:  '#e85c5c',
        info:    '#4c8ce8',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"Lato"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.4)',
        'gold-glow': '0 0 20px rgba(201,168,76,0.4)',
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s infinite',
        'gold-glow': 'goldGlow 0.6s ease-out',
        'spin-gold': 'spin 1s linear infinite',
        'confetti-fall': 'confettiFall 1s ease-out',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(201,168,76,0)' },
        },
        goldGlow: {
          '0%': { boxShadow: '0 0 0 0 rgba(201,168,76,0.8)' },
          '100%': { boxShadow: '0 0 24px rgba(201,168,76,0)' },
        },
        confettiFall: {
          '0%': { transform: 'translateY(-20px)', opacity: '1' },
          '100%': { transform: 'translateY(40px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
