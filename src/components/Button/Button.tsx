/**
 * Button — Matches McButton / ButtonPrimaryStyle / ButtonSecondaryStyle / etc.
 *
 * Uses Pressable (not TouchableOpacity) per RN best practices.
 * Supports all SwiftUI variants: primary, secondary, normal, outline, solid.
 * Press-state color inversion matches SwiftUI ButtonStyle implementations.
 */
import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, ActivityIndicator, View } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { hexToRgba } from '../../theme/colors';
import { borderRadius as br, layout } from '../../theme/spacing';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'normal'
  | 'outline'
  | 'solid';

export type ButtonSize = 'medium' | 'large';

export interface ButtonProps
  extends Omit<PressableProps, 'style' | 'children'> {
  /** Button variant — matches SwiftUI ButtonPrimaryStyle etc. */
  variant?: ButtonVariant;
  /** Size — medium matches standard padding, large matches ButtonPrimaryLargeStyle */
  size?: ButtonSize;
  /** Button label text */
  label: string;
  /** Icon before label */
  leftIcon?: React.ReactNode;
  /** Icon after label */
  rightIcon?: React.ReactNode;
  /** Show loading spinner */
  loading?: boolean;
  /** Stretch to fill container width */
  fullWidth?: boolean;
  /** Pill-shaped border radius */
  rounded?: boolean;
  /** Custom accent color (overrides orange default) */
  color?: string;
  /** Custom style for the outer pressable */
  style?: StyleProp<ViewStyle>;
  a11yId?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const Button: React.FC<ButtonProps> = memo(function Button({
  variant = 'primary',
  size = 'medium',
  label,
  leftIcon,
  rightIcon,
  loading = false,
  fullWidth = false,
  rounded = false,
  disabled = false,
  color,
  style,
  a11yId,
  onPress,
  ...rest
}) {
  const { colors } = useTheme();
  const buttonColor = color || colors.orange;
  const isLarge = size === 'large';

  // ── Derived styles per variant (mirrors SwiftUI ButtonStyle bodies) ──

  const getStyles = useCallback(
    (pressed: boolean) => {
      const isDisabled = disabled || loading;

      // Background
      let bg: string;
      if (isDisabled) {
        bg =
          variant === 'secondary' || variant === 'outline'
            ? 'transparent'
            : colors.mcBlack2;
      } else {
        switch (variant) {
          case 'primary':
            bg = pressed ? colors.mcWhite : buttonColor;
            break;
          case 'secondary':
            bg = pressed ? buttonColor : 'transparent';
            break;
          case 'normal':
            bg = pressed ? hexToRgba(colors.mcBlack4, 0.8) : colors.mcBlack4;
            break;
          case 'outline':
            bg = 'transparent';
            break;
          case 'solid':
            bg = pressed ? colors.mcWhite : colors.mcBlue;
            break;
          default:
            bg = buttonColor;
        }
      }

      // Text color
      let text: string;
      if (isDisabled) {
        text = colors.mcWhite4;
      } else {
        switch (variant) {
          case 'primary':
            // Green buttons: black text normally, green text when pressed
            if (buttonColor === colors.mcGreen) {
              text = pressed ? colors.mcGreen : colors.mcBlack;
            } else {
              text = pressed ? buttonColor : colors.mcWhite;
            }
            break;
          case 'secondary':
            text = pressed ? colors.mcWhite : buttonColor;
            break;
          case 'normal':
            text = colors.mcWhite;
            break;
          case 'outline':
            text = buttonColor;
            break;
          case 'solid':
            text = pressed ? colors.mcBlue : colors.mcWhite;
            break;
          default:
            text = colors.mcWhite;
        }
      }

      // Border
      let borderColor = 'transparent';
      let borderWidth = 0;
      if (variant === 'secondary') {
        borderColor = isDisabled ? colors.mcWhite4 : buttonColor;
        borderWidth = 2;
      } else if (variant === 'outline') {
        borderColor = isDisabled ? colors.mcWhite4 : buttonColor;
        borderWidth = 1;
      }

      return { bg, text, borderColor, borderWidth };
    },
    [variant, buttonColor, disabled, loading, colors]
  );

  const padding = isLarge
    ? {
        paddingVertical: layout.buttonPaddingVerticalLarge,
        paddingHorizontal: layout.buttonPaddingHorizontalLarge,
      }
    : {
        paddingVertical: layout.buttonPaddingVertical,
        paddingHorizontal: layout.buttonPaddingHorizontal,
      };

  const textVariant = isLarge ? 'h4' : 'label';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      testID={a11yId}
      style={({ pressed }) => {
        const s = getStyles(pressed);
        return [
          styles.button,
          padding,
          {
            backgroundColor: s.bg,
            borderColor: s.borderColor,
            borderWidth: s.borderWidth,
            borderRadius: rounded ? br.pill : br.md,
            opacity: disabled ? 0.4 : 1,
          },
          fullWidth && styles.fullWidth,
          style,
        ];
      }}
      {...rest}
    >
      {({ pressed }) => {
        const s = getStyles(pressed);

        if (loading) {
          return <ActivityIndicator color={s.text} size="small" />;
        }

        return (
          <View style={styles.content}>
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            <Text variant={textVariant} color={s.text} uppercase>
              {label}
            </Text>
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </View>
        );
      }}
    </Pressable>
  );
});

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default Button;
