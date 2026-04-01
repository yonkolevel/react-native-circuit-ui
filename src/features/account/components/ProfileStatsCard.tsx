/**
 * ProfileStatsCard — Matches ProfileStatsCard.swift
 *
 * Displays a single stat with title and value in a card format.
 * Used to show Circuits, Lessons, Trophies counts.
 *
 * iOS Reference:
 * - Background: theme bg, cornerRadius 5, shadow radius 3
 * - Padding: makeSpacing(4) all sides
 * - Title: uppercase, caption font, secondary text color
 * - Value: mcH3Regular font, primary text color
 */
import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../../components/Text';
import { useTheme } from '../../../theme';
import { makeSpacing } from '../../../theme/spacing';

export interface ProfileStatsCardProps {
  /** Stat title (e.g., "Circuits", "Lessons", "Trophies") */
  title: string;
  /** Stat value as string (e.g., "3", "12") */
  value: string;
  /** Test ID for testing */
  testID?: string;
}

export const ProfileStatsCard = memo(function ProfileStatsCard({
  title,
  value,
  testID,
}: ProfileStatsCardProps) {
  const { colors, isDark } = useTheme();
  const bgColor = isDark ? colors.mcBlack2 : colors.mcWhite;
  const titleColor = isDark ? colors.mcWhite3 : colors.mcBlack3;
  const valueColor = isDark ? colors.mcWhite : colors.mcBlack;

  return (
    <View
      style={[styles.container, { backgroundColor: bgColor }]}
      testID={testID}
      accessibilityLabel={`${title}: ${value}`}
    >
      <Text variant="small" style={[styles.title, { color: titleColor }]}>
        {title.toUpperCase()}
      </Text>
      <Text variant="h3" style={[styles.value, { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: makeSpacing(4),
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    minHeight: 126, // Match iOS height: 126
  },
  title: {
    textTransform: 'uppercase',
  },
  value: {
    marginTop: 'auto',
    fontWeight: '400',
  },
});
