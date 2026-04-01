/**
 * CircuitUI Spacing System
 *
 * Matches MidicircuitKit/Sources/Utils/Spacing.swift
 * Base unit: 4pt (same as `makeSpacing(_ multiplier: Int)`)
 */
import type { ViewStyle } from 'react-native';

// ─── Base Unit ──────────────────────────────────────────────────────────────

const BASE_UNIT = 4;

/**
 * Direct port of SwiftUI `makeSpacing(_ multiplier: Int)`.
 * Returns `multiplier * 4` points.
 */
export const makeSpacing = (multiplier: number): number =>
  BASE_UNIT * multiplier;

// ─── Named Spacing Scale ────────────────────────────────────────────────────

export const spacing = {
  'none': 0,
  'xxs': BASE_UNIT / 2, // 2
  'xs': BASE_UNIT, // 4
  'sm': makeSpacing(2), // 8
  'md': makeSpacing(3), // 12
  'lg': makeSpacing(4), // 16
  'xl': makeSpacing(5), // 20
  '2xl': makeSpacing(6), // 24
  '3xl': makeSpacing(8), // 32
  '4xl': makeSpacing(10), // 40
  '5xl': makeSpacing(12), // 48
  'huge': makeSpacing(16), // 64
} as const;

// ─── Layout Tokens ──────────────────────────────────────────────────────────
// Mirrors SwiftUI TargetDevice-based padding

export const layout = {
  /** iPhone screen edge padding (16pt) */
  screenPaddingPhone: spacing.lg,
  /** Desktop/macOS screen edge padding (40pt) */
  screenPaddingDesktop: spacing['4xl'],

  /** Standard content gap */
  contentSpacing: spacing.md,
  /** Large content gap */
  contentSpacingLarge: spacing.xl,

  /** Component internal spacing */
  componentSpacing: spacing.sm,
  componentSpacingLarge: spacing.lg,

  /** Form element gap */
  formElementSpacing: spacing.md,

  /** Card padding */
  cardPadding: spacing.lg,
  cardPaddingSmall: spacing.md,

  /** Button padding (matches SwiftUI makeSpacing(3)/makeSpacing(4)) */
  buttonPaddingVertical: makeSpacing(3), // 12
  buttonPaddingHorizontal: makeSpacing(4), // 16

  /** Large button padding (matches SwiftUI 8/22) */
  buttonPaddingVerticalLarge: 8,
  buttonPaddingHorizontalLarge: 22,

  /** Input padding */
  inputPaddingHorizontal: spacing.lg, // 16 (matches SwiftUI input left padding)
  inputPaddingVertical: spacing.sm,
  inputHeight: 36, // matches SwiftUI input height
} as const;

// ─── Border Radius ──────────────────────────────────────────────────────────
// SwiftUI uses cornerRadius(6) consistently

export const borderRadius = {
  'none': 0,
  'xs': 2,
  'sm': 4,
  /** Standard component radius — matches SwiftUI 6pt */
  'md': 6,
  'lg': 8,
  'xl': 12,
  '2xl': 16,
  'pill': 9999,
} as const;

// ─── Shadows ────────────────────────────────────────────────────────────────
// SwiftUI uses .shadow(radius: 6) on cards

export const shadows: Record<'none' | 'sm' | 'md' | 'lg', ViewStyle> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  /** Matches SwiftUI .shadow(radius: 6) */
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// ─── Card Dimensions ────────────────────────────────────────────────────────
// Matches SwiftUI CardSize enum

export const cardDimensions = {
  small: { height: 140 },
  medium: { height: 160 },
  large: { height: 250 },
  /** Max width on iPhone (SwiftUI maxWidth: 358) */
  maxWidthPhone: 358,
} as const;

export default {
  spacing,
  makeSpacing,
  layout,
  borderRadius,
  shadows,
  cardDimensions,
};
