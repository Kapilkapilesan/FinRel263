/**
 * FinCore Theme Colors - Single Source of Truth
 * 
 * This file defines all colors used across the application.
 * Both JavaScript components and CSS (via globals.css) reference these values.
 * 
 * To change the theme:
 * 1. Update the colors in this file
 * 2. Run: npm run generate-theme (if available) OR
 *    Copy the semantic values to globals.css manually
 * 
 * The semantic colors automatically switch between light and dark modes.
 */

// ============================================
// PRIMARY BRAND COLORS
// ============================================
export const primary = {
    50: '#eff6ff',   // Lightest - backgrounds
    100: '#dbeafe',  // Light - hover states
    200: '#bfdbfe',  // Light borders
    300: '#93c5fd',  // Light accents
    400: '#60a5fa',  // Medium accents
    500: '#0084d1',  // PRIMARY BRAND COLOR ⭐
    600: '#0070b4',  // Darker - hover on primary
    700: '#005d96',  // Dark - active states
    800: '#004a79',  // Darker
    900: '#003a5e',  // Darkest
    brand: '#0084d1', // Alias for primary.500
} as const;

// ============================================
// STATUS COLORS
// ============================================
export const success = {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',  // Success green
    600: '#16a34a',
    700: '#15803d',
} as const;

export const warning = {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#eab308',  // Warning amber
    600: '#d97706',
} as const;

export const danger = {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',  // Danger red
    600: '#dc2626',
} as const;

export const rose = {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
} as const;

export const emerald = {
    50: '#ecfdf5',
    100: '#d1fae5',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
} as const;

export const indigo = {
    50: '#eef2ff',
    100: '#e0e7ff',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    900: '#312e81',
    950: '#1e1b4b',
} as const;

// ============================================
// NEUTRAL COLORS
// ============================================
export const gray = {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
} as const;

// ============================================
// SEMANTIC THEME COLORS
// These define light and dark mode appearances
// Update these to change the overall theme
// ============================================
export const semantic = {
    light: {
        // Page backgrounds
        background: '#f4f7fe',  // Light blue-gray page background
        appBackground: '#f4f6fc',

        // Card/Panel backgrounds  
        card: '#ffffff',        // White cards
        sidebar: '#EEF7FE',     // Light blue sidebar

        // Text colors
        text: {
            primary: '#1e293b',   // Dark text - headings
            secondary: '#64748b', // Medium text - body
            muted: '#94a3b8',     // Light text - captions
        },

        // Border colors
        border: {
            default: '#e2e8f0',   // Default borders
            divider: '#f1f5f9',   // Table/list dividers
        },

        // Interactive elements
        input: '#f8fafc',         // Input backgrounds
        mutedBg: '#f1f5f9',       // Muted background for tags/etc
        hover: '#eff6ff',         // Hover states

        // Table-specific colors
        table: {
            header: '#f8fafc',     // Slightly different than card
            rowHover: '#f1f5f9',   // Subtle row hover
            stripe: 'rgba(248, 250, 252, 0.5)',
        },
    },

    dark: {

        // Page backgrounds - Refined Premium Palette ⭐
        // Softer blues with reduced saturation for better visual comfort
        background: '#0a1929',     // Softer dark blue base
        appBackground: '#071318',  // Very dark blue-gray

        // Card/Panel backgrounds
        card: '#0d2137',           // Softer card blue - less saturated
        sidebar: '#0a1929',        // Matches background for seamless look

        // Text colors - Softer for reduced eye strain
        text: {
            primary: '#e3f2fd',    // Soft white-blue (not pure white)
            secondary: '#90caf9',  // Muted sky blue
            muted: '#5c8ab8',      // Subtle muted blue
        },

        // Border colors - Visible but not harsh
        border: {
            default: '#1e3a5f',    // Soft border
            divider: '#132f4c',    // Very subtle divider
        },

        // Interactive elements
        input: '#0d2137',          // Same as card for consistency
        mutedBg: '#132f4c',        // Muted background for tags/etc
        hover: '#173a5e',          // Subtle highlight on hover

        // Table-specific colors
        table: {
            header: '#0a1929',     // Slightly darker than card
            rowHover: '#132f4c',   // Subtle row hover
            stripe: 'rgba(19, 47, 76, 0.4)', // Very subtle alternating
        },
    }
} as const;

// ============================================
// LEGACY EXPORT (for backwards compatibility)
// ============================================
export const colors = {
    primary,
    success,
    warning,
    danger,
    emerald,
    indigo,
    rose,
    gray,
    surface: {
        background: semantic.light.background,
        dark: semantic.dark.background,
    },
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
    semantic,
};

// ============================================
// CSS VARIABLE GENERATOR
// Copy this output to globals.css when updating colors
// ============================================
export const generateCSSVariables = () => {
    return `
/* ========================================
   AUTO-GENERATED FROM colors.ts
   Last updated: ${new Date().toISOString()}
   ======================================== */

:root {
  --background: ${semantic.light.background};
  --foreground: ${semantic.light.text.primary};

  /* Semantic Colors - Light Mode */
  --app-background: ${semantic.light.appBackground};
  --card-bg: ${semantic.light.card};
  --sidebar-bg: ${semantic.light.sidebar};
  --text-primary: ${semantic.light.text.primary};
  --text-secondary: ${semantic.light.text.secondary};
  --text-muted: ${semantic.light.text.muted};
  --border-default: ${semantic.light.border.default};
  --border-divider: ${semantic.light.border.divider};
  --input-bg: ${semantic.light.input};
  --muted-bg: ${semantic.light.mutedBg};
  --hover-bg: ${semantic.light.hover};

  /* Table-specific colors - Light Mode */
  --table-header-bg: ${semantic.light.table.header};
  --table-row-hover: ${semantic.light.table.rowHover};
  --table-stripe: ${semantic.light.table.stripe};
}

.dark {
  --background: ${semantic.dark.background};
  --foreground: ${semantic.dark.text.primary};

  /* Semantic Colors - Dark Mode */
  --app-background: ${semantic.dark.appBackground};
  --card-bg: ${semantic.dark.card};
  --sidebar-bg: ${semantic.dark.sidebar};
  --text-primary: ${semantic.dark.text.primary};
  --text-secondary: ${semantic.dark.text.secondary};
  --text-muted: ${semantic.dark.text.muted};
  --border-default: ${semantic.dark.border.default};
  --border-divider: ${semantic.dark.border.divider};
  --input-bg: ${semantic.dark.input};
  --muted-bg: ${semantic.dark.mutedBg};
  --hover-bg: ${semantic.dark.hover};

  /* Table-specific colors */
  --table-header-bg: ${semantic.dark.table.header};
  --table-row-hover: ${semantic.dark.table.rowHover};
  --table-stripe: ${semantic.dark.table.stripe};
}
`;
};

// Type exports for TypeScript usage
export type ThemeMode = 'light' | 'dark';
export type SemanticColors = typeof semantic;
