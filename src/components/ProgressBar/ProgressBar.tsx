/**
 * ProgressBar — Matches ProgressBarView.swift
 *
 * SwiftUI implementation uses GeometryReader + Rectangle with frame width.
 * This RN version uses layout-based width percentage for the fill bar,
 * animated via react-native-reanimated for optimal performance.
 */
import React, { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

export interface ProgressBarProps {
  /** Progress value 0–100 (clamped). Matches SwiftUI `value` param. */
  value?: number;
  /** Fill color. Default: mcWhite (dark) / primary (light). */
  tintColor?: string;
  /** Bar height in pt. Default: 4 (matches SwiftUI minHeight/idealHeight/maxHeight). */
  height?: number;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
  /** Animation duration in ms. Default: 300. */
  animationDuration?: number;
  /** Animate value changes. Default: true. */
  animated?: boolean;
  /** Accessibility label. Default: 'Progress'. */
  accessibilityLabel?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = memo(
  function ProgressBar({
    value = 0,
    tintColor,
    height = 4,
    style,
    animationDuration = 300,
    animated = true,
    accessibilityLabel = 'Progress',
  }) {
    const { colors, isDark } = useTheme();
    const progress = useSharedValue(0);

    const clampedValue = Math.min(Math.max(0, value), 100);
    const progressColor =
      tintColor || (isDark ? colors.mcWhite : colors.primary);

    useEffect(() => {
      if (animated) {
        progress.value = withTiming(clampedValue, {
          duration: animationDuration,
        });
      } else {
        progress.value = clampedValue;
      }
    }, [clampedValue, progress, animated, animationDuration]);

    const fillStyle = useAnimatedStyle(() => {
      const widthPercent = interpolate(
        progress.value,
        [0, 100],
        [0, 100],
        Extrapolation.CLAMP
      );
      return {
        width: `${widthPercent}%`,
      };
    });

    return (
      <View
        style={[styles.container, { height }, style]}
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: clampedValue,
          text: `${clampedValue}%`,
        }}
      >
        {/* Track — matches SwiftUI Rectangle().foregroundColor(.mcBlack) */}
        <View
          style={[styles.track, { backgroundColor: colors.mcBlack }]}
        />
        {/* Fill — matches SwiftUI Rectangle().foregroundColor(tintColor) */}
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: progressColor,
            },
            fillStyle,
          ]}
        />
      </View>
    );
  }
);

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
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
});

export default ProgressBar;
