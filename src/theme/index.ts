/**
 * Theme — public API
 */
export { ThemeProvider, useTheme, ThemeContext } from './ThemeContext';
export type { ThemeMode, ThemeContextType, ThemeProviderProps } from './ThemeContext';

export { colors, palette, hexToRgba } from './colors';
export type { ThemeColors, Palette, ColorAliases } from './colors';

export {
  typography,
  fontSize,
  fontWeight,
  lineHeight,
  configureTypography,
  getFontFamily,
} from './typography';
export type { TypographyVariant, FontWeight, FontFamilyConfig } from './typography';

export {
  spacing,
  makeSpacing,
  layout,
  borderRadius,
  shadows,
  cardDimensions,
} from './spacing';
