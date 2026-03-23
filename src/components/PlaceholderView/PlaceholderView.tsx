/**
 * PlaceholderView — Matches PlaceholderView.swift + PlaceholderType.swift
 *
 * SwiftUI implementation:
 * - VStack(alignment: .center, spacing: makeSpacing(7))
 *   - HStack(alignment: .center, spacing: makeSpacing(5)) with icon + text VStack
 *   - Optional HStack of ButtonPrimaryStyle buttons
 * - frame(maxWidth: 350, maxHeight: .infinity, alignment: .center)
 * - Icon maxHeight: 48 (iPhone) / 88 (desktop)
 * - Title: .mcTitle (.title2 ≈ 22pt) .semibold, mcWhite color
 * - Subtitle: .mcBody (.body), mcWhite2 color
 *
 * SF Symbol → Lucide mapping:
 *   magnifyingglass   → Search
 *   arrow.clockwise   → RefreshCw
 *   wifi.slash         → WifiOff
 *   exclamationmark.triangle → AlertTriangle
 *   gearshape          → Settings
 */
import React, { memo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  Search,
  RefreshCw,
  WifiOff,
  AlertTriangle,
  Settings,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Text } from '../Text';
import { Button } from '../Button';
import { useTheme } from '../../theme';
import { makeSpacing } from '../../theme/spacing';

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Placeholder type — mirrors Swift `PlaceholderType` enum.
 * Each variant carries its own title/subtitle/icon defaults.
 */
export type PlaceholderType =
  | { kind: 'empty'; title: string; subtitle: string }
  | { kind: 'unableToLoad' }
  | { kind: 'network' }
  | { kind: 'unknownError'; error?: string }
  | { kind: 'workInProgress' }
  | { kind: 'custom'; icon: LucideIcon; title: string; subtitle: string };

export interface PlaceholderButton {
  /** Button label text */
  title: string;
  /** Button press handler */
  onPress: () => void;
}

export interface PlaceholderViewProps {
  /** Placeholder type — determines icon, title, and subtitle */
  type: PlaceholderType;
  /** Optional action buttons (rendered with primary variant) */
  buttons?: PlaceholderButton[];
  /** Container style override */
  style?: StyleProp<ViewStyle>;
}

// ─── Icon Mapping ───────────────────────────────────────────────────────────

const ICON_MAP: Record<
  Exclude<PlaceholderType['kind'], 'custom'>,
  LucideIcon
> = {
  empty: Search,
  unableToLoad: RefreshCw,
  network: WifiOff,
  unknownError: AlertTriangle,
  workInProgress: Settings,
};

// ─── Default Strings ────────────────────────────────────────────────────────

function resolveContent(type: PlaceholderType): {
  icon: LucideIcon;
  title: string;
  subtitle: string;
} {
  switch (type.kind) {
    case 'empty':
      return {
        icon: ICON_MAP.empty,
        title: type.title,
        subtitle: type.subtitle,
      };
    case 'unableToLoad':
      return {
        icon: ICON_MAP.unableToLoad,
        title: 'Unable to load content.',
        subtitle:
          'Try again in a few minutes. If the problem persists contact support.',
      };
    case 'network':
      return {
        icon: ICON_MAP.network,
        title: 'You are not connected to the Internet',
        subtitle:
          'Please verify your internet connection. If the Problem persists contact support.',
      };
    case 'unknownError': {
      const title = type.error
        ? `Something went wrong: ${type.error}`
        : 'Something went wrong.';
      return {
        icon: ICON_MAP.unknownError,
        title,
        subtitle:
          'Try again in a few minutes or restart the application. If the problem persists contact support.',
      };
    }
    case 'workInProgress':
      return {
        icon: ICON_MAP.workInProgress,
        title: 'We are updating the content on this page.',
        subtitle:
          'We are doing our best to improve your experience. Please come back later.',
      };
    case 'custom':
      return {
        icon: type.icon,
        title: type.title,
        subtitle: type.subtitle,
      };
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export const PlaceholderView: React.FC<PlaceholderViewProps> = memo(
  function PlaceholderView({ type, buttons = [], style }) {
    const { colors } = useTheme();
    const { width } = useWindowDimensions();
    const isPhone = width < 768;

    const { icon: Icon, title, subtitle } = resolveContent(type);
    const iconSize = isPhone ? 48 : 88;

    return (
      <View
        style={[styles.container, style]}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`${title}. ${subtitle}`}
      >
        {/* Icon + Text row — matches SwiftUI HStack(spacing: makeSpacing(5)) */}
        <View style={styles.contentRow}>
          <Icon
            size={iconSize}
            color={colors.mcWhite}
            strokeWidth={1.5}
            accessibilityElementsHidden
          />

          {/* Title + Subtitle — matches SwiftUI VStack(spacing: makeSpacing(3)) */}
          <View style={styles.textColumn}>
            <Text
              variant="quote"
              bold
              numberOfLines={2}
            >
              {title}
            </Text>

            <Text variant="body" color={colors.mcWhite2}>
              {subtitle}
            </Text>
          </View>
        </View>

        {/* Action buttons — matches SwiftUI HStack(spacing: makeSpacing(5)) */}
        {buttons.length > 0 && (
          <View style={styles.buttonRow}>
            {buttons.map((button, index) => (
              <Button
                key={index}
                variant="primary"
                label={button.title}
                onPress={button.onPress}
                fullWidth
                style={styles.button}
              />
            ))}
          </View>
        )}
      </View>
    );
  }
);

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 350,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    // VStack spacing: makeSpacing(7) = 28
    gap: makeSpacing(7),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // HStack spacing: makeSpacing(5) = 20
    gap: makeSpacing(5),
  },
  textColumn: {
    flex: 1,
    // VStack spacing: makeSpacing(3) = 12
    gap: makeSpacing(3),
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    // HStack spacing: makeSpacing(5) = 20
    gap: makeSpacing(5),
  },
  button: {
    flex: 1,
  },
});

export default PlaceholderView;
