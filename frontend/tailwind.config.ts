import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    "extend": {
      "colors": {
        "stw_orange": "#f5a623",
        "stw_blue": "#4ab5e2",
        "stw_green": "#7ed321"
      },
      "screens": {
        'smallPhone': {'raw': '(max-height: 700px)'},
        'tooSmall': {'raw': '((max-height: 400px) and (max-width: 400px))'},
      }
    }

  },
  plugins: [],
}
export default config
