/**
 * ToolbarButton — Matches ToolbarButton.swift
 *
 * SwiftUI uses SF Symbols (chevron.left, sidebar.left).
 * RN uses lucide-react-native icons as the cross-platform equivalent.
 */
import React, { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Icon, Icons } from '../../components/SFSymbol';
import { useTheme } from '../../theme';

export type ToolbarButtonType = 'back' | 'toggleSidebar';

export interface ToolbarButtonProps {
  /** Button type — determines icon and default behavior. */
  type: ToolbarButtonType;
  /** Custom press handler. Overrides default behavior. */
  onPress?: () => void;
  /** Icon size. Default: 24. */
  size?: number;
  /** Custom icon color. Default: mcWhite2. */
  color?: string;
  /** Container style. */
  style?: StyleProp<ViewStyle>;
  /** Accessibility hint describing action result. */
  accessibilityHint?: string;
  a11yId?: string;
}

const ICON_MAP = {
  back: Icons.back,
  toggleSidebar: Icons.sidebar,
};

export const ToolbarButton: React.FC<ToolbarButtonProps> = memo(
  function ToolbarButton({
    type,
    onPress,
    size = 24,
    color,
    style,
    accessibilityHint,
    a11yId,
  }) {
    const { colors } = useTheme();
    const iconDef = ICON_MAP[type];
    const iconColor = color || colors.mcWhite2;

    return (
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={type === 'back' ? 'Go back' : 'Toggle sidebar'}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [
          styles.button,
          { opacity: pressed ? 0.6 : 1 },
          style,
        ]}
        testID={a11yId}
      >
        <Icon icon={iconDef} size={size} color={iconColor} />
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
});

export default ToolbarButton;
