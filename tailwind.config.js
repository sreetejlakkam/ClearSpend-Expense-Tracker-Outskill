/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F6F8FC', // BudgetBakers-style soft airy financial canvas
        'background-dark': '#0B0F19', // Deep OLED obsidian
        foreground: '#0F172A',
        'foreground-dark': '#F8FAFC',
        surface: '#FFFFFF',
        'surface-dark': '#111827',
        'card-dark': '#1E293B',

        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA', // Primary Royal Indigo
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        expense: {
          light: '#FFE4E6',
          DEFAULT: '#F43F5E',
          dark: '#9F1239',
        },
        income: {
          light: '#DCFCE7',
          DEFAULT: '#10B981',
          dark: '#065F46',
        },
        accent: {
          blue: '#2563EB',
          indigo: '#4F46E5',
          violet: '#7C3AED',
          amber: '#F59E0B',
          emerald: '#10B981',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px -1px rgba(15, 23, 42, 0.04), 0 1px 3px -1px rgba(15, 23, 42, 0.02)',
        'card-hover': '0 8px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'modal': '0 25px 35px -5px rgba(15, 23, 42, 0.15), 0 10px 15px -5px rgba(15, 23, 42, 0.08)',
        'sticky-bar': '0 -4px 20px -2px rgba(15, 23, 42, 0.06)',
        'glow-brand': '0 4px 16px -2px rgba(79, 70, 229, 0.3)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}

