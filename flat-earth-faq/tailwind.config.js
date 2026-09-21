/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep-space backdrop, from near-black to the panel surfaces that sit on it.
        void: {
          900: '#04060d',
          800: '#070b16',
          700: '#0b1120',
          600: '#0f172a',
          500: '#141e33',
        },
        // Cool slate blues used for borders, dividers and secondary text.
        steel: {
          700: '#1b2540',
          600: '#26334f',
          500: '#3b4a6b',
          400: '#64748b',
          300: '#94a3b8',
          200: '#cbd5e1',
        },
        // Warm accent: the sun, the highlight, the primary call to action.
        gold: {
          400: '#fbd074',
          500: '#f5c451',
          600: '#e0a828',
          700: '#b3821a',
        },
        // Cool accent: light rays, water, the "observed" side of a comparison.
        glow: {
          300: '#7ceaff',
          400: '#38e0ff',
          500: '#0ec2e8',
          600: '#0a97b5',
        },
        ice: '#d8f3ff',
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Sora', 'Inter var', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(56,224,255,0.20), 0 0 32px -6px rgba(56,224,255,0.35)',
        sun: '0 0 0 1px rgba(245,196,81,0.22), 0 0 40px -6px rgba(245,196,81,0.45)',
        panel: '0 18px 50px -20px rgba(0,0,0,0.85)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px)',
        'radial-hero':
          'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(56,224,255,0.16), transparent 62%), radial-gradient(ellipse 60% 45% at 80% 15%, rgba(245,196,81,0.10), transparent 60%)',
      },
      backgroundSize: {
        grid: '44px 44px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        drift: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '0.9' },
        },
        'dash-run': {
          to: { strokeDashoffset: '-120' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'pulse-soft': 'pulse-soft 3.5s ease-in-out infinite',
        drift: 'drift 6s ease-in-out infinite',
        twinkle: 'twinkle 4s ease-in-out infinite',
        'dash-run': 'dash-run 3s linear infinite',
      },
    },
  },
  plugins: [],
};
