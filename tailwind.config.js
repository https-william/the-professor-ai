
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                void: '#050505', // Deep Void
                surface: '#0A0A0C', // Panel Surface
                core: '#050505',

                // Primary Accent: Neon Cyan
                cyan: {
                    400: '#00F0FF',
                    500: '#00D0DF',
                    900: '#004044',
                },

                // Secondary Accent: Antique Gold
                amber: {
                    400: '#D4B06A',
                    500: '#C5A059',
                    600: '#B08D45',
                },

                // Text
                text: {
                    pri: '#FFFFFF',
                    sec: '#A1A1AA',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Cinzel', 'serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'spin-slow': 'spin 20s linear infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'slide-up-fade': 'slideUpFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                slideUpFade: {
                    '0%': { opacity: 0, transform: 'translateY(20px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
