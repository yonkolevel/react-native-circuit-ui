/**
 * CircuitUI Color System
 *
 * Exact values extracted from MidicircuitKit/Sources/StyleGuide/Resources/Assets.xcassets
 * to ensure pixel-perfect fidelity with the original SwiftUI design system.
 *
 * Key differences from SwiftUI:
 * - White variants (white2-6) use opacity in SwiftUI. We store both the rgba and a helper.
 * - mcYellow is defined inline in SwiftUI as rgb(1.0, 0.827, 0.247) = #FFD33F
 */

// ─── Raw Palette (from asset catalogs) ──────────────────────────────────────

export const palette = {
  // Orange — signature accent
  mcOrange: '#FF5C24',
  mcOrange2: '#FF6C3A',
  mcOrange3: '#FF8D66',
  mcOrange4: '#FFAD91',
  mcOrange5: '#FFCEBD',

  // Green — success / mint
  mcGreen: '#00FF9E',
  mcGreen2: '#1AFFA8',
  mcGreen3: '#4DFFBB',
  mcGreen4: '#80FFCF',
  mcGreen5: '#B2FFE2',

  // Pink — secondary accent
  mcPink: '#FF245B',
  mcPink2: '#FF3A6B',
  mcPink3: '#FF668C',
  mcPink4: '#FF91AD',
  mcPink5: '#FFBDCE',

  // Blue — primary interactive
  mcBlue: '#2496FF',
  mcBlue2: '#3AA0FF',
  mcBlue3: '#66B6FF',
  mcBlue4: '#91CBFF',
  mcBlue5: '#66B6FF', // Note: same as blue3 in asset catalog

  // Purple — accent
  mcPurple: '#8557FF',
  mcPurple2: '#9168FF',
  mcPurple3: '#AA89FF',
  mcPurple4: '#C2ABFF',
  mcPurple5: '#DACDFF',

  // Yellow (inline in SwiftUI — not from asset catalog)
  mcYellow: '#FFD33F',

  // Neutrals — Dark
  mcBlack: '#000000',
  mcBlack2: '#1A1C20',
  mcBlack3: '#25272B',
  mcBlack4: '#313336',
  mcBlack5: '#D1D1D2',

  // Neutrals — Light (base #F7F7F7 with opacity variants)
  mcWhite: '#F7F7F7',
  mcWhite2: 'rgba(247, 247, 247, 0.80)',
  mcWhite3: 'rgba(247, 247, 247, 0.60)',
  mcWhite4: 'rgba(247, 247, 247, 0.40)',
  mcWhite5: 'rgba(247, 247, 247, 0.20)',
  mcWhite6: 'rgba(247, 247, 247, 0.12)',

  // Gray
  mcGray: '#E0E0E0',

  // Window controls (macOS style)
  close: '#FF5F56',
  minimize: '#FFBD2E',
  expand: '#28C941',
} as const;

// ─── Semantic Color Aliases ─────────────────────────────────────────────────

const colorAliases = {
  orange: palette.mcOrange,
  orange2: palette.mcOrange2,
  orange3: palette.mcOrange3,
  orange4: palette.mcOrange4,
  orange5: palette.mcOrange5,

  green: palette.mcGreen,
  green2: palette.mcGreen2,
  green3: palette.mcGreen3,
  green4: palette.mcGreen4,
  green5: palette.mcGreen5,

  pink: palette.mcPink,
  pink2: palette.mcPink2,
  pink3: palette.mcPink3,
  pink4: palette.mcPink4,
  pink5: palette.mcPink5,

  blue: palette.mcBlue,
  blue2: palette.mcBlue2,
  blue3: palette.mcBlue3,
  blue4: palette.mcBlue4,
  blue5: palette.mcBlue5,

  purple: palette.mcPurple,
  purple2: palette.mcPurple2,
  purple3: palette.mcPurple3,
  purple4: palette.mcPurple4,
  purple5: palette.mcPurple5,

  black: palette.mcBlack,
  black2: palette.mcBlack2,
  black3: palette.mcBlack3,
  black4: palette.mcBlack4,
  black5: palette.mcBlack5,

  white: palette.mcWhite,
  white2: palette.mcWhite2,
  white3: palette.mcWhite3,
  white4: palette.mcWhite4,
  white5: palette.mcWhite5,
  white6: palette.mcWhite6,

  gray: palette.mcGray,
} as const;

