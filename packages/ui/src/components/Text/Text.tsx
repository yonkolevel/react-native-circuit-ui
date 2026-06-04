/**
 * Text — Themed typography component
 *
 * Maps directly to SwiftUI Text + .h1() / .label() / .small() modifiers.
 */
import React, { memo } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import type { TextProps as RNTextProps, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import type { TypographyVariant } from '../../theme';

export interface TextProps extends RNTextProps {
  /** Typography variant — maps 1:1 to SwiftUI Font.mc* styles */
  variant?: TypographyVariant;
  /** Override text color */
  color?: string;
  /** Force bold weight */
  bold?: boolean;
  /** Center-align text */
  center?: boolean;
  /** Right-align text */
  right?: boolean;
  /** UPPERCASE transform (matches SwiftUI .uppercased()) */
  uppercase?: boolean;
  children: React.ReactNode;
}

/**
 * Themed Text component. Use `variant` to match SwiftUI typography.
 *
 * @example
 * ```tsx
 * <Text variant="h4">Hello</Text>
 * <Text variant="label" uppercase>Button</Text>
 * <Text variant="small" color={colors.mcWhite2}>Caption</Text>
 * ```
 */
export const Text: React.FC<TextProps> = memo(function Text({
  variant = 'body',
  bold = false,
  color,
  center = false,
  right = false,
  uppercase = false,
  style,
  children,
  ...rest
}) {
  const { colors, typography } = useTheme();

  const textColor = color || colors.mcWhite;

  const textStyle: TextStyle[] = [
    typography[variant],
    { color: textColor },
    bold && styles.bold,
    center && styles.center,
    right && styles.right,
    uppercase && styles.uppercase,
    style as TextStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <RNText accessibilityRole="text" style={textStyle} {...rest}>
      {children}
    </RNText>
  );
});

const styles = StyleSheet.create({
  bold: {
    fontWeight: '700' as const,
  },
  center: {
    textAlign: 'center' as const,
  },
  right: {
    textAlign: 'right' as const,
  },
  uppercase: {
    textTransform: 'uppercase' as const,
  },
});

export default Text;
