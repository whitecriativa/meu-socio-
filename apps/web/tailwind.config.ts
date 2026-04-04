import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:  '#0F40CB',
          accent:   '#B6F273',
          cloud:    '#B8DFFB',
          ivory:    '#F6F6ED',
          charcoal: '#161921',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
