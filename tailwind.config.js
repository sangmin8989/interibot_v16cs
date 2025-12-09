/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#8B5CF6',
          'purple-light': '#A78BFA',
          'purple-dark': '#7C3AED',
        },
        purple: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6', // 브랜드 컬러
          600: '#8B5CF6', // 브랜드 컬러 (오버라이드)
          700: '#7C3AED',
          800: '#6D28D9',
          900: '#5B21B6',
        },
        primary: {
          DEFAULT: '#2D5BFF',
          50: '#E8EDFF',
          100: '#D1DBFF',
          200: '#A3B7FF',
          300: '#7593FF',
          400: '#476FFF',
          500: '#2D5BFF',
          600: '#1A3FCC',
          700: '#0F2A99',
          800: '#081566',
          900: '#040A33',
        },
        argen: {
          50: '#F6E6E1',
          100: '#EFD6CF',
          200: '#E7C1B8',
          300: '#DFA9A0',
          400: '#D5948D',
          500: '#CC807A',
          600: '#B76F69',
          700: '#9C5C58',
          800: '#814A48',
          900: '#6A3B3A',
        },
        roseSoft: '#F7D5D0',
        roseDeep: '#B64F52',
        goldAccent: '#E7C59A',
        neutral: {
          50: '#F8F8F8',
          100: '#F2F2F2',
          200: '#E6E6E6',
          300: '#D1D1D1',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#7A7A7A',
          700: '#555555',
          800: '#333333',
          900: '#111111',
        },
      },
      fontFamily: {
        pretendard: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'Helvetica Neue',
          'Segoe UI',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'Malgun Gothic',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}



