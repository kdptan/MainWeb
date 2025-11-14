/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        // Cute and clean fonts
        'display': ['Poppins', 'sans-serif'],      // Main headings - Bold and modern
        'heading': ['Quicksand', 'sans-serif'],     // Section headings - Soft and friendly
        'body': ['Comfortaa', 'sans-serif'],        // Body text - Rounded and comfortable
        'sans': ['Poppins', 'sans-serif'],          // Default fallback
      },
      colors: {
        // Primary - Main background (from logo)
        primary: {
          DEFAULT: '#98745e',    // Beaver (medium brown)
          dark: '#81522c',       // Nutmeg (darker brown)
          darker: '#552a10',     // Jambalaya adjusted - DOMINANT BACKGROUND
          darkest: '#542a10',    // Jambalaya original
        },
        // Secondary - Accent browns/oranges (from logo)
        secondary: {
          DEFAULT: '#b37544',    // Cape Palliser (warm brown)
          light: '#db5b60',      // Roman (coral/rose accent)
          lighter: '#ffc162',    // Koromiko (bright golden)
        },
        // Accent - Light tones (from logo)
        accent: {
          cream: '#fef0e8',      // Bridesmaid (lightest cream)
          peach: '#e9c0a8',      // Zinnwaldite (peachy beige)
          tan: '#98745e',        // Beaver (medium tan)
          brown: '#81522c',      // Nutmeg (medium brown)
        },
        // Brand colors with descriptive names
        brand: {
          coral: '#db5b60',      // Roman - coral accent
          cream: '#fef0e8',      // Bridesmaid
          chocolate: '#542a10',  // Jambalaya - deep brown
          gold: '#ffc162',       // Koromiko
          rust: '#b37544',       // Cape Palliser
          sand: '#e9c0a8',       // Zinnwaldite
          mocha: '#98745e',      // Beaver
          coffee: '#81522c',     // Nutmeg
        }
      },
    },
  },
  plugins: [],
}
