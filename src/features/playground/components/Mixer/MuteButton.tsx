/**
 * MuteButton — 32×32 toggle button displaying "M"
 *
 * Matches SwiftUI MuteButtonView:
 * - Active: white text on #FF5C24 (mcOrange)
 * - Inactive: #666 text on #333 background
 * - cornerRadius 4
 */
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MuteButtonProps {
  /** Whether the track is currently muted */
  isMuted: boolean;
  /** Called when the button is pressed */
  onPress?: () => void;
  /** Test ID for testing */
  testID?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const MuteButton: React.FC<MuteButtonProps> = memo(function MuteButton({
  isMuted,
  onPress,
  testID = 'mute-button',
}) {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const backgroundColor = isMuted ? colors.mcOrange : '#333333';
  const textColor = isMuted ? colors.mcWhite : '#666666';

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Mute"
      accessibilityState={{ selected: isMuted }}
      style={[styles.button, { backgroundColor }]}
    >
      <Text variant="label" color={textColor} bold>
        M
      </Text>
    </Pressable>
  );
});

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MuteButton;
