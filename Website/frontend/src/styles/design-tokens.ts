/**
 * VitaTrack Design System Tokens
 * Centralized design tokens for consistent theming across the application
 */

// Color Palette
export const colors = {
  // Brand Colors
  brand: {
    primary: "#10b981", // Emerald green - health & vitality
    secondary: "#059669", // Darker emerald
    accent: "#34d399", // Light emerald
    success: "#22c55e", // Green
    warning: "#f59e0b", // Amber
    error: "#ef4444", // Red
    info: "#3b82f6", // Blue
  },

  // Primary Scale
  primary: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
    950: "#022c22",
  },

  // Semantic Colors
  semantic: {
    success: {
      light: "#22c55e",
      DEFAULT: "#16a34a",
      dark: "#15803d",
    },
    warning: {
      light: "#f59e0b",
      DEFAULT: "#d97706",
      dark: "#b45309",
    },
    error: {
      light: "#ef4444",
      DEFAULT: "#dc2626",
      dark: "#b91c1c",
    },
    info: {
      light: "#3b82f6",
      DEFAULT: "#2563eb",
      dark: "#1d4ed8",
    },
  },

  // Nutrition Colors
  nutrition: {
    protein: "#ef4444", // Red
    carbs: "#f59e0b", // Orange
    fat: "#8b5cf6", // Purple
    fiber: "#22c55e", // Green
    sugar: "#ec4899", // Pink
    sodium: "#6366f1", // Indigo
    calories: "#10b981", // Primary
  },

  // Activity Colors
  activity: {
    cardio: "#ef4444", // Red
    strength: "#8b5cf6", // Purple
    flexibility: "#06b6d4", // Cyan
    sports: "#f59e0b", // Orange
    walking: "#22c55e", // Green
    yoga: "#ec4899", // Pink
    swimming: "#0ea5e9", // Sky blue
    cycling: "#84cc16", // Lime
  },

  // Status Colors
  status: {
    excellent: "#22c55e",
    good: "#84cc16",
    fair: "#f59e0b",
    poor: "#ef4444",
    inactive: "#6b7280",
  },

  // Chart Colors
  chart: {
    primary: "#10b981",
    secondary: "#059669",
    tertiary: "#34d399",
    quaternary: "#6ee7b7",
    accent1: "#3b82f6",
    accent2: "#8b5cf6",
    accent3: "#f59e0b",
    accent4: "#ef4444",
  },
} as const

// Typography Scale
export const typography = {
  fontFamily: {
    sans: ["var(--font-inter)", "system-ui", "sans-serif"],
    mono: ["var(--font-jetbrains-mono)", "Consolas", "monospace"],
    display: ["var(--font-inter)", "system-ui", "sans-serif"],
  },

  fontSize: {
    "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
    xs: ["0.75rem", { lineHeight: "1rem" }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    base: ["1rem", { lineHeight: "1.5rem" }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    "2xl": ["1.5rem", { lineHeight: "2rem" }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
    "5xl": ["3rem", { lineHeight: "1" }],
    "6xl": ["3.75rem", { lineHeight: "1" }],
    "7xl": ["4.5rem", { lineHeight: "1" }],
    "8xl": ["6rem", { lineHeight: "1" }],
    "9xl": ["8rem", { lineHeight: "1" }],
  },

  fontWeight: {
    thin: "100",
    extralight: "200",
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },

  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
} as const

// Spacing Scale
export const spacing = {
  px: "1px",
  0: "0px",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  18: "4.5rem",
  20: "5rem",
  24: "6rem",
  28: "7rem",
  32: "8rem",
  36: "9rem",
  40: "10rem",
  44: "11rem",
  48: "12rem",
  52: "13rem",
  56: "14rem",
  60: "15rem",
  64: "16rem",
  72: "18rem",
  80: "20rem",
  88: "22rem",
  96: "24rem",
  112: "28rem",
  128: "32rem",
} as const

// Border Radius
export const borderRadius = {
  none: "0px",
  sm: "0.125rem",
  DEFAULT: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  full: "9999px",
} as const

// Shadows
export const boxShadow = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  none: "0 0 #0000",

  // Custom shadows
  soft: "0 2px 8px 0 rgba(0, 0, 0, 0.05)",
  medium: "0 4px 12px 0 rgba(0, 0, 0, 0.1)",
  hard: "0 8px 24px 0 rgba(0, 0, 0, 0.15)",
  glow: "0 0 20px rgba(16, 185, 129, 0.3)",
  "glow-lg": "0 0 40px rgba(16, 185, 129, 0.4)",
} as const

// Animation Durations
export const animation = {
  duration: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
    slower: "750ms",
    slowest: "1000ms",
  },

  easing: {
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
} as const

// Breakpoints
export const breakpoints = {
  xs: "475px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  "3xl": "1600px",
} as const

// Z-Index Scale
export const zIndex = {
  auto: "auto",
  0: "0",
  10: "10",
  20: "20",
  30: "30",
  40: "40",
  50: "50",

  // Semantic z-index
  dropdown: "1000",
  sticky: "1020",
  fixed: "1030",
  "modal-backdrop": "1040",
  modal: "1050",
  popover: "1060",
  tooltip: "1070",
  toast: "1080",
} as const

// Component Variants
export const componentVariants = {
  button: {
    size: {
      xs: "h-7 px-2 text-xs",
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-6 text-base",
      xl: "h-12 px-8 text-lg",
    },

    variant: {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    },
  },

  card: {
    variant: {
      default: "bg-card text-card-foreground border shadow-soft",
      elevated: "bg-card text-card-foreground border shadow-medium",
      outlined: "bg-card text-card-foreground border-2",
      ghost: "bg-transparent",
    },

    padding: {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
    },
  },

  input: {
    size: {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-3 text-sm",
      lg: "h-11 px-4 text-base",
    },

    variant: {
      default: "border border-input bg-background",
      filled: "border-0 bg-muted",
      underlined: "border-0 border-b-2 border-input bg-transparent rounded-none",
    },
  },
} as const

// Layout Constants
export const layout = {
  sidebar: {
    width: "280px",
    collapsedWidth: "64px",
  },

  header: {
    height: "64px",
    mobileHeight: "56px",
  },

  container: {
    maxWidth: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },

    padding: {
      mobile: "1rem",
      tablet: "1.5rem",
      desktop: "2rem",
    },
  },
} as const

// Export all tokens as a single object
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  animation,
  breakpoints,
  zIndex,
  componentVariants,
  layout,
} as const

export type DesignTokens = typeof designTokens
export type Colors = typeof colors
export type Typography = typeof typography
export type Spacing = typeof spacing
