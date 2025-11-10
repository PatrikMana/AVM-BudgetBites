# 🎨 Color Management Guide - Budget Bites

## Quick Reference

### Where to Find Colors

| Component | File | Lines |
|-----------|------|-------|
| **Login Page** | `src/pages/Login.tsx` | 14-47 (LOGIN_COLORS object) |
| **Sidebar** | `src/components/SideBar.tsx` | 17-21 (SIDEBAR_COLORS object) |
| **Global Theme** | `tailwind.config.js` | 6-40 |
| **CSS Variables** | `src/index.css` | 6-184 |

---

## 🚀 How to Change Colors

### Method 1: Change in Tailwind Config (Recommended)
**Best for:** Changing actual color values (hex codes)

**File:** `/frontend/tailwind.config.js`

```javascript
colors: {
    brand: {
        primary: '#B19EEF',      // ← Change this hex code
        secondary: '#5227FF',    // ← Change this hex code
        accent: '#ff6b6b',       // ← Change this hex code
    },
    login: {
        background: '#0a0a0a',   // ← Change this hex code
        // ... etc
    }
}
```

**Effect:** Changes the color everywhere that uses this theme color.

---

### Method 2: Change in Component Config
**Best for:** Swapping between existing theme colors

#### For Login Page:
**File:** `/frontend/src/pages/Login.tsx` (lines 14-47)

```typescript
const LOGIN_COLORS = {
    primaryButton: 'bg-brand-primary',  // ← Change to 'bg-brand-secondary'
    // ... etc
}
```

#### For Sidebar:
**File:** `/frontend/src/components/SideBar.tsx` (lines 17-21)

```typescript
const SIDEBAR_COLORS = {
    buttonClosed: '#B19EEF',  // ← Change this hex code
    // ... etc
}
```

---

## 📋 Current Color Palette

### Brand Colors (Used Everywhere)
```
Primary:   #B19EEF (Purple)
Secondary: #5227FF (Deep Purple)
Accent:    #ff6b6b (Red)
```

### Login Page Specific
```
Background:    #0a0a0a (Near Black)
Card:          #1a1a1a (Dark Gray)
Input BG:      #2a2a2a (Medium Gray)
Text:          #ffffff (White)
Text Muted:    #a0a0a0 (Gray)
Success:       #10b981 (Green)
Error:         #ef4444 (Red)
```

### Sidebar Specific
```
Button Closed: #B19EEF (Purple)
Button Open:   #ffffff (White)
Panel Layers:  #B19EEF, #5227FF (Purple gradient)
Accent:        #B19EEF (Purple)
```

---

## 🔍 Finding All Colors in Your Project

Run this in your terminal from the frontend folder:

```bash
# Find all hex color codes
grep -r "#[0-9A-Fa-f]\{6\}" src/

# Find color class usage
grep -r "bg-\|text-\|border-" src/ | grep className
```

---

## 💡 Best Practices

1. ✅ **Always define colors in `tailwind.config.js` first**
2. ✅ **Use the component config objects (LOGIN_COLORS, SIDEBAR_COLORS)**
3. ✅ **Use semantic names** (e.g., `primaryButton` not `purpleButton`)
4. ✅ **Document your changes** with comments
5. ❌ **Avoid hardcoding colors directly in JSX**

---

## 🎯 Common Tasks

### Change Login Button Color
1. Open `tailwind.config.js`
2. Find `brand.primary: '#B19EEF'`
3. Change to your desired color
4. Save - all login buttons update automatically!

### Change Sidebar Panel Color
1. Open `src/components/SideBar.tsx`
2. Find `SIDEBAR_COLORS.panelLayers`
3. Change the hex codes in the array
4. Save - sidebar updates immediately!

### Add a New Color
1. Open `tailwind.config.js`
2. Add to `theme.extend.colors`:
```javascript
myNewColor: {
    light: '#abc123',
    dark: '#def456',
}
```
3. Use in components: `className="bg-myNewColor-light"`

---

## 📖 Examples

### Example 1: Change to Blue Theme
```javascript
// In tailwind.config.js
brand: {
    primary: '#3b82f6',      // Blue
    secondary: '#1e40af',    // Dark Blue
    accent: '#60a5fa',       // Light Blue
}
```

### Example 2: Change to Green Theme
```javascript
// In tailwind.config.js
brand: {
    primary: '#10b981',      // Green
    secondary: '#047857',    // Dark Green
    accent: '#34d399',       // Light Green
}
```

---

## 🆘 Troubleshooting

**Q: I changed the color but nothing happened?**
- Make sure you saved the file
- Restart the dev server: `npm run dev`
- Check browser cache (hard refresh: Cmd+Shift+R)

**Q: Color only changed in some places?**
- That component might have a hardcoded color
- Search for the old hex code: `grep -r "#OLD_COLOR" src/`

**Q: Want to use a custom color just once?**
- Use Tailwind's arbitrary values: `className="bg-[#abc123]"`

---

Need help? Check:
- Tailwind docs: https://tailwindcss.com/docs/customizing-colors
- This project's tailwind.config.js for all available colors
