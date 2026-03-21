/**
 * SoloButton — 32×32 toggle button displaying "S"
 *
 * Matches SwiftUI SoloButtonView:
 * - Active: white text on #00FF9E (mcGreen)
 * - Inactive: #666 text on #333 background
 * - cornerRadius 4
 */
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SoloButtonProps {
  /** Whether the track is currently soloed */
  isSoloed: boolean;
  /** Called when the button is pressed */
  onPress?: () => void;
  /** Test ID for testing */
  testID?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const SoloButton: React.FC<SoloButtonProps> = memo(
  function SoloButton({ isSoloed, onPress, testID = 'solo-button' }) {
    const { colors } = useTheme();

    const handlePress = useCallback(() => {
      onPress?.();
    }, [onPress]);

    const backgroundColor = isSoloed ? colors.mcGreen : '#333333';
    const textColor = isSoloed ? colors.mcWhite : '#666666';

    return (
      <Pressable
        testID={testID}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Solo"
        accessibilityState={{ selected: isSoloed }}
        style={[styles.button, { backgroundColor }]}
      >
        <Text variant="label" color={textColor} bold>
          S
        </Text>
      </Pressable>
    );
  }
);

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

export default SoloButton;
