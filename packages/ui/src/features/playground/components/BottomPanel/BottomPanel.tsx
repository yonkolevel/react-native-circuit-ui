/**
 * BottomPanel — expandable bottom sheet for instruments
 *
 * iOS: takes lower ~50% of screen when expanded
 * Collapsed: just the drag handle bar visible
 */
import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../../../theme';

export interface BottomPanelProps {
  isExpanded: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

export const BottomPanel = memo(function BottomPanel({
  isExpanded,
  onToggle,
  children,
}: BottomPanelProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.container,
        isExpanded && styles.expanded,
        { backgroundColor: colors.mcBlack2, borderTopColor: colors.mcBlack4 },
      ]}
      accessibilityLabel="Bottom panel"
    >
      <Pressable onPress={onToggle} style={styles.handle}>
        <View
          style={[styles.handleBar, { backgroundColor: colors.mcWhite4 }]}
        />
      </Pressable>
      {isExpanded && <View style={styles.content}>{children}</View>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { borderTopWidth: 1 },
  expanded: { height: 350 },
  handle: { alignItems: 'center', paddingVertical: 8 },
  handleBar: { width: 36, height: 4, borderRadius: 2 },
  content: { flex: 1 },
});
