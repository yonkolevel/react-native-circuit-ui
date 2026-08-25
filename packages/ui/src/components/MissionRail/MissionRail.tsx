import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/colors';

export type MissionRailMode = 'practice' | 'challenge';

export function missionRailColors(mode: MissionRailMode): [string, string] {
  return mode === 'practice'
    ? [palette.mcGreen, palette.mcBlue]
    : [palette.mcOrange, palette.mcPink];
}

export interface MissionRailProps {
  mode: MissionRailMode;
  label: string;
  testID?: string;
}

let ExpoLinearGradient: any = null;
try {
  ExpoLinearGradient = require('expo-linear-gradient').LinearGradient;
} catch {
  // The two-color fallback keeps the kit usable without Expo.
}

export const MissionRail = memo(function MissionRail({
  mode,
  label,
  testID,
}: MissionRailProps) {
  const colors = missionRailColors(mode);

  return (
    <View
      style={styles.container}
      testID={testID}
      accessibilityLabel={label}
      accessibilityRole="text"
    >
      {ExpoLinearGradient ? (
        <ExpoLinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      ) : (
        <View style={[styles.gradient, { backgroundColor: colors[0] }]} />
      )}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { minHeight: 24, justifyContent: 'center' },
  gradient: { height: 3, width: '100%' },
  label: {
    position: 'absolute',
    left: 16,
    color: palette.mcWhite3,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