// ─── Theme Color Value Interface ────────────────────────────────────────────

interface SemanticColors {
  background: string;
  primaryText: string;
  secondaryText: string;
  tertiaryText: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  border: string;
  divider: string;
  card: string;
  disabled: string;
  closeButton: string;
  minimizeButton: string;
  expandButton: string;
}

type ThemeColorValues = SemanticColors & typeof palette & typeof colorAliases;

// ─── Theme Tokens ───────────────────────────────────────────────────────────
// Mirrors SwiftUI: Color.background(for:), Color.primaryText(for:), etc.

const lightTheme: ThemeColorValues = {
  // Semantic backgrounds & text (match SwiftUI helpers)
  background: palette.mcWhite, // Color.background(for: .light)
  primaryText: palette.mcBlack, // Color.primaryText(for: .light)
  secondaryText: palette.mcBlack2, // Color.secondaryText(for: .light)
  tertiaryText: palette.mcBlack3, // Color.tertiaryText(for: .light)

  // Intent colors
  primary: palette.mcOrange,
  secondary: palette.mcPink,
  success: palette.mcGreen,
  warning: palette.mcOrange,
  error: palette.close,
  info: palette.mcBlue,

  // Surface colors
  border: palette.mcWhite4,
  divider: palette.mcWhite5,
  card: palette.mcWhite2,
  disabled: palette.mcWhite6,

  // Window controls
  closeButton: palette.close,
  minimizeButton: palette.minimize,
  expandButton: palette.expand,

  ...palette,
  ...colorAliases,
} as const;

const darkTheme: ThemeColorValues = {
  // Semantic backgrounds & text (match SwiftUI helpers)
  background: palette.mcBlack2, // Color.background(for: .dark)
  primaryText: palette.mcWhite, // Color.primaryText(for: .dark)
  secondaryText: palette.mcWhite2, // Color.secondaryText(for: .dark)
  tertiaryText: palette.mcWhite3, // Color.tertiaryText(for: .dark)

  // Intent colors
  primary: palette.mcOrange,
  secondary: palette.mcPink,
  success: palette.mcGreen,
  warning: palette.mcOrange,
  error: palette.close,
  info: palette.mcBlue,

  // Surface colors
  border: palette.mcBlack4,
  divider: palette.mcBlack3,
  card: palette.mcBlack3,
  disabled: palette.mcBlack5,

  // Window controls
  closeButton: palette.close,
  minimizeButton: palette.minimize,
  expandButton: palette.expand,

  ...palette,
  ...colorAliases,
} as const;

export const colors = {
  light: lightTheme,
  dark: darkTheme,
  palette,
} as const;

// ─── Utilities ──────────────────────────────────────────────────────────────

/**
 * Convert hex to rgba string.
 */
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  // If already rgba, adjust alpha
  if (hex.startsWith('rgba')) {
    return hex.replace(/[\d.]+\)$/, `${alpha})`);
  }

  const hexValue = hex.replace('#', '');

  if (hexValue.length === 3) {
    const r = parseInt(hexValue.charAt(0) + hexValue.charAt(0), 16);
    const g = parseInt(hexValue.charAt(1) + hexValue.charAt(1), 16);
    const b = parseInt(hexValue.charAt(2) + hexValue.charAt(2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const r = parseInt(hexValue.substring(0, 2), 16);
  const g = parseInt(hexValue.substring(2, 4), 16);
  const b = parseInt(hexValue.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ─── Type exports ───────────────────────────────────────────────────────────

export type Palette = typeof palette;
export type ThemeColors = ThemeColorValues;
export type ColorAliases = typeof colorAliases;
