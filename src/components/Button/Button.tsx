import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import type { TouchableOpacityProps } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { spacing, borderRadius } from '../../theme/spacing';
import { hexToRgba } from '../../theme/colors';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'normal'
  | 'outline'
  | 'solid';
export type ButtonSize = 'medium' | 'large';

export interface ButtonProps extends TouchableOpacityProps {
  /**
   * The variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * The size of the button
   * @default 'medium'
   */
  size?: ButtonSize;

  /**
   * The text to display inside the button
   */
  label: string;

  /**
   * Icon to display before the label
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to display after the label
   */
  rightIcon?: React.ReactNode;

  /**
   * Whether the button is in a loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Whether the button is full width
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Whether the button is rounded
   * @default false
   */
  rounded?: boolean;

  /**
   * Custom color for the button (primary and secondary variants)
   */
  color?: string;
}

/**
 * Button component that supports various styles and states
 */
export const Button: React.FC<ButtonProps> = ({
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
  onPress,
  ...rest
}) => {
  const { colors } = useTheme();
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const getBackgroundColor = () => {
    if (disabled) return colors.black2;

    const buttonColor = color || colors.orange;

    switch (variant) {
      case 'primary':
        return isPressed ? colors.white : buttonColor;
      case 'secondary':
        return isPressed ? buttonColor : 'transparent';
      case 'normal':
        return isPressed ? hexToRgba(colors.black4, 0.8) : colors.black4;
      case 'outline':
        return 'transparent';
      case 'solid':
        return isPressed ? colors.white : colors.blue;
      default:
        return buttonColor;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.white4;

    const buttonColor = color || colors.orange;

    switch (variant) {
      case 'primary':
        if (buttonColor === colors.green) {
          return isPressed ? colors.green : colors.black;
        }
        return isPressed ? buttonColor : colors.white;
      case 'secondary':
        return isPressed ? colors.white : buttonColor;
      case 'normal':
        return colors.white;
      case 'outline':
        return buttonColor;
      case 'solid':
        return isPressed ? colors.blue : colors.white;
      default:
        return colors.white;
    }
  };

  const getBorderColor = () => {
    if (disabled) return 'transparent';

    const buttonColor = color || colors.orange;

    switch (variant) {
      case 'secondary':
        return buttonColor;
      case 'outline':
        return buttonColor;
      default:
        return 'transparent';
    }
  };

  const getBorderWidth = () => {
    switch (variant) {
      case 'secondary':
        return 2;
      case 'outline':
        return 1;
      default:
        return 0;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'large':
        return {
          paddingVertical: 8,
          paddingHorizontal: 22,
        };
      case 'medium':
      default:
        return {
          paddingVertical: spacing.custom(3),
          paddingHorizontal: spacing.custom(4),
        };
    }
  };

  const getTextVariant = () => {
    switch (size) {
      case 'large':
        return 'h4';
      case 'medium':
      default:
        return 'label';
    }
  };

  const getOpacity = () => {
    if (disabled) {
      return 0.4;
    }
    return 1;
  };

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: getBackgroundColor(),
      borderColor: getBorderColor(),
      borderWidth: getBorderWidth(),
      borderRadius: rounded ? borderRadius.pill : 6,
      opacity: getOpacity(),
      ...getPadding(),
    },
    fullWidth && styles.fullWidth,
    style,
  ];

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={getTextColor()} size="small" />;
    }

    return (
      <View style={styles.contentContainer}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <Text variant={getTextVariant()} color={getTextColor()} uppercase>
          {label}
        </Text>
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
      {...rest}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
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
