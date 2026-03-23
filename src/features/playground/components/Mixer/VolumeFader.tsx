/**
 * VolumeFader — Horizontal slider for volume (0–100)
 *
 * Matches SwiftUI VolumeFaderView:
 * - Speaker icon + Slider 0–100 + "%d%" text
 * - Track tint color when audible, gray when not
 *
 * Uses a View-based slider (no @react-native-community/slider dependency).
 * The track is a touchable area; drag/press sets the value proportionally.
 */
import { memo, useCallback, useRef } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VolumeFaderProps {
  /** Current volume value (0–100) */
  value: number;
  /** Track accent color (used as tint when audible) */
  trackColor: string;
  /** Whether the track is currently audible */
  isAudible: boolean;
  /** Called when the slider value changes */
  onValueChange?: (value: number) => void;
  /** Test ID for testing */
  testID?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

// ─── Component ──────────────────────────────────────────────────────────────

export const VolumeFader: React.FC<VolumeFaderProps> = memo(
  function VolumeFader({
    value,
    trackColor,
    isAudible,
    onValueChange,
    testID = 'volume-fader',
  }) {
    const { colors } = useTheme();
    const trackWidth = useRef(0);

    const tintColor = isAudible ? trackColor : '#666666';
    const label = `${Math.round(value)}%`;

    const updateValue = useCallback(
      (locationX: number) => {
        if (trackWidth.current <= 0) return;
        const ratio = clamp(locationX / trackWidth.current, 0, 1);
        const newValue = Math.round(ratio * 100);
        onValueChange?.(newValue);
      },
      [onValueChange]
    );

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          updateValue(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          updateValue(evt.nativeEvent.locationX);
        },
      })
    ).current;

    const handleLayout = useCallback((e: LayoutChangeEvent) => {
      trackWidth.current = e.nativeEvent.layout.width;
    }, []);

    const fillPercent = clamp(value, 0, 100);

    return (
      <View testID={testID} style={styles.container}>
        <Text variant="small" color={colors.mcWhite2}>
          🔊
        </Text>
        <View
          testID={`${testID}-track`}
          style={styles.track}
          onLayout={handleLayout}
          {...panResponder.panHandlers}
        >
          <View
            style={[
              styles.fill,
              {
                backgroundColor: tintColor,
                width: `${fillPercent}%`,
              },
            ]}
          />
          <View
            style={[
              styles.thumb,
              {
                left: `${fillPercent}%`,
                backgroundColor: colors.mcWhite,
              },
            ]}
          />
        </View>
        <Text
          testID={`${testID}-label`}
          variant="small"
          color={colors.mcWhite2}
          style={styles.label}
        >
          {label}
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
    gap: 8,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: '#333333',
    borderRadius: 3,
    justifyContent: 'center',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    top: -4,
  },
  label: {
    width: 36,
    textAlign: 'right',
  },
});

export default VolumeFader;
