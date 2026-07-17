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
  secondary: string;
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

const lightTheme: ThemeColorValues = {
  // Intent colors
  secondary: palette.mcPink,

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
  // Intent colors
  secondary: palette.mcPink,

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

/**
 * Convert hex to HSL. Hue in degrees [0, 360), saturation/lightness as
 * fractions [0, 1] — fractions (not 0-100) keep downstream interpolation
 * math simple for callers like getVelocityColor.
 */
export const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const hexValue = hex.replace('#', '');
  const r = parseInt(hexValue.substring(0, 2), 16) / 255;
  const g = parseInt(hexValue.substring(2, 4), 16) / 255;
  const b = parseInt(hexValue.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return { h: h * 60, s, l };
};

/** Convert HSL (hue in degrees, saturation/lightness as [0, 1] fractions) to a hex string. */
export const hslToHex = (h: number, s: number, l: number): string => {
  if (s === 0) {
    const v = Math.round(l * 255);
    const hex = v.toString(16).padStart(2, '0');
    return `#${hex}${hex}${hex}`;
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hNorm = h / 360;
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(hue2rgb(p, q, hNorm + 1 / 3))}${toHex(hue2rgb(p, q, hNorm))}${toHex(hue2rgb(p, q, hNorm - 1 / 3))}`;
};

// ─── Type exports ───────────────────────────────────────────────────────────

export type Palette = typeof palette;
export type ThemeColors = ThemeColorValues;
export type ColorAliases = typeof colorAliases;
