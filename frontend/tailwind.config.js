/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'] },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(10px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'slide-in': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        sweep: { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out both',
        'slide-in': 'slide-in 0.3s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.25s ease-out both',
        sweep: 'sweep 2s linear infinite',
      },
    },
  },
  plugins: [],
};
