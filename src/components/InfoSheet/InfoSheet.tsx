/**
 * InfoSheet — Matches InfoSheet.swift
 *
 * SwiftUI implementation:
 * - VStack(alignment: .leading, spacing: 24)
 * - Title: Text(title).font(.mcH4).foregroundColor(.mcOrange)
 * - Content (children)
 * - Spacer()
 * - Optional action button: ButtonPrimaryStyle, label uppercased, maxWidth 314, centered
 * - .padding(24).background(.white)
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../Text';
import { Button } from '../Button';
import { useTheme } from '../../theme';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface InfoSheetProps {
  /** Sheet title — displayed in h4 orange */
  title: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Action button press handler */
  onAction?: () => void;
  /** Sheet content */
  children: React.ReactNode;
  /** Container style override */
  style?: StyleProp<ViewStyle>;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const InfoSheet: React.FC<InfoSheetProps> = memo(function InfoSheet({
  title,
  actionLabel,
  onAction,
  children,
  style,
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Info sheet: ${title}`}
    >
      {/* Title — matches Text(title).font(.mcH4).foregroundColor(.mcOrange) */}
      <Text variant="h4" color={colors.mcOrange}>
        {title}
      </Text>

      {/* Content */}
      {children}

      {/* Spacer — pushes action button to bottom */}
      <View style={styles.spacer} />

      {/* Action button — matches ButtonPrimaryStyle, maxWidth 314, centered */}
      {actionLabel != null && (
        <View style={styles.actionWrapper}>
          <Button
            variant="primary"
            label={actionLabel}
            onPress={onAction}
            fullWidth
          />
        </View>
      )}
    </View>
  );
});

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    gap: 24,
    alignItems: 'flex-start',
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  actionWrapper: {
    maxWidth: 314,
    width: '100%',
    alignSelf: 'center',
  },
});

export default InfoSheet;
