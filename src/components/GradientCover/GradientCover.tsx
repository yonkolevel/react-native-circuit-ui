/**
 * GradientCover — Deterministic gradient based on UUID
 *
 * iOS: SVG gradient (pixel-perfect match with SwiftUI)
 * Android: expo-linear-gradient if available, else two-color split fallback
 */
import React, { memo, useMemo } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { palette } from '../../theme/colors';

const COLOR_OPTIONS = [
  palette.mcGreen, palette.mcBlue, palette.mcOrange, palette.mcPurple, palette.mcPink,
  palette.mcGreen2, palette.mcBlue2, palette.mcOrange2, palette.mcPurple2, palette.mcPink2,
] as const;

function stableHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function gradientColorsForId(id: string): [string, string] {
  const hash = stableHash(id);
  const count = COLOR_OPTIONS.length;
  let index1 = hash % count;
  let index2 = Math.floor(hash / 2) % count;
  if (index2 === index1) index2 = (index1 + 1) % count;
  return [COLOR_OPTIONS[index1]!, COLOR_OPTIONS[index2]!];
}

// Try to import expo-linear-gradient (optional dep)
let ExpoLinearGradient: any = null;
try {
  ExpoLinearGradient = require('expo-linear-gradient').LinearGradient;
} catch {
  // Not installed — will use fallback
}

export interface GradientCoverProps {
  id: string;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const GradientCover: React.FC<GradientCoverProps> = memo(
  function GradientCover({ id, width = 88, height = 88, style }) {
    const [color1, color2] = useMemo(() => gradientColorsForId(id), [id]);

    // iOS: use SVG
    if (Platform.OS === 'ios') {
      const Svg = require('react-native-svg').default;
      const { Defs, LinearGradient, Stop, Rect } = require('react-native-svg');
      return (
        <View style={[{ width, height }, style]}>
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

    // Android: expo-linear-gradient if available
    if (ExpoLinearGradient) {
      return (
        <ExpoLinearGradient
          colors={[color1, color2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[{ width, height }, style]}
        />
      );
    }

    // Fallback: two-color split
    return (
      <View style={[{ width, height, overflow: 'hidden' }, style]}>
        <View style={[styles.half, { backgroundColor: color1 }]} />
        <View style={[styles.half, { backgroundColor: color2 }]} />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  half: { flex: 1 },
});

export default GradientCover;
