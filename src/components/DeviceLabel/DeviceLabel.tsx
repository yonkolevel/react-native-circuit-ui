/**
 * DeviceLabel — Matches DeviceLabel.swift
 *
 * SwiftUI implementation:
 * - HStack(spacing: makeSpacing(1)) { Image(systemName: "pianokeys") + Text(deviceName) }
 * - Icon and text both colored .mcWhite2
 * - fixedSize + lineLimit(1) → flexShrink: 0, numberOfLines={1}
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Icon, Icons } from '../../components/SFSymbol';
import { palette, makeSpacing } from '../../theme';
import { Text } from '../Text';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DeviceLabelProps {
  /** Device name to display. */
  deviceName: string;
  /** Icon tint color. Default: palette.mcWhite2. */
  iconColor?: string;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
}

// ─── Component ──────────────────────────────────────────────────────────────

const ICON_SIZE = 14;

export const DeviceLabel: React.FC<DeviceLabelProps> = memo(
  function DeviceLabel({ deviceName, iconColor = palette.mcWhite2, style }) {
    return (
      <View
        style={[styles.container, style]}
        accessibilityRole="text"
        accessibilityLabel={`Device: ${deviceName}`}
      >
        <Icon icon={Icons.piano} size={ICON_SIZE} color={iconColor} />
        <Text variant="body" color={palette.mcWhite2} numberOfLines={1}>
          {deviceName}
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
    flexShrink: 0, // matches SwiftUI .fixedSize()
    gap: makeSpacing(1), // 4 — matches SwiftUI HStack(spacing: makeSpacing(1))
  },
});

export default DeviceLabel;
