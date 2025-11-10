/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                // Brand colors - centralized here!
                brand: {
                    primary: '#B19EEF',      // Purple - main brand color
                    secondary: '#5227FF',    // Deep purple
                    accent: '#ff6b6b',       // Red accent
                },
                // Sidebar colors
                sidebar: {
                    button: '#B19EEF',       // Button closed state
                    buttonOpen: '#ffffff',   // Button open state
                    panel: '#000000',        // Panel background
                    text: '#ffffff',         // Text color
                    hover: '#B19EEF',        // Hover accent
                },
                // Login page colors
                login: {
                    background: '#0a0a0a',   // Page background
                    cardBg: '#1a1a1a',       // Card background
                    cardBorder: '#2a2a2a',   // Card border
                    primary: '#B19EEF',      // Primary brand color (buttons, accents)
                    primaryHover: '#9B7EDF', // Primary hover state
                    inputBg: '#2a2a2a',      // Input background
                    inputBorder: '#3a3a3a',  // Input border
                    text: '#ffffff',         // Primary text
                    textMuted: '#a0a0a0',    // Muted text
                    success: '#10b981',      // Success messages
                    error: '#ef4444',        // Error messages
                }
            }
        }
    },
    plugins: [],
}
