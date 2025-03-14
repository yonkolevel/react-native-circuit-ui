const BASE_UNIT = 4;

export const spacing = {
  none: 0,
  xxs: BASE_UNIT / 2,
  xs: BASE_UNIT,
  sm: BASE_UNIT * 2,
  md: BASE_UNIT * 3,
  lg: BASE_UNIT * 4,
  xl: BASE_UNIT * 6,
  xxl: BASE_UNIT * 8,
  xxxl: BASE_UNIT * 12,
  huge: BASE_UNIT * 16,
  custom: (multiplier: number) => BASE_UNIT * multiplier,
};

export const layout = {
  screenMargin: spacing.lg,
  screenMarginSmall: spacing.md,
  contentSpacing: spacing.md,
  contentSpacingLarge: spacing.xl,
  componentSpacing: spacing.sm,
  componentSpacingLarge: spacing.lg,
  formElementSpacing: spacing.md,
  cardPadding: spacing.lg,
  cardPaddingSmall: spacing.md,
  buttonPaddingHorizontal: spacing.lg,
  buttonPaddingVertical: spacing.sm,
  inputPaddingHorizontal: spacing.md,
  inputPaddingVertical: spacing.sm,
};

export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
  circle: '50%',
};

export const shadows = {
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
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
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

export default {
  spacing,
  layout,
  borderRadius,
  shadows,
};
