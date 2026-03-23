/**
 * DrumPad — Matches Swift PadsView pad rendering
 *
 * SwiftUI: Rectangle().fill(isActive ? highlightColor : .mcBlack3)
 * - No border radius — plain Rectangle()
 * - Shows sample.fileName in .system(size: 8, weight: .medium)
 * - Text: Color.white.opacity(0.5)
 * - Empty pads: mcBlack2 fill
 * - Press state tracked via onPressIn/onPressOut
 */
import { memo, useState, useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';
import type { Sample } from '../../types';

export interface DrumPadProps {
  sample?: Sample;
  index: number;
  isExternallyPressed: boolean;
  highlightColor: string;
  onPress?: (sampleIndex: number) => void;
  onRelease?: (sampleIndex: number) => void;
}

export const DrumPad = memo(function DrumPad({
  sample,
  index,
  isExternallyPressed,
  highlightColor,
  onPress,
  onRelease,
}: DrumPadProps) {
  const { colors } = useTheme();
  const [isDown, setIsDown] = useState(false);

  const isActive = isDown || isExternallyPressed;

  const handlePressIn = useCallback(() => {
    setIsDown(true);
    onPress?.(index);
  }, [index, onPress]);

  const handlePressOut = useCallback(() => {
    setIsDown(false);
    onRelease?.(index);
  }, [index, onRelease]);

  // Empty pad — mcBlack2
  if (!sample) {
    return (
      <Pressable style={[styles.pad, { backgroundColor: colors.mcBlack2 }]} />
    );
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.pad,
        { backgroundColor: isActive ? highlightColor : colors.mcBlack3 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Drum pad: ${sample.fileName}`}
      accessibilityState={{ selected: isActive }}
    >
      {/* Matches Swift: .font(.system(size: 8, weight: .medium)) .foregroundStyle(Color.white.opacity(0.5)) */}
      <Text
        variant="extraSmall"
        color="rgba(255,255,255,0.5)"
        numberOfLines={2}
        style={styles.label}
      >
        {sample.fileName}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pad: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  label: { fontSize: 8, textAlign: 'center' },
});
