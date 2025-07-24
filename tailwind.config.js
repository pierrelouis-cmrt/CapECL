/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./1A/**/*.html",
    "./2A/**/*.html",
    "./ressources/**/*.html",
    "./src/**/*.js",
    "./scripts/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        paper: "#fcfcfc",
        ink: "#222222",
        "ink-light": "#555555",
        stroke: "#dedede",
        surface: "#f5f5f5",
        hint: "#888888",
        "centrale-red": "#b22133",
        "centrale-beige": "#f7f4f1",
      },
      spacing: {
        grid: "4px",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.77, 0, 0.175, 1)",
      },
    },
  },
  plugins: [],
};
