/**
 * PanControl — Horizontal slider for pan (−1 to +1)
 *
 * Matches SwiftUI PanControlView:
 * - Arrow icon + Slider −1…+1 + label (C / L / R)
 * - |val| < 0.1 → "C" (center), val < 0 → "L", val > 0 → "R"
 */
import { memo, useCallback, useRef } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PanControlProps {
  /** Current pan value (−1 to +1) */
  value: number;
  /** Called when the slider value changes */
  onValueChange?: (value: number) => void;
  /** Test ID for testing */
  testID?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function getPanLabel(val: number): string {
  if (Math.abs(val) < 0.1) return 'C';
  return val < 0 ? 'L' : 'R';
}

// ─── Component ──────────────────────────────────────────────────────────────

export const PanControl: React.FC<PanControlProps> = memo(
  function PanControl({
    value,
    onValueChange,
    testID = 'pan-control',
  }) {
    const { colors } = useTheme();
    const trackWidth = useRef(0);

    const label = getPanLabel(value);

    const updateValue = useCallback(
      (locationX: number) => {
        if (trackWidth.current <= 0) return;
        const ratio = clamp(locationX / trackWidth.current, 0, 1);
        // Map 0–1 to −1…+1
        const newValue = Math.round((ratio * 2 - 1) * 100) / 100;
        onValueChange?.(clamp(newValue, -1, 1));
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

    // Convert −1…+1 to 0–100% for positioning
    const fillPercent = ((clamp(value, -1, 1) + 1) / 2) * 100;

    return (
      <View testID={testID} style={styles.container}>
        <Text variant="small" color={colors.secondaryText}>
          ↔
        </Text>
        <View
          testID={`${testID}-track`}
          style={styles.track}
          onLayout={handleLayout}
          {...panResponder.panHandlers}
        >
          {/* Center marker */}
          <View style={[styles.centerMarker, { backgroundColor: '#555555' }]} />
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
          color={colors.secondaryText}
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
  centerMarker: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: 10,
    marginLeft: -1,
    top: -2,
    borderRadius: 1,
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
    width: 20,
    textAlign: 'center',
  },
});

export default PanControl;
