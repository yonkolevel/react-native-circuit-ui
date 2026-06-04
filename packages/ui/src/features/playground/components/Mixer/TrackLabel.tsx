/**
 * TrackLabel — Colored dot + track name
 *
 * Matches SwiftUI TrackLabelView:
 * - HStack: 12×12 Circle(color) + track.type.label text
 */
import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TrackLabelProps {
  /** Track display color */
  color: string;
  /** Track name */
  name: string;
  /** Test ID for testing */
  testID?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const TrackLabel: React.FC<TrackLabelProps> = memo(function TrackLabel({
  color,
  name,
  testID = 'track-label',
}) {
  const { colors } = useTheme();

  return (
    <View testID={testID} style={styles.container}>
      <View
        testID={`${testID}-dot`}
        style={[styles.dot, { backgroundColor: color }]}
      />
      <Text variant="label" color={colors.mcWhite}>
        {name}
      </Text>
    </View>
  );
});

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default TrackLabel;
