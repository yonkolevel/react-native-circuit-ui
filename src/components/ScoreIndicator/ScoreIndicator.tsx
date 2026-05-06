/**
 * ScoreIndicator — Matches ScoreIndicator.swift
 *
 * SwiftUI implementation:
 * - ForEach(1...max) rendering star.fill or star based on index <= rating
 * - Each star is 20x20, displayed in an HStack (row)
 * - score is optional; when nil all stars are empty
 *
 * RN uses lucide-react-native Star icon with `fill` prop for filled state.
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../../theme';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScoreIndicatorProps {
  /** Current score (number of filled stars). When undefined, all stars are empty. */
  score?: number;
  /** Maximum number of stars. Default: 3 (matches Swift default) */
  max?: number;
  /** Star icon size in points. Default: 20 (matches Swift 20x20 frame) */
  size?: number;
  /** Star color override. Default: theme mcWhite */
  color?: string;
  /** Custom style for the container */
  style?: StyleProp<ViewStyle>;
  a11yId?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const ScoreIndicator: React.FC<ScoreIndicatorProps> = memo(
  function ScoreIndicator({ score, max = 3, size = 20, color, style, a11yId }) {
    const { colors } = useTheme();
    const starColor = color || colors.mcWhite;

    // Mirrors Swift: ForEach(1...max) with starType(index)
    const stars = Array.from({ length: max }, (_, i) => {
      const index = i + 1; // 1-based like Swift
      const isFilled = score != null && index <= score;

      return (
        <Star
          key={index}
          size={size}
          color={starColor}
          fill={isFilled ? starColor : 'transparent'}
          strokeWidth={1.5}
        />
      );
    });

    const accessibilityText =
      score != null
        ? `Score: ${score} out of ${max}`
        : `Score: unrated, ${max} stars`;

    return (
      <View
        style={[styles.container, style]}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityText}
        accessibilityValue={{
          min: 0,
          max,
          now: score ?? 0,
          text: accessibilityText,
        }}
        testID={a11yId}
      >
        {stars}
      </View>
    );
  }
);

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ScoreIndicator;
