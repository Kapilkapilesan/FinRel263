# FinCore Theme System

## Overview

The FinCore theme system uses a **single source of truth** approach where all colors are defined in `themes/colors.ts` and referenced throughout the application.

## File Structure

```
fincore-app/
├── themes/
│   └── colors.ts          # 🎨 Single source of truth for all colors
├── app/
│   └── globals.css        # 📋 CSS variables (must match colors.ts)
```

## How to Change Theme Colors

### Step 1: Edit `themes/colors.ts`

Open `themes/colors.ts` and modify the `semantic` object:

```typescript
export const semantic = {
    light: {
        card: '#ffffff',        // Light mode card background
        // ... other light mode colors
    },
    dark: {
        card: '#003D66',        // ⭐ Dark mode card background
        sidebar: '#002e4d',
        // ... other dark mode colors
    }
}
```

### Step 2: Update `app/globals.css`

Copy the same values to the CSS variables in `globals.css`:

```css
.dark {
  --card-bg: #003D66;          /* Must match colors.ts */
  --sidebar-bg: #002e4d;
  /* ... */
}
```

## Available Tailwind Classes

These classes automatically switch between light and dark mode:

### Background Classes
| Class | Description |
|-------|-------------|
| `bg-card` | Card/panel background |
| `bg-input` | Input field background |
| `bg-hover` | Hover state background |
| `bg-sidebar` | Sidebar background |
| `bg-app-background` | Main page background |

### Text Classes
| Class | Description |
|-------|-------------|
| `text-text-primary` | Headings, important text |
| `text-text-secondary` | Body text |
| `text-text-muted` | Captions, placeholders |

### Border Classes
| Class | Description |
|-------|-------------|
| `border-border-default` | Default borders |
| `border-border-divider` | Table/list dividers |

## Example Component Usage

```tsx
// ❌ OLD WAY - Don't use this
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">

// ✅ NEW WAY - Auto-switches with theme
<div className="bg-card text-text-primary">
```

## Primary Brand Colors

Access primary colors in JavaScript:

```tsx
import { colors } from '@/themes/colors';

// Use in inline styles when Tailwind classes aren't enough
<button style={{ backgroundColor: colors.primary[500] }}>
```

Or use Tailwind classes:

```tsx
<button className="bg-primary-500 hover:bg-primary-600">
```

## Color Palette Quick Reference

### Primary (Brand Blue)
- `primary-500`: #0084d1 (main brand color)
- `primary-600`: #0070b4 (hover)
- `primary-700`: #005d96 (active)

### Dark Theme Palette
- Background: #001f33
- Card: #003D66
- Input/Sidebar: #002e4d
- Borders: #00568f
- Hover: #004e80

### Light Theme Palette
- Background: #f4f6fc
- Card: #ffffff
- Input: #f8fafc
- Borders: #e2e8f0
- Hover: #eff6ff
