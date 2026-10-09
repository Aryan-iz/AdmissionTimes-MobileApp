/**
 * Design tokens. Screens and components use these instead of literal values so
 * spacing, colors and type stay consistent across the app.
 */

export const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primarySoft: '#EFF6FF',
  bg: '#F9FAFB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  divider: '#F3F4F6',
  text: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  success: '#047857',
  successSoft: '#D1FAE5',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  neutralSoft: '#F3F4F6',
  violet: '#6D28D9',
  violetSoft: '#EDE9FE',
} as const

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const

export const radius = { sm: 6, md: 10, lg: 12, xl: 16, pill: 999 } as const

export const font = {
  caption: 11,
  small: 12,
  body: 14,
  title: 16,
  heading: 18,
  display: 22,
} as const

/** Space kept free at the bottom of scrolling screens so the AI button never covers content. */
export const FLOATING_BUTTON_CLEARANCE = 96

export const theme = { colors, spacing, radius, font }
