/** @type {import('tailwindcss').Config} */
export default {
  content: ["./examples/**/*.{html,scale}", "./src/**/*.{ts,js, scale}"],
  theme: { extend: {} },
  safelist: [], // we’ll patch this at runtime if needed
}

