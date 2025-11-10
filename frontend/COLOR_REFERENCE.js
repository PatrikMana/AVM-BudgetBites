/* 
 * 🎨 COLOR REFERENCE - Budget Bites
 * Copy this file to quickly see all your project colors
 */

// ============================================
// BRAND COLORS (Global - Used Everywhere)
// ============================================
const BRAND_COLORS = {
  primary: '#B19EEF',      // Purple - Main brand color
  secondary: '#5227FF',    // Deep purple - Secondary brand
  accent: '#ff6b6b',       // Red - Accent highlights
};

// ============================================
// LOGIN PAGE COLORS
// ============================================
const LOGIN_THEME = {
  // Backgrounds
  pageBackground: '#0a0a0a',   // Near black
  cardBackground: '#1a1a1a',   // Dark gray
  cardBorder: '#2a2a2a',       // Medium gray
  
  // Inputs
  inputBg: '#2a2a2a',          // Medium gray
  inputBorder: '#3a3a3a',      // Lighter gray
  
  // Text
  text: '#ffffff',             // White
  textMuted: '#a0a0a0',        // Gray
  
  // Buttons
  primaryButton: '#B19EEF',    // Purple (uses brand.primary)
  primaryHover: '#9B7EDF',     // Lighter purple
  
  // States
  success: '#10b981',          // Green
  error: '#ef4444',            // Red
};

// ============================================
// SIDEBAR COLORS
// ============================================
const SIDEBAR_THEME = {
  buttonClosed: '#B19EEF',     // Purple when closed
  buttonOpen: '#ffffff',       // White when open
  panelLayer1: '#B19EEF',      // Purple gradient layer 1
  panelLayer2: '#5227FF',      // Purple gradient layer 2
  accent: '#B19EEF',           // Purple hover/accent
  panel: '#000000',            // Black panel background
  text: '#ffffff',             // White text
};

// ============================================
// HOW TO USE THIS REFERENCE
// ============================================
/*

1. FIND THE COLOR YOU WANT TO CHANGE
   - Look in the sections above
   - Note the hex code (e.g., #B19EEF)

2. CHANGE IT IN TAILWIND.CONFIG.JS
   - Open: /frontend/tailwind.config.js
   - Find the matching color name
   - Replace the hex code
   - Save the file

3. SEE YOUR CHANGES
   - Your dev server will hot-reload
   - All components using that color update automatically!

EXAMPLE:
Want to change the primary brand color from purple to blue?
1. Note: BRAND_COLORS.primary = '#B19EEF'
2. Open tailwind.config.js
3. Find: brand.primary: '#B19EEF'
4. Change to: brand.primary: '#3b82f6'
5. Save - done! All purple becomes blue.

*/

// ============================================
// QUICK COLOR SWAPS
// ============================================

// Blue Theme
const BLUE_THEME = {
  primary: '#3b82f6',
  secondary: '#1e40af',
  accent: '#60a5fa',
};

// Green Theme
const GREEN_THEME = {
  primary: '#10b981',
  secondary: '#047857',
  accent: '#34d399',
};

// Red Theme
const RED_THEME = {
  primary: '#ef4444',
  secondary: '#b91c1c',
  accent: '#f87171',
};

// Orange Theme
const ORANGE_THEME = {
  primary: '#f97316',
  secondary: '#c2410c',
  accent: '#fb923c',
};

// Pink Theme
const PINK_THEME = {
  primary: '#ec4899',
  secondary: '#be185d',
  accent: '#f472b6',
};

/*
To use a theme:
1. Copy the three hex codes from your chosen theme
2. Paste them into tailwind.config.js brand section
3. Save and refresh!
*/
