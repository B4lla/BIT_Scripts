tailwind.config = {
  content: [
    "./index.html",
    "./app.js",
    "./apps/**/*.{html,js}",
    "./components/**/*.js",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'system': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'display': ['Playfair Display', 'serif'],
        'handwriting': ['Dancing Script', 'cursive'],
        'modern': ['Poppins', 'sans-serif'],
      },
      colors: {
        'accent': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        'phone': {
          'background': '#000000',
          'surface': '#1c1c1e',
          'border': '#38383a',
        }
      },
      borderRadius: {
        'phone': '12px',
        'ios': '20px',
      },
      spacing: {
        'safe-top': '47px',
        'safe-bottom': '34px',
      },
      animation: {
        'phone-transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-gentle': 'bounce 1s ease-in-out 2',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      backdropBlur: {
        'ios': '40px',
      }
    },
  },
  plugins: [],
}