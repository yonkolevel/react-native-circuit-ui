import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface ProgressBarProps {
  /**
   * Progress value (0-100)
   * @default 0
   */
  value?: number;
  /**
   * Color of the progress bar
   * If not provided, uses white for dark mode and primary color for light mode
   */
  tintColor?: string;
  /**
   * Height of the progress bar
   * @default 4
   */
  height?: number;
  /**
   * Custom style for the container
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Duration of the animation in milliseconds
   * @default 300
   */
  animationDuration?: number;
  /**
   * Whether to animate the progress change
   * @default true
   */
  animated?: boolean;
}

/**
 * ProgressBar component for displaying progress
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  tintColor,
  height = 4,
  style,
  animationDuration = 300,
  animated = true,
}) => {
  const { colors, isDark } = useTheme();
  const animatedWidth = useRef(new Animated.Value(0)).current;

  const clampedValue = Math.min(Math.max(0, value), 100);

  const progressColor =
    tintColor || (isDark ? colors.mcWhite1 : colors.primary);

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: clampedValue,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(clampedValue);
    }
  }, [clampedValue, animatedWidth, animated, animationDuration]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { height }, style]}>
      <View style={[styles.track, { backgroundColor: colors.mcBlack1 }]} />

      <Animated.View
        style={[
          styles.progress,
          {
            backgroundColor: progressColor,
            width: widthInterpolated,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 2,
    position: 'relative',
  },
  track: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
});
