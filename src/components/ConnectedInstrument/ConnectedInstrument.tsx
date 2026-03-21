/**
 * ConnectedInstrument — Matches ConnectedInstrumentView.swift
 *
 * SwiftUI implementation:
 * - HStack { Image(systemName: "pianokeys") + Text(deviceName) }
 * - Icon: .mcGreen when connected, .mcWhite when not
 * - Text: .callout font, colorScheme == .dark ? .mcWhite3 : .mcBlack3
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Icon, Icons } from '../../components/SFSymbol';
import { useTheme, palette, makeSpacing } from '../../theme';
import { Text } from '../Text';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConnectedInstrumentProps {
  /** Name of the connected MIDI device. */
  deviceName: string;
  /** Whether the device is currently connected. */
  isConnected: boolean;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
}

// ─── Component ──────────────────────────────────────────────────────────────

const ICON_SIZE = 16;

export const ConnectedInstrument: React.FC<ConnectedInstrumentProps> = memo(
  function ConnectedInstrument({ deviceName, isConnected, style }) {
    const { isDark } = useTheme();

    const iconColor = isConnected ? palette.mcGreen : palette.mcWhite;
    const textColor = isDark ? palette.mcWhite3 : palette.mcBlack3;

    return (
      <View
        style={[styles.container, style]}
        accessibilityRole="text"
        accessibilityLabel={`${deviceName}, ${isConnected ? 'connected' : 'disconnected'}`}
      >
        <Icon icon={Icons.piano} size={ICON_SIZE} color={iconColor} />
        <Text variant="body" color={textColor} numberOfLines={1}>
          {deviceName}
        </Text>
      </View>
    );
  },
);

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: makeSpacing(2), // 8 — matches SwiftUI HStack default spacing
  },
});

export default ConnectedInstrument;
