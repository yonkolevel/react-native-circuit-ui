/**
 * CircuitUI Typography System
 *
 * Exact match of MidicircuitKit/Sources/StyleGuide/Typography.swift
 *
 * SwiftUI uses custom Barlow font (Regular, SemiBold, Bold).
 * When Barlow is loaded via expo-font or react-native config plugin,
 * set `CircuitUITypography.configure({ fontFamily: { ... } })`.
 *
 * Until configured, falls back to platform system fonts.
 */
import type { TextStyle } from 'react-native';
import { Platform } from 'react-native';

// ─── Font Family Registry ───────────────────────────────────────────────────

export interface FontFamilyConfig {
  regular: string;
  semiBold: string;
  bold: string;
}

const defaultFontFamily: FontFamilyConfig = {
  regular: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  })!,
  semiBold: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'System',
  })!,
  bold: Platform.select({
    ios: 'System',
    android: 'sans-serif-bold',
    default: 'System',
  })!,
};

// Mutable config — set via configure()
let _fontFamily: FontFamilyConfig = { ...defaultFontFamily };

/**
 * Configure custom fonts (e.g. Barlow after loading with expo-font).
 *
 * @example
 * ```ts
 * configureTypography({
 *   fontFamily: {
 *     regular: 'Barlow-Regular',
 *     semiBold: 'Barlow-SemiBold',
 *     bold: 'Barlow-Bold',
 *   },
 * });
 * ```
 */
export function configureTypography(opts: {
  fontFamily: FontFamilyConfig;
}): void {
  _fontFamily = { ...opts.fontFamily };
}

export function getFontFamily(): Readonly<FontFamilyConfig> {
  return _fontFamily;
}

// ─── Font Sizes (matching SwiftUI exactly) ──────────────────────────────────

export const fontSize = {
  extraSmall: 8,
  extraSmall10: 10,
  small: 12, // buttonLabelBold / buttonLabelSemiBold
  body: 14, // mcLabelRegular3
  label: 16, // mcLabel / mcLabelRegular / mcLabelBold
  h5: 18,
  quote: 22, // mcQuote / mcLabelRegular2
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
  tight: 1.2, // headings
  normal: 1.5, // body / labels
  relaxed: 1.8, // quotes / large text
} as const;

// ─── Style Factory ──────────────────────────────────────────────────────────

const createTextStyle = (
  size: number,
  familyKey: keyof FontFamilyConfig,
  weight: FontWeight,
  lineHeightMultiplier: number = lineHeight.normal
): TextStyle => ({
  fontFamily: _fontFamily[familyKey],
  fontSize: size,
  fontWeight: weight,
  lineHeight: Math.round(size * lineHeightMultiplier),
});

// ─── Typography Scale ───────────────────────────────────────────────────────
// Matches every Font.mc* and Text extension in Typography.swift

export const typography = {
  // Headings
  h1: createTextStyle(fontSize.h1, 'semiBold', fontWeight.semiBold, lineHeight.tight),
  h1Regular: createTextStyle(fontSize.h1, 'regular', fontWeight.regular, lineHeight.tight),
  h2: createTextStyle(fontSize.h2, 'semiBold', fontWeight.semiBold, lineHeight.tight),
  h3: createTextStyle(fontSize.h3, 'semiBold', fontWeight.semiBold, lineHeight.tight),
  h3Regular: createTextStyle(fontSize.h3, 'regular', fontWeight.regular, lineHeight.tight),
  h4: createTextStyle(fontSize.h4, 'semiBold', fontWeight.semiBold, lineHeight.tight),
  h5: createTextStyle(fontSize.h5, 'semiBold', fontWeight.semiBold, lineHeight.normal),

  // Body / Labels
  body: createTextStyle(fontSize.body, 'regular', fontWeight.regular),
  label: createTextStyle(fontSize.label, 'semiBold', fontWeight.semiBold),
  labelBold: createTextStyle(fontSize.label, 'bold', fontWeight.bold),
  labelRegular: createTextStyle(fontSize.label, 'regular', fontWeight.regular),
  labelRegular2: createTextStyle(fontSize.quote, 'regular', fontWeight.regular), // 22pt regular
  labelRegular3: createTextStyle(fontSize.body, 'regular', fontWeight.regular), // 14pt regular

  // Quote
  quote: createTextStyle(fontSize.quote, 'semiBold', fontWeight.semiBold),
  quoteBold: createTextStyle(fontSize.quote, 'bold', fontWeight.bold),

  // Small / Caption
  small: createTextStyle(fontSize.small, 'regular', fontWeight.regular),

  // Button labels
  buttonLabelBold: createTextStyle(fontSize.small, 'bold', fontWeight.bold),
  buttonLabelSemiBold: createTextStyle(fontSize.small, 'semiBold', fontWeight.semiBold),

  // Extra small
  extraSmall: createTextStyle(fontSize.extraSmall, 'regular', fontWeight.regular),
  extraSmallSemiBold: createTextStyle(fontSize.extraSmall, 'semiBold', fontWeight.semiBold),
  extraSmall10: createTextStyle(fontSize.extraSmall10, 'regular', fontWeight.regular),
} as const;

// ─── Type exports ───────────────────────────────────────────────────────────

export type TypographyVariant = keyof typeof typography;

export default {
  fontSize,
  fontWeight,
  lineHeight,
  typography,
  configureTypography,
  getFontFamily,
};
