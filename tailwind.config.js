/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#FFE66D',
        background: '#FEF3C7',
        foreground: '#1A1A2E',
        card: '#FFFFFF',
        destructive: '#FF4757',
        success: '#2ECC71',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #1A1A2E',
        'brutal-lg': '6px 6px 0px 0px #1A1A2E',
        'brutal-sm': '2px 2px 0px 0px #1A1A2E',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
}
