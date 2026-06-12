/**
 * CircuitUI Design Scales
 *
 * Pure numeric/string values — no React Native dependency.
 * Extracted from typography.ts and spacing.ts so any web consumer
 * can import font sizes, spacing, and radii without shimming react-native.
 */

// ─── Font Sizes (matching SwiftUI exactly) ──────────────────────────────────

export const fontSize = {
  extraSmall: 8,
  extraSmall10: 10,
  caption: 11,
  small: 12,
  body: 14,
  label: 16,
  h5: 18,
  quote: 22,
  h4: 28,
  h3: 38,
  h2: 50,
  h1: 68,
} as const;

// ─── Font Weights ───────────────────────────────────────────────────────────

export type FontWeight = '400' | '600' | '700';

export const fontWeight = {
  regular: '400' as FontWeight,
  semiBold: '600' as FontWeight,
  bold: '700' as FontWeight,
} as const;

// ─── Line Height Multipliers ────────────────────────────────────────────────

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.8,
} as const;

// ─── Spacing ────────────────────────────────────────────────────────────────

const BASE_UNIT = 4;

export const makeSpacing = (multiplier: number): number =>
  BASE_UNIT * multiplier;

export const spacing = {
  'none': 0,
  'xxs': BASE_UNIT / 2,
  'xs': BASE_UNIT,
  'sm': makeSpacing(2),
  'md': makeSpacing(3),
  'lg': makeSpacing(4),
  'xl': makeSpacing(5),
  '2xl': makeSpacing(6),
  '3xl': makeSpacing(8),
  '4xl': makeSpacing(10),
  '5xl': makeSpacing(12),
  'huge': makeSpacing(16),
} as const;

// ─── Layout Tokens ──────────────────────────────────────────────────────────

export const layout = {
  screenPaddingPhone: spacing.lg,
  screenPaddingDesktop: spacing['4xl'],
  contentSpacing: spacing.md,
  contentSpacingLarge: spacing.xl,
  componentSpacing: spacing.sm,
  componentSpacingLarge: spacing.lg,
  formElementSpacing: spacing.md,
  cardPadding: spacing.lg,
  cardPaddingSmall: spacing.md,
  buttonPaddingVertical: makeSpacing(3),
  buttonPaddingHorizontal: makeSpacing(4),
  buttonPaddingVerticalLarge: 8,
  buttonPaddingHorizontalLarge: 22,
  inputPaddingHorizontal: spacing.lg,
  inputPaddingVertical: spacing.sm,
  inputHeight: 44,
} as const;

// ─── Border Radius ──────────────────────────────────────────────────────────

export const borderRadius = {
  'none': 0,
  'xs': 2,
  'sm': 4,
  'md': 6,
  'lg': 8,
  'xl': 12,
  '2xl': 16,
  'pill': 9999,
} as const;

// ─── Card Dimensions ────────────────────────────────────────────────────────

export const cardDimensions = {
  small: { height: 140 },
  medium: { height: 160 },
  large: { height: 250 },
  maxWidthPhone: 358,
} as const;
