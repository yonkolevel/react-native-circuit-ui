/**
 * LevelIndicator — Matches LevelIndicator.swift
 *
 * SwiftUI implementation:
 * - ZStack of HStack(bars) + HStack(circles)
 * - LevelIndicator = HStack(LevelIcon + Text)
 * - Text uses .subheadline font, .uppercased()
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';

// ─── Types ──────────────────────────────────────────────────────────────────

export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface LevelIconProps {
  /** Difficulty level */
  level?: Level;
  /** Color for active elements */
  tintColor: string;
  /** Color for inactive elements. Default: theme mcBlack4 (dark) / mcWhite4 (light) */
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export interface LevelIndicatorProps {
  level?: Level;
  tintColor: string;
  /** Text color. Default: mcWhite (dark) / mcBlack (light) */
  textColor?: string;
  /** Inactive element color. Default: mcBlack (matches SwiftUI default param) */
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  /** Override display label (e.g. "easy" instead of "beginner") */
  label?: string;
  /** Map levels to custom labels */
  levelLabels?: Partial<Record<Level, string>>;
}

// ─── LevelIcon ──────────────────────────────────────────────────────────────

export const LevelIcon: React.FC<LevelIconProps> = memo(function LevelIcon({
  level = 'beginner',
  tintColor,
  backgroundColor,
  style,
}) {
  const { colors } = useTheme();
  // Matches SwiftUI: backgroundColor defaults to .mcBlack4
  const bgColor = backgroundColor || colors.mcBlack4;

  const isLevel2 = level === 'intermediate' || level === 'advanced';
  const isLevel3 = level === 'advanced';

  return (
    <View style={[styles.iconContainer, style]}>
      {/* Bars layer (behind circles in SwiftUI ZStack) */}
      <View style={styles.barsContainer}>
        <View
          style={[
            styles.bar,
            { backgroundColor: isLevel2 ? tintColor : bgColor },
          ]}
        />
        <View
          style={[
            styles.bar,
            { backgroundColor: isLevel3 ? tintColor : bgColor },
          ]}
        />
      </View>
      {/* Circles layer */}
      <View style={styles.circlesContainer}>
        <View style={[styles.circle, { backgroundColor: tintColor }]} />
        <View
          style={[
            styles.circle,
            { backgroundColor: isLevel2 ? tintColor : bgColor },
          ]}
        />
        <View
          style={[
            styles.circle,
            { backgroundColor: isLevel3 ? tintColor : bgColor },
          ]}
        />
      </View>
    </View>
  );
});

// ─── LevelIndicator ─────────────────────────────────────────────────────────

export const LevelIndicator: React.FC<LevelIndicatorProps> = memo(
  function LevelIndicator({
    level = 'beginner',
    tintColor,
    textColor,
    backgroundColor,
    style,
    label,
    levelLabels,
  }) {
    const { colors, isDark } = useTheme();

    const txtColor = textColor || (isDark ? colors.mcWhite : colors.mcBlack);
    // SwiftUI default: .mcBlack
    const bgColor = backgroundColor || colors.mcBlack;

    const displayText = levelLabels?.[level] ?? label ?? level;

    return (
      <View
        style={[styles.container, style]}
        accessibilityRole="text"
        accessibilityLabel={`Difficulty level: ${displayText}`}
      >
        <LevelIcon
          level={level}
          tintColor={tintColor}
          backgroundColor={bgColor}
        />
        <Text
          variant="small"
          uppercase
          color={txtColor}
          style={styles.levelText}
        >
          {displayText}
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
  },
  // Matches SwiftUI ZStack with ~ 46x12 area
  iconContainer: {
    position: 'relative',
    width: 46,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 30, // 2 bars (10) + spacing (10)
    gap: 10, // SwiftUI HStack spacing: 10
  },
  bar: {
    width: 10,
    height: 2.5,
  },
  circlesContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 46, // 3 dots (12) + spacing (5)
    gap: 5, // SwiftUI HStack spacing: 5
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  levelText: {
    marginLeft: 8, // SwiftUI HStack spacing: 8
  },
});

export default LevelIndicator;
