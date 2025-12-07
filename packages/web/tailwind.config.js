/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        fontSize: {
            xs: ['0.65rem', { lineHeight: '1rem' }],
            sm: ['0.75rem', { lineHeight: '1.25rem' }],
            base: ['0.875rem', { lineHeight: '1.5rem' }],
            lg: ['1rem', { lineHeight: '1.75rem' }],
            xl: ['1.125rem', { lineHeight: '1.75rem' }],
            '2xl': ['1.25rem', { lineHeight: '2rem' }],
            '3xl': ['1.5rem', { lineHeight: '2.25rem' }],
            '4xl': ['1.75rem', { lineHeight: '2.5rem' }],
        },
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
                secondary: {
                    50: '#faf5ff',
                    100: '#f3e8ff',
                    200: '#e9d5ff',
                    300: '#d8b4fe',
                    400: '#c084fc',
                    500: '#a855f7',
                    600: '#9333ea',
                    700: '#7e22ce',
                    800: '#6b21a8',
                    900: '#581c87',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['Fira Code', 'monospace'],
            },
        },
    },
    plugins: [],
}
