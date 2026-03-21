/**
 * Input — Matches LabeledTextField.swift
 *
 * SwiftUI implementation:
 * - Height: 36pt
 * - Left padding: 16pt
 * - Border: secondaryText at 0.6 opacity
 * - Corner radius: 6
 */
import React, { memo, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import type {
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { borderRadius, layout } from '../../theme/spacing';

// ─── Types ──────────────────────────────────────────────────────────────────

export type InputState = 'normal' | 'focused' | 'error' | 'success' | 'disabled';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Label above the input */
  label?: string;
  /** Error message (shows error state) */
  error?: string;
  /** Helper text below input */
  helperText?: string;
  /** Leading icon/element */
  leftIcon?: React.ReactNode;
  /** Trailing icon/element */
  rightIcon?: React.ReactNode;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Input field style */
  inputStyle?: StyleProp<ViewStyle>;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const Input: React.FC<InputProps> = memo(function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  disabled = false,
  style,
  inputStyle,
  onFocus,
  onBlur,
  accessibilityLabel: accessibilityLabelProp,
  ...rest
}) {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const state: InputState = disabled
    ? 'disabled'
    : error
      ? 'error'
      : isFocused
        ? 'focused'
        : 'normal';

  const getBorderColor = () => {
    switch (state) {
      case 'focused':
        return colors.primary;
      case 'error':
        return colors.error;
      case 'disabled':
        return colors.disabled;
      default:
        // Matches SwiftUI: secondaryText at 0.6 opacity
        return isDark
          ? 'rgba(247, 247, 247, 0.48)' // mcWhite2 * 0.6
          : 'rgba(26, 28, 32, 0.36)'; // mcBlack2 * 0.6
    }
  };

  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  return (
    <View style={style}>
      {label && (
        <Text
          variant="label"
          color={colors.secondaryText}
          style={styles.label}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: isDark ? colors.mcBlack3 : colors.mcWhite,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            {
              color: colors.primaryText,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.tertiaryText}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={accessibilityLabelProp || label}
          accessibilityState={{ disabled }}
          accessibilityHint={error || helperText}
          {...rest}
        />

        {rightIcon && (
          <Pressable style={styles.rightIcon}>{rightIcon}</Pressable>
        )}
      </View>

      {(error || helperText) && (
        <Text
          variant="small"
          color={error ? colors.error : colors.tertiaryText}
          style={styles.helperText}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.inputHeight, // 36pt — matches SwiftUI
    borderWidth: 1,
    borderRadius: borderRadius.md, // 6pt
    paddingHorizontal: layout.inputPaddingHorizontal, // 16pt
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0, // Reset default padding
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  helperText: {
    marginTop: 4,
  },
});

export default Input;
