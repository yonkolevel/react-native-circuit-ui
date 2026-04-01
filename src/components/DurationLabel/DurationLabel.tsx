/**
 * DurationLabel — Matches DurationLabel.swift
 *
 * SwiftUI implementation:
 * - HStack(spacing: makeSpacing(1)) { Image("clock") + Text(duration) }
 * - iconColor defaults to .mcWhite2
 * - Text color: .mcWhite2
 * - Format: "%2dh:%02dm" (e.g. 65 → " 1h:05m")
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Icon, Icons } from '../../components/SFSymbol';
import { palette, makeSpacing } from '../../theme';
import { Text } from '../Text';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DurationLabelProps {
  /** Total duration in minutes. */
  durationMinutes?: number;
  /** Icon tint color. Default: palette.mcWhite2. */
  iconColor?: string;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Port of Int.asTimeString() from MidicircuitKit/Sources/Utils/Time.swift.
 *
 * Converts total minutes into a human-readable duration string.
 * Format: `"%2dh:%02dm"` — e.g. 65 → " 1h:05m", 5 → " 0h:05m".
 *
 * NOTE: Swift's TimeParts uses misleading field names (seconds/minutes)
 * but the actual semantics are: divide totalMinutes by 60 → hours + remaining minutes.
 */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes - hours * 60;
  // Match Swift "%2dh:%02dm" — right-aligned hours in 2-char field, zero-padded minutes
  return `${String(hours).padStart(2, ' ')}h:${String(mins).padStart(2, '0')}m`;
}

// ─── Component ──────────────────────────────────────────────────────────────

const ICON_SIZE = 14;

export const DurationLabel: React.FC<DurationLabelProps> = memo(
  function DurationLabel({
    durationMinutes = 0,
    iconColor = palette.mcWhite2,
    style,
  }) {
    return (
      <View
        style={[styles.container, style]}
        accessibilityRole="text"
        accessibilityLabel={`Duration: ${formatDuration(durationMinutes).trim()}`}
      >
        <Icon icon={Icons.clock} size={ICON_SIZE} color={iconColor} />
        <Text variant="body" color={palette.mcWhite2} style={styles.text}>
          {formatDuration(durationMinutes)}
        </Text>
      </View>
    );
  }
);

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: makeSpacing(1), // 4 — matches SwiftUI HStack(spacing: makeSpacing(1))
  },
  text: {
    // No additional margin needed — gap handles spacing
  },
});

export default DurationLabel;
