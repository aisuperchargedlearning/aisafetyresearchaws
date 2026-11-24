/** @type {import('tailwindcss').Config} */
const channel = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        layer: {
          gateway: channel('layer-gateway'),
          coordination: channel('layer-coordination'),
          model: channel('layer-model'),
        },
        field: {
          DEFAULT: channel('field'),
          raised: channel('field-raised'),
        },
        ink: {
          DEFAULT: channel('ink'),
          muted: channel('ink-muted'),
          faint: channel('ink-faint'),
        },
        line: channel('line'),
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        quiet: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [],
};
