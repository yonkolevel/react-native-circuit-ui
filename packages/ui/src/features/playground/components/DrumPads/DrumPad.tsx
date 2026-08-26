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
import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';
import type { Sample } from '../../types';
import {
  isEditorCapabilityAllowed,
  useResolvedEditorPolicy,
  type EditorPolicy,
} from '../../stores/editorPolicy';

export interface DrumPadProps {
  sample?: Sample;
  index: number;
  isExternallyPressed: boolean;
  highlightColor: string;
  onPress?: (sampleIndex: number) => void;
  onRelease?: (sampleIndex: number) => void;
  a11yId?: string;
  editorPolicy?: EditorPolicy;
}

export const DrumPad = memo(function DrumPad({
  sample,
  index,
  isExternallyPressed,
  highlightColor,
  onPress,
  onRelease,
  a11yId,
  editorPolicy,
}: DrumPadProps) {
  const { colors } = useTheme();
  const [isDown, setIsDown] = useState(false);
  const isDownRef = useRef(false);
  const policy = useResolvedEditorPolicy(editorPolicy);
  const disabled = !isEditorCapabilityAllowed(policy, 'liveRecording');

  const isActive = isDown || isExternallyPressed;

  const handlePressIn = useCallback(() => {
    if (disabled || isDownRef.current) return;
    isDownRef.current = true;
    setIsDown(true);
    onPress?.(index);
  }, [disabled, index, onPress]);

  const handlePressOut = useCallback(() => {
    if (!isDownRef.current) return;
    isDownRef.current = false;
    setIsDown(false);
    onRelease?.(index);
  }, [index, onRelease]);

  useEffect(() => {
    if (disabled) handlePressOut();
  }, [disabled, handlePressOut]);

  // Empty pad — mcBlack2. A View, not a Pressable: there is nothing to play,
  // so it must not present itself to touch or assistive tech as a control.
  if (!sample) {
    return <View style={[styles.pad, { backgroundColor: colors.mcBlack2 }]} />;
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
      accessibilityState={{
        selected: isActive,
        disabled: disabled || undefined,
      }}
      accessibilityHint="Double tap to play"
      testID={a11yId}
    >
      {/* Matches Swift: .font(.system(size: 8, weight: .medium)) .foregroundStyle(Color.white.opacity(0.5)) */}
      <Text
        variant="small"
        color={isActive ? colors.mcBlack : colors.mcWhite2}
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
  label: { fontSize: 12, textAlign: 'center' },
});
