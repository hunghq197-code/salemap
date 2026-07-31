export const colorTokens = {
  accent: "var(--accent)",
  accentSoft: "var(--accent-soft)",
  background: "var(--background)",
  backgroundSubtle: "var(--background-subtle)",
  border: "var(--border)",
  borderStrong: "var(--border-strong)",
  danger: "var(--danger)",
  dangerSoft: "var(--danger-soft)",
  primary: "var(--primary)",
  primaryActive: "var(--primary-active)",
  primaryHover: "var(--primary-hover)",
  primarySoft: "var(--primary-soft)",
  sidebar: "var(--sidebar)",
  sidebarActive: "var(--sidebar-active)",
  sidebarHover: "var(--sidebar-hover)",
  sidebarSecondary: "var(--sidebar-secondary)",
  success: "var(--success)",
  successSoft: "var(--success-soft)",
  surface: "var(--surface)",
  surfaceElevated: "var(--surface-elevated)",
  surfaceMuted: "var(--surface-muted)",
  textInverse: "var(--text-inverse)",
  textMuted: "var(--text-muted)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  warning: "var(--warning)",
  warningSoft: "var(--warning-soft)",
} as const;

export const spacingTokens = {
  "1": "4px",
  "2": "8px",
  "3": "12px",
  "4": "16px",
  "5": "20px",
  "6": "24px",
  "8": "32px",
  "10": "40px",
  "12": "48px",
  "16": "64px",
} as const;

export const radiusTokens = {
  full: "var(--radius-full)",
  lg: "var(--radius-lg)",
  md: "var(--radius-md)",
  sm: "var(--radius-sm)",
  xl: "var(--radius-xl)",
} as const;

export const shadowTokens = {
  card: "var(--shadow-card)",
  elevated: "var(--shadow-elevated)",
  modal: "var(--shadow-modal)",
} as const;

export type ColorToken = keyof typeof colorTokens;
export type RadiusToken = keyof typeof radiusTokens;
export type ShadowToken = keyof typeof shadowTokens;
