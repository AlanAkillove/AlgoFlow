import type { Theme, ThemeColors } from './types'

export type { Theme, ThemeColors }

/**
 * Built-in light theme.
 */
const lightThemeColors: ThemeColors = {
  background: '#ffffff',
  foreground: '#1f2937',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  muted: '#6b7280',
  accent: '#f3f4f6',
  border: '#e5e7eb',
}

export const lightTheme: Theme = {
  name: 'light',
  colors: lightThemeColors,
}

/**
 * Built-in dark theme.
 */
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    ...lightThemeColors,
    background: '#1f2937',
    foreground: '#f9fafb',
    muted: '#9ca3af',
    accent: '#374151',
    border: '#4b5563',
  },
}

/**
 * Built-in sepia theme for eye comfort.
 */
export const sepiaTheme: Theme = {
  name: 'sepia',
  colors: {
    background: '#faf6f1',
    foreground: '#5c4b37',
    primary: '#8b7355',
    secondary: '#a08b6d',
    success: '#6b8e5c',
    warning: '#c4944a',
    error: '#c45c4a',
    muted: '#9c8b7a',
    accent: '#f0e8dc',
    border: '#d4c8b8',
  },
}

/**
 * Create a custom theme.
 */
export function createTheme(name: string, colors: Partial<ThemeColors>): Theme {
  return {
    name,
    colors: { ...lightThemeColors, ...colors },
  }
}

/**
 * Apply a theme to the document root.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
 
  // Set theme class
  root.classList.remove('theme-light', 'theme-dark', 'theme-sepia')
  root.classList.add(`theme-${theme.name}`)
  
  // Set CSS variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--af-${key}`, value)
  })
}
