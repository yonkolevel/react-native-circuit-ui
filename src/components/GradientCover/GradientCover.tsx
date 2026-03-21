/**
 * GradientCover — Matches GradientCover.swift
 *
 * Deterministic gradient based on a UUID string.
 * Uses the same djb2 hash algorithm as SwiftUI to produce identical gradients.
 */
import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { palette } from '../../theme/colors';

// ─── Color Generator (port of GradientColorGenerator) ──────────────────────

const COLOR_OPTIONS = [
  palette.mcGreen,
  palette.mcBlue,
  palette.mcOrange,
  palette.mcPurple,
  palette.mcPink,
  palette.mcGreen2,
  palette.mcBlue2,
  palette.mcOrange2,
  palette.mcPurple2,
  palette.mcPink2,
] as const;

/**
 * djb2 stable hash — same algorithm as Swift GradientColorGenerator.stableHash()
 */
function stableHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Generate deterministic gradient colors from a UUID string.
 * Produces the same pair of colors as the Swift implementation.
 */
export function gradientColorsForId(id: string): [string, string] {
  const hash = stableHash(id);
  const count = COLOR_OPTIONS.length;

  let index1 = hash % count;
  let index2 = Math.floor(hash / 2) % count;

  if (index2 === index1) {
    index2 = (index1 + 1) % count;
  }

  return [COLOR_OPTIONS[index1]!, COLOR_OPTIONS[index2]!];
}

// ─── Static Gradient (matches StaticGradientCover) ──────────────────────────

export interface GradientCoverProps {
  /** UUID string (used to deterministically pick gradient colors) */
  id: string;
  /** Width. Default: 88 */
  width?: number;
  /** Height. Default: 88 */
  height?: number;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label. Default: 'Gradient cover'. */
  accessibilityLabel?: string;
}

export const GradientCover: React.FC<GradientCoverProps> = memo(
  function GradientCover({ id, width = 88, height = 88, style, accessibilityLabel = 'Gradient cover' }) {
    const [color1, color2] = useMemo(() => gradientColorsForId(id), [id]);

    return (
      <View
        style={[{ width, height }, style]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      >
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color1} stopOpacity="1" />
              <Stop offset="1" stopColor={color2} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width={width} height={height} fill="url(#grad)" />
        </Svg>
      </View>
    );
  }
);

export default GradientCover;
