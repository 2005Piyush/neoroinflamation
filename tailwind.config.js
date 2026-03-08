/** @type {import('tailwindcss').Config} */
export default { 
  content: [
    "./index.html", 
    "./src/**/*.{js,ts,jsx,tsx}", 
], 
  theme: { 
    extend: { 
      fontFamily: { 
        sans: ['Inter', 'sans-serif'], 
 }, 
      colors: { 
        brand: { 
          blue: '#0B132B', 
          purple: '#1C2541', 
          cyan: '#3A506B', 
          accent: '#5BC0BE', 
          light: '#6FFFE9', 
 } 
 } 
 }, 
 }, 
  plugins: [], 
 } 

