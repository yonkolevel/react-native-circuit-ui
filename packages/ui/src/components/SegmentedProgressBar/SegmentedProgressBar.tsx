/**
 * SegmentedProgressBar — Matches SegmentedProgressBarView.swift
 *
 * SwiftUI: HStack of Rectangles, height 12, filled green or white,
 * with RoundedRectangle(cornerRadius: 6) clip.
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface SegmentedProgressBarProps {
  /** Total number of segments. Default: 2. */
  segmentsCount?: number;
  /** Number of completed (filled) segments. Default: 0. */
  completedSegments?: number;
  /** Color for completed segments. Default: mcGreen. */
  completedColor?: string;
  /** Color for incomplete segments. Default: mcWhite. */
  incompleteColor?: string;
  /** Height of each bar segment. Default: 12 (matches SwiftUI). */
  height?: number;
  /** Gap between segments. Default: 4. */
  gap?: number;
  /** Container style. */
  style?: StyleProp<ViewStyle>;
}

export const SegmentedProgressBar: React.FC<SegmentedProgressBarProps> = memo(
  function SegmentedProgressBar({
    segmentsCount = 2,
    completedSegments = 0,
    completedColor,
    incompleteColor,
    height = 12,
    gap = 4,
    style,
  }) {
    const { colors } = useTheme();

    const filledColor = completedColor || colors.mcGreen;
    const emptyColor = incompleteColor || colors.mcWhite;

    return (
      <View
        style={[styles.container, { gap }, style]}
        accessibilityRole="progressbar"
        accessibilityLabel={`Progress: ${completedSegments} of ${segmentsCount} segments completed`}
        accessibilityValue={{
          min: 0,
          max: segmentsCount,
          now: completedSegments,
          text: `${completedSegments} of ${segmentsCount}`,
        }}
      >
        {Array.from({ length: segmentsCount }, (_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              {
                height,
                backgroundColor:
                  index < completedSegments ? filledColor : emptyColor,
              },
            ]}
          />
        ))}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
    borderRadius: 6, // matches SwiftUI RoundedRectangle(cornerRadius: 6.0)
  },
});

export default SegmentedProgressBar;
