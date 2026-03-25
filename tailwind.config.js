/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#091018",
        mist: "#f4f7fb",
        tide: "#0c8ea8",
        pine: "#198754",
      },
      boxShadow: {
        float: "0 14px 40px rgba(4, 22, 38, 0.18)",
      },
    },
  },
  plugins: [],
};
