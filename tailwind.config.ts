import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        panel: '#0f172a',
        panelSoft: '#111827',
        accent: '#f59e0b',
      },
      boxShadow: {
        soft: '0 12px 40px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
}

export default config
