/**
 * Theme color definitions.
 */
export interface ThemeColors {
  /** Main background color */
  background: string
  /** Main text/foreground color */
  foreground: string
  /** Primary accent color */
  primary: string
  /** Secondary accent color */
  secondary: string
  /** Success/positive color */
  success: string
  /** Warning/caution color */
  warning: string
  /** Error/negative color */
  error: string
  /** Muted/disabled text color */
  muted: string
  /** Accent background color */
  accent: string
  /** Border color */
  border: string
}

/**
 * Complete theme definition.
 */
export interface Theme {
  /** Theme name identifier */
  name: string
  /** Theme colors */
  colors: ThemeColors
}
