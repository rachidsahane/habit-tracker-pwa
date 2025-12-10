/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'primary': '#13ec5b',
                'background-light': '#f6f8f6',
                'background-dark': '#102216',
                'content-light': '#f8fcf9',
                'content-dark': '#1a2c20',
                'text-light-primary': '#0d1b12',
                'text-dark-primary': '#e6f5e9',
                'text-light-secondary': '#4c9a66',
                'text-dark-secondary': '#a2d8b5',
                'border-light': '#cfe7d7',
                'border-dark': '#2d543b',
                'danger': '#ef4444',
            },
            fontFamily: {
                'display': ['Manrope', 'sans-serif'],
            },
            borderRadius: {
                'DEFAULT': '0.5rem',
                'lg': '0.75rem',
                'xl': '1rem',
                'full': '9999px',
            },
        },
    },
    plugins: [],
}
