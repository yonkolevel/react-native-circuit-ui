/**
 * HintBubble — Matches HintBubble.swift
 *
 * Two concentric pulsing green circles.
 * SwiftUI uses ZStack with two Circle views, each with .scale() animated
 * via Animation.easeInOut(duration: 2).repeatForever(autoreverses: true).
 *
 * Outer circle: 18×18 base, mcGreen2, opacity 0.8, scale 1.08 → 1.7
 * Inner circle: 28×28 base, mcGreen,  opacity 0.8, scale 1.0  → 1.5
 */
import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HintBubbleProps {
  /** Starting scale for the outer (smaller base) circle. Default: 1.08 */
  initialScale1?: number;
  /** Starting scale for the inner (larger base) circle. Default: 1.0 */
  initialScale2?: number;
  /** Container style */
  style?: StyleProp<ViewStyle>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Outer circle: 18×18 base, scales 1.08 → 1.7 */
const CIRCLE1_BASE = 18;
const CIRCLE1_SCALE_FROM = 1.08;
const CIRCLE1_SCALE_TO = 1.7;

/** Inner circle: 28×28 base, scales 1.0 → 1.5 */
const CIRCLE2_BASE = 28;
const CIRCLE2_SCALE_FROM = 1.0;
const CIRCLE2_SCALE_TO = 1.5;

/** Animation duration in ms (SwiftUI: 2 seconds) */
const ANIMATION_DURATION = 2000;

/** Both circles use 0.8 opacity */
const CIRCLE_OPACITY = 0.8;

// ─── Component ──────────────────────────────────────────────────────────────

export const HintBubble: React.FC<HintBubbleProps> = memo(function HintBubble({
  initialScale1 = CIRCLE1_SCALE_FROM,
  initialScale2 = CIRCLE2_SCALE_FROM,
  style,
}) {
  const { colors } = useTheme();

  // Shared values drive interpolated scale: 0 → 1 maps to scaleFrom → scaleTo
  const progress1 = useSharedValue(0);
  const progress2 = useSharedValue(0);

  useEffect(() => {
    // Both circles: easeInOut, 2s, repeat forever, autoreverse
    const timingConfig = {
      duration: ANIMATION_DURATION,
      easing: Easing.inOut(Easing.ease),
    };

    progress1.value = withRepeat(
      withTiming(1, timingConfig),
      -1, // repeat forever
      true // autoreverse
    );

    progress2.value = withRepeat(
      withTiming(1, timingConfig),
      -1, // repeat forever
      true // autoreverse
    );

    return () => {
      progress1.value = 0;
      progress2.value = 0;
    };
  }, [progress1, progress2]);

  // Animated style for outer circle (circle 1)
  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          progress1.value,
          [0, 1],
          [initialScale1, CIRCLE1_SCALE_TO]
        ),
      },
    ],
  }));

  // Animated style for inner circle (circle 2)
  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          progress2.value,
          [0, 1],
          [initialScale2, CIRCLE2_SCALE_TO]
        ),
      },
    ],
  }));

  // Compute max rendered size so the container doesn't clip
  const maxSize = Math.max(
    CIRCLE1_BASE * CIRCLE1_SCALE_TO,
    CIRCLE2_BASE * CIRCLE2_SCALE_TO
  );

  return (
    <View
      style={[styles.container, { width: maxSize, height: maxSize }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Hint available"
    >
      {/* Outer circle — smaller base (18), mcGreen2, scales larger */}
      <Animated.View
        style={[
          styles.circle,
          {
            width: CIRCLE1_BASE,
            height: CIRCLE1_BASE,
            borderRadius: CIRCLE1_BASE / 2,
            backgroundColor: colors.mcGreen2,
            opacity: CIRCLE_OPACITY,
          },
          animatedStyle1,
        ]}
      />
      {/* Inner circle — larger base (28), mcGreen, scales on top */}
      <Animated.View
        style={[
          styles.circle,
          {
            width: CIRCLE2_BASE,
            height: CIRCLE2_BASE,
            borderRadius: CIRCLE2_BASE / 2,
            backgroundColor: colors.mcGreen,
            opacity: CIRCLE_OPACITY,
          },
          animatedStyle2,
        ]}
      />
    </View>
  );
});

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
  },
});

export default HintBubble;
