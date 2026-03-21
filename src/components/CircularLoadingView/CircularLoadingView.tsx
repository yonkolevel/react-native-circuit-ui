/**
 * CircularLoadingView — Matches CircularLoadingView.swift
 *
 * SwiftUI renders a dashed Circle with an AngularGradient (full → 0.5 opacity)
 * that rotates 10° every 60ms via a repeating Timer.
 *
 * RN renders 15 individual round-capped dots around a circle of radius 50,
 * each with linearly interpolated opacity (1.0 → 0.5), and rotates the
 * entire SVG group continuously using react-native-reanimated.
 */
import React, { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { useTheme } from '../../theme';

// ─── Constants (from Swift source) ──────────────────────────────────────────

/** Number of dots around the circle */
const DOT_COUNT = 15;

/** Circle radius in points */
const RADIUS = 50;

/** Stroke width / dot diameter */
const LINE_WIDTH = 10;

/** Diameter of the view (radius × 2) */
const DIAMETER = RADIUS * 2;

/** Rotation step per tick in degrees */
const ROTATION_STEP_DEG = 10;

/** Timer interval in milliseconds */
const TICK_INTERVAL_MS = 60;

/**
 * Full rotation duration derived from step & interval:
 * 360° / 10° = 36 steps × 60ms = 2160ms
 */
const FULL_ROTATION_MS = (360 / ROTATION_STEP_DEG) * TICK_INTERVAL_MS;

/**
 * Angular gradient range (Swift: startAngle 14° → endAngle 360°).
 * Opacity goes from 1.0 at the first dot to 0.5 at the last dot.
 */
const OPACITY_START = 1.0;
const OPACITY_END = 0.5;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CircularLoadingViewProps {
  /** Optional size override. Default uses the Swift radius × 2 (100). */
  size?: number;
  /** Override stroke/dot color. Default: theme primaryText. */
  color?: string;
  /** Container style */
  style?: StyleProp<ViewStyle>;
}

// ─── Pre-computed dot positions & opacities ─────────────────────────────────

interface DotData {
  cx: number;
  cy: number;
  opacity: number;
}

const CENTER = DIAMETER / 2;

/**
 * Build an array of 15 dot descriptors.
 *
 * Swift dash pattern [1, spaceLength] with dashPhase 0.5 distributes dots
 * evenly around the circumference. We replicate by placing dots at
 * equal angular intervals.
 *
 * The AngularGradient in Swift goes from startAngle 14° to 360° —
 * roughly one dot offset (360°/15 ≈ 24°). We interpolate opacity
 * from 1.0 (first dot) to 0.5 (last dot) linearly.
 */
const dots: DotData[] = Array.from({ length: DOT_COUNT }, (_, i) => {
  // Evenly spaced angles starting from the top (-90° offset so dot 0 is at 12 o'clock)
  const angleDeg = (i * 360) / DOT_COUNT - 90;
  const angleRad = (angleDeg * Math.PI) / 180;

  // Opacity: linearly interpolate from 1.0 to 0.5 across dots
  const t = i / (DOT_COUNT - 1);
  const opacity = OPACITY_START + t * (OPACITY_END - OPACITY_START);

  return {
    cx: CENTER + RADIUS * Math.cos(angleRad),
    cy: CENTER + RADIUS * Math.sin(angleRad),
    opacity,
  };
});

// ─── Component ──────────────────────────────────────────────────────────────

export const CircularLoadingView: React.FC<CircularLoadingViewProps> = memo(
  function CircularLoadingView({ size, color, style }) {
    const { colors } = useTheme();
    const rotation = useSharedValue(0);

    // Start continuous rotation on mount
    useEffect(() => {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: FULL_ROTATION_MS,
          easing: Easing.linear,
        }),
        -1, // repeat forever
        false // no autoreverse — continuous rotation
      );

      return () => {
        rotation.value = 0;
      };
    }, [rotation]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const dotColor = color ?? colors.primaryText;
    const viewSize = size ?? DIAMETER;

    return (
      <Animated.View
        style={[
          styles.container,
          {
            width: viewSize,
            height: viewSize,
          },
          animatedStyle,
          style,
        ]}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading"
        accessibilityState={{ busy: true }}
      >
        <Svg
          width={viewSize}
          height={viewSize}
          viewBox={`0 0 ${DIAMETER} ${DIAMETER}`}
        >
          {dots.map((dot, i) => (
            <SvgCircle
              key={i}
              cx={dot.cx}
              cy={dot.cy}
              r={LINE_WIDTH / 2}
              fill={dotColor}
              opacity={dot.opacity}
            />
          ))}
        </Svg>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CircularLoadingView;
