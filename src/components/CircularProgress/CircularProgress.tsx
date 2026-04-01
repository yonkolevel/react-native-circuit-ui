/**
 * CircularProgress — Matches CircularProgressView.swift
 *
 * SwiftUI uses ZStack of Circle().stroke + Circle().trim + optional Text/checkmark.
 * RN uses react-native-svg for the arc rendering, with react-native-reanimated
 * for smooth animated transitions when progress changes.
 */
import React, { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Text } from '../Text';
import { useTheme } from '../../theme';

// ─── Animated SVG Circle ────────────────────────────────────────────────────

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

// ─── Types ──────────────────────────────────────────────────────────────────

export type CircularProgressSize = 'small' | 'large';

const SIZE_MAP: Record<CircularProgressSize, number> = {
  small: 70,
  large: 127,
};

export interface CircularProgressProps {
  /** Progress 0–1. Clamped. Matches SwiftUI `progress: Float`. */
  progress: number;
  /** Show percentage text inside. */
  showPercentage?: boolean;
  /** Color of the percentage text. Default: mcBlack */
  percentageColor?: string;
  /** Size preset. Default: small */
  size?: CircularProgressSize;
  /** Show checkmark at 100%. */
  showCheckMark?: boolean;
  /** Custom stroke width. Default: 7 (matches SwiftUI). */
  strokeWidth?: number;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Animation duration in ms. Default: 300. */
  animationDuration?: number;
  /** Animate progress changes. Default: true. */
  animated?: boolean;
  /** Accessibility label. Default: 'Progress'. */
  accessibilityLabel?: string;
}

// ─── Inner arc (extracted so animated props don't re-render the whole tree) ──

interface ProgressArcProps {
  cx: number;
  cy: number;
  r: number;
  stroke: string;
  strokeWidth: number;
  circumference: number;
  animatedOffset: SharedValue<number>;
  transform: string;
}

const ProgressArc: React.FC<ProgressArcProps> = memo(function ProgressArc({
  cx,
  cy,
  r,
  stroke,
  strokeWidth: sw,
  circumference,
  animatedOffset,
  transform,
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  return (
    <AnimatedSvgCircle
      cx={cx}
      cy={cy}
      r={r}
      stroke={stroke}
      strokeWidth={sw}
      fill="none"
      strokeLinecap="round"
      strokeDasharray={circumference}
      transform={transform}
      animatedProps={animatedProps}
    />
  );
});

// ─── Component ──────────────────────────────────────────────────────────────

export const CircularProgress: React.FC<CircularProgressProps> = memo(
  function CircularProgress({
    progress,
    showPercentage = false,
    percentageColor,
    size = 'small',
    showCheckMark = false,
    strokeWidth = 7,
    style,
    animationDuration = 300,
    animated = true,
    accessibilityLabel: accessibilityLabelProp = 'Progress',
  }) {
    const { colors } = useTheme();

    const diameter = SIZE_MAP[size];
    const radius = (diameter - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = diameter / 2;
    const clamped = Math.min(Math.max(0, progress), 1);
    const targetOffset = circumference * (1 - clamped);

    // Shared value drives the SVG arc offset on the UI thread
    const animatedOffset = useSharedValue(targetOffset);

    useEffect(() => {
      if (animated) {
        animatedOffset.value = withTiming(targetOffset, {
          duration: animationDuration,
        });
      } else {
        animatedOffset.value = targetOffset;
      }
    }, [targetOffset, animated, animationDuration, animatedOffset]);

    const pctColor = percentageColor || colors.mcBlack;
    const percentText = `${Math.round(clamped * 100)}%`;

    return (
      <View
        style={[styles.container, { width: diameter, height: diameter }, style]}
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabelProp}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(clamped * 100),
          text: percentText,
        }}
      >
        <Svg width={diameter} height={diameter}>
          {/* Track ring — SwiftUI Circle().stroke().opacity(0.3) */}
          <SvgCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.mcBlack4}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.3}
          />
          {/* Progress arc — SwiftUI Circle().trim().stroke() rotated -90° */}
          <ProgressArc
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.mcGreen2}
            strokeWidth={strokeWidth}
            circumference={circumference}
            animatedOffset={animatedOffset}
            transform={`rotate(-90, ${center}, ${center})`}
          />
        </Svg>

        {/* Center content */}
        <View style={styles.centerContent}>
          {showPercentage && (
            <Text variant="h3Regular" color={pctColor}>
              {percentText}
            </Text>
          )}
          {clamped === 1 && showCheckMark && !showPercentage && (
            <Text variant="h3" color={colors.mcGreen2} style={styles.checkmark}>
              ✓
            </Text>
          )}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 32,
  },
});

export default CircularProgress;
