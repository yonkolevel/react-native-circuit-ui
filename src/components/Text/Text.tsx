import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import type { TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../../theme';

export type TextVariant =
  | 'h1'
  | 'h1Regular'
  | 'h2'
  | 'h3'
  | 'h3Regular'
  | 'h4'
  | 'h5'
  | 'body'
  | 'label'
  | 'labelBold'
  | 'labelRegular'
  | 'labelRegular2'
  | 'labelRegular3'
  | 'quote'
  | 'quoteBold'
  | 'small'
  | 'buttonLabelBold'
  | 'buttonLabelSemiBold'
  | 'extraSmall'
  | 'extraSmallSemiBold'
  | 'extraSmall10';

export interface TextProps extends RNTextProps {
  /**
   * The variant of the text, which determines the font size, weight, and other styling
   */
  variant?: TextVariant;

  /**
   * Whether the text should be bold
   */
  bold?: boolean;

  /**
   * The color of the text. If not provided, it will use the primary text color from the theme
   */
  color?: string;

  /**
   * Whether the text should be centered
   */
  center?: boolean;

  /**
   * Whether the text should be right-aligned
   */
  right?: boolean;

  /**
   * Whether the text should be uppercase
   */
  uppercase?: boolean;

  /**
   * Children to render
   */
  children: React.ReactNode;
}

/**
 * Text component that supports various typography styles from the theme
 */
export const Text: React.FC<TextProps> = ({
  variant = 'body',
  bold = false,
  color,
  center = false,
  right = false,
  uppercase = false,
  style,
  children,
  ...rest
}) => {
  const { colors, typography } = useTheme();

  const textColor = color || colors.primaryText;

  const textStyle = [
    typography[variant],
    bold && styles.bold,
    center && styles.center,
    right && styles.right,
    uppercase && styles.uppercase,
    { color: textColor },
    style,
  ];

  return (
    <RNText style={textStyle} {...rest}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  bold: {
    fontWeight: 'bold',
  },
  center: {
    textAlign: 'center',
  },
  right: {
    textAlign: 'right',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});

export default Text;
