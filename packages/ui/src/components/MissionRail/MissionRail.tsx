import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { makeSpacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { palette } from '../../theme/colors';

export type MissionRailMode = 'practice' | 'challenge';

export function missionRailColors(mode: MissionRailMode): [string, string] {
  return mode === 'practice'
    ? [palette.mcGreen, palette.mcBlue]
    : [palette.mcOrange, palette.mcPink];
}

export interface MissionRailProps {
  mode: MissionRailMode;
  /** Display copy for the mode, already cased for reading (e.g. "Practice"). */
  label: string;
  /**
   * How far through the step the learner is, 0–1. When given, the rule fills to
   * that fraction instead of running the full width, so the band says both
   * which mode this is and how it is going. Omit for a plain mode rule.
   */
  progress?: number;
  testID?: string;
}

let ExpoLinearGradient: any = null;
try {
  ExpoLinearGradient = require('expo-linear-gradient').LinearGradient;
} catch {
  // The two-color fallback keeps the kit usable without Expo.
}

/**
 * A mode band: a tinted rule with the mode named underneath it.
 *
 * The rule doubles as the step's progress meter. A separate meter bar under it
 * made three full-width horizontals stack up in ~30pt of tray, which read as
 * clutter rather than as information.
 */
export const MissionRail = memo(function MissionRail({
  mode,
  label,
  progress,
  testID,
}: MissionRailProps) {
  const colors = missionRailColors(mode);
  const hasProgress = progress != null;
  const filled = Math.max(0, Math.min(1, progress ?? 1));

  return (
    <View
      style={styles.container}
      testID={testID}
      // The band is one element to assistive tech. Without `accessible` the
      // label below the rule is announced a second time as its own node.
      accessible
      accessibilityLabel={label}
      accessibilityRole="text"
    >
      <View style={[styles.rule, hasProgress && styles.ruleTrack]}>
        {/* The width goes on the gradient itself. Wrapping it in a sized View
         * did not clip it — RN leaves overflow visible — so the rule painted
         * full width at every value and said nothing about progress. */}
        {ExpoLinearGradient ? (
          <ExpoLinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { width: `${filled * 100}%` }]}
          />
        ) : (
          <View style={[styles.fill, { width: `${filled * 100}%` }]}>
            <View
              style={[styles.fallbackHalf, { backgroundColor: colors[0] }]}
            />
            <View
              style={[styles.fallbackHalf, { backgroundColor: colors[1] }]}
            />
          </View>
        )}
      </View>
      <Text
        style={[styles.label, { color: colors[0] }]}
        numberOfLines={1}
        importantForAccessibility="no-hide-descendants"
      >
        {label}
      </Text>
    </View>
  );
});

const RULE_HEIGHT = 3;

const styles = StyleSheet.create({
  container: { paddingBottom: makeSpacing(1) },
  rule: { height: RULE_HEIGHT, width: '100%' },
  // Only a rule that means progress needs a track behind it.
  ruleTrack: { backgroundColor: palette.mcWhite6 },
  fill: { height: RULE_HEIGHT, flexDirection: 'row' },
  fallbackHalf: { flex: 1, height: '100%' },
  label: {
    ...typography.extraSmall10SemiBold,
    marginTop: makeSpacing(1),
    paddingHorizontal: makeSpacing(4),
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
