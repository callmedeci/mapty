/** @type {import('tailwindcss').Config} */
export default {
  content: [
    '*.html',
    'src/**/*.js',
  ],
  theme: {
    extend: {
      backgroundColor: {
        'dark-zinc': '#2d3439',
        'light-zinc': '#42484d',
        'medium-zinc': '#353b40',
        'zinc-ee': '#d6dee0',
        'light': '#aaa',

      },
      fontSize: {
        'form-label': ['0.8rem ', { fontWeight: 650 }],
        'stickers': '1.25rem',
      },

      borderColor: {
        'green': '#00c46a',
        'orange': '#ffb545',
      },

      textColor: {
        'light': '#aaa',
        'green': '#00c46a',
        'orange': '#ffb545',
        'dark-zinc': '#2d3439',
        'light-zinc': '#42484d',
        'zinc-ee': '#d6dee0',
      },
      fontFamily: {
        'nerd-light': 'nerd-light',
        'nerd-medium': 'nerd-medium',
        'nerd-bold': 'nerd-bold',
        'gotham-book': 'gotham',
      },
      boxShadowColor: {
        'dark-zinc': '#2d3439',
        'light-zinc': '#42484d',
        'zinc-ee': '#d6dee0',
      }
    },
  },
  plugins: [],
}

