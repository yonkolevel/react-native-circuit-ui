/**
 * PreviewLabel & PreviewDot — Matches PreviewLabel.swift
 *
 * PreviewLabel: Capsule-shaped pill with "Preview" text, mcOrange background.
 * SwiftUI: Text("Preview").font(.caption).padding(.vertical, 4).padding(.horizontal, 8)
 *          .background(Capsule(style: .continuous).fill(Color.mcOrange))
 *
 * PreviewDot: 12×12 circle with mcOrange fill.
 * SwiftUI: Circle().frame(width: 12, height: 12).foregroundColor(Color.mcOrange)
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';

// ─── PreviewLabel ───────────────────────────────────────────────────────────

export interface PreviewLabelProps {
  /** Container style override */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label. Default: 'Preview'. */
  accessibilityLabel?: string;
}

/**
 * Pill-shaped badge displaying "Preview" text on an mcOrange background.
 *
 * @example
 * ```tsx
 * <PreviewLabel />
 * <PreviewLabel style={{ marginLeft: 8 }} />
 * ```
 */
export const PreviewLabel: React.FC<PreviewLabelProps> = memo(
  function PreviewLabel({
    style,
    accessibilityLabel = 'Preview',
  }) {
    const { colors, borderRadius } = useTheme();

    return (
      <View
        style={[
          styles.labelContainer,
          {
            backgroundColor: colors.mcOrange,
            borderRadius: borderRadius.pill,
          },
          style,
        ]}
        accessible
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel}
      >
        <Text
          variant="small"
          color={colors.mcWhite}
          style={styles.labelText}
        >
          Preview
        </Text>
      </View>
    );
  }
);

// ─── PreviewDot ─────────────────────────────────────────────────────────────

export interface PreviewDotProps {
  /** Container style override */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label. Default: 'Preview indicator'. */
  accessibilityLabel?: string;
}

/**
 * 12×12 circle indicator with mcOrange fill.
 *
 * @example
 * ```tsx
 * <PreviewDot />
 * <PreviewDot style={{ marginRight: 4 }} />
 * ```
 */
export const PreviewDot: React.FC<PreviewDotProps> = memo(
  function PreviewDot({
    style,
    accessibilityLabel = 'Preview indicator',
  }) {
    const { colors } = useTheme();

    return (
      <View
        style={[
          styles.dot,
          { backgroundColor: colors.mcOrange },
          style,
        ]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      />
    );
  }
);

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  labelContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  labelText: {
    // Reset any default line-height offset for tight capsule fit
    includeFontPadding: false,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default PreviewLabel;
