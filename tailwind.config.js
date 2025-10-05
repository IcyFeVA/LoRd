/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#a855f7",
        "primary-hover": "#9333ea",
        secondary: "#d8b4fe",
      },
      borderRadius: {
        container: "0.75rem",
      },
      spacing: {
        section: "2rem",
      },
    },
  },
  plugins: [],
};
