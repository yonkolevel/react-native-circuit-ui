/**
 * MultiTouchOverlay — Web implementation.
 * Renders a pressable grid of cells (rows × columns) so drum pads and piano
 * keys fire their callbacks on web. Single-touch only (browser limitation).
 */
import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import type { ViewProps } from 'react-native';

export interface MultiTouchOverlayProps extends ViewProps {
  rows?: number;
  columns?: number;
  onPadPress?: (index: number) => void;
  onPadRelease?: (index: number) => void;
}

export const MultiTouchOverlay = memo(function MultiTouchOverlay({
  rows = 1,
  columns = 1,
  onPadPress,
  onPadRelease,
  style,
}: MultiTouchOverlayProps) {
  return (
    <View style={[styles.grid, style]}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: columns }, (_, col) => {
            const index = row * columns + col;
            return (
              <Pressable
                key={col}
                style={styles.cell}
                onPressIn={() => onPadPress?.(index)}
                onPressOut={() => onPadRelease?.(index)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  grid: { flex: 1, flexDirection: 'column' },
  row: { flexDirection: 'row', flex: 1 },
  cell: { flex: 1 },
});
