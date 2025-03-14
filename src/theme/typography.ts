import type { TextStyle } from 'react-native';
import { Platform } from 'react-native';

export const FontFamily = {
  Regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  SemiBold: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  Bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
};

export const fontSize = {
  extraSmall: 8,
  extraSmall10: 10,
  small: 12,
  body: 14,
  label: 16,
  h5: 18,
  quote: 22,
  labelRegular2: 22,
  h4: 28,
  h3: 38,
  h2: 50,
  h1: 68,
};

export type FontWeight = '400' | '600' | '700' | 'normal' | 'bold';

export const fontWeight = {
  regular: '400' as FontWeight,
  semiBold: '600' as FontWeight,
  bold: '700' as FontWeight,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.8,
};

const createTextStyle = (
  size: number,
  family: string,
  weight: FontWeight,
  lineHeightMultiplier: number = lineHeight.normal
): TextStyle => ({
  fontFamily: family,
  fontSize: size,
  fontWeight: weight,
  lineHeight: size * lineHeightMultiplier,
});

export const typography = {
  h1: createTextStyle(
    fontSize.h1,
    FontFamily.SemiBold,
    fontWeight.semiBold,
    lineHeight.tight
  ),
  h1Regular: createTextStyle(
    fontSize.h1,
    FontFamily.Regular,
    fontWeight.regular,
    lineHeight.tight
  ),
  h2: createTextStyle(
    fontSize.h2,
    FontFamily.SemiBold,
    fontWeight.semiBold,
    lineHeight.tight
  ),
  h3: createTextStyle(
    fontSize.h3,
    FontFamily.SemiBold,
    fontWeight.semiBold,
    lineHeight.tight
  ),
  h3Regular: createTextStyle(
    fontSize.h3,
    FontFamily.Regular,
    fontWeight.regular,
    lineHeight.tight
  ),
  h4: createTextStyle(
    fontSize.h4,
    FontFamily.SemiBold,
    fontWeight.semiBold,
    lineHeight.tight
  ),
  h5: createTextStyle(fontSize.h5, FontFamily.SemiBold, fontWeight.semiBold),

  body: createTextStyle(fontSize.body, FontFamily.Regular, fontWeight.regular),
  label: createTextStyle(
    fontSize.label,
    FontFamily.SemiBold,
    fontWeight.semiBold
  ),
  labelBold: createTextStyle(fontSize.label, FontFamily.Bold, fontWeight.bold),
  labelRegular: createTextStyle(
    fontSize.label,
    FontFamily.Regular,
    fontWeight.regular
  ),
  labelRegular2: createTextStyle(
    fontSize.labelRegular2,
    FontFamily.Regular,
    fontWeight.regular
  ),
  labelRegular3: createTextStyle(
    fontSize.body,
    FontFamily.Regular,
    fontWeight.regular
  ),

  quote: createTextStyle(
    fontSize.quote,
    FontFamily.SemiBold,
    fontWeight.semiBold
  ),
  quoteBold: createTextStyle(fontSize.quote, FontFamily.Bold, fontWeight.bold),

  small: createTextStyle(
    fontSize.small,
    FontFamily.Regular,
    fontWeight.regular
  ),

  buttonLabelBold: createTextStyle(
    fontSize.small,
    FontFamily.Bold,
    fontWeight.bold
  ),
  buttonLabelSemiBold: createTextStyle(
    fontSize.small,
    FontFamily.SemiBold,
    fontWeight.semiBold
  ),

  extraSmall: createTextStyle(
    fontSize.extraSmall,
    FontFamily.Regular,
    fontWeight.regular
  ),
  extraSmallSemiBold: createTextStyle(
    fontSize.extraSmall,
    FontFamily.SemiBold,
    fontWeight.semiBold
  ),
  extraSmall10: createTextStyle(
    fontSize.extraSmall10,
    FontFamily.Regular,
    fontWeight.regular
  ),
};

export default {
  FontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  typography,
};
