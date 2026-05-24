/**
 * Android multi-touch grid overlay using raw touch events.
 *
 * Tracks all active pointers and maps them to grid cells.
 * When a pointer enters a new cell → onPadPress. When it leaves → onPadRelease.
 * Supports simultaneous touches (chords, rolls, fast tapping).
 */
import { memo, useRef, useCallback } from 'react';
import { View } from 'react-native';
import type {
  ViewProps,
  LayoutChangeEvent,
  GestureResponderEvent,
} from 'react-native';

export interface MultiTouchOverlayProps extends ViewProps {
  rows: number;
  columns: number;
  onPadPress?: (index: number) => void;
  onPadRelease?: (index: number) => void;
}

export const MultiTouchOverlay = memo(function MultiTouchOverlay({
  rows,
  columns,
  onPadPress,
  onPadRelease,
  style,
  ...rest
}: MultiTouchOverlayProps) {
  const layoutRef = useRef({ width: 0, height: 0 });
  // Track which cell each pointer is currently in (pointerId → cellIndex)
  const pointerCells = useRef<Map<number, number>>(new Map());

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    layoutRef.current = {
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    };
  }, []);

  const touchToCell = (x: number, y: number): number | null => {
    const { width, height } = layoutRef.current;
    if (width === 0 || height === 0) return null;
    const col = Math.floor((x / width) * columns);
    const row = Math.floor((y / height) * rows);
    if (col < 0 || col >= columns || row < 0 || row >= rows) return null;
    return row * columns + col;
  };

  const processPointers = useCallback(
    (e: GestureResponderEvent) => {
      const touches = e.nativeEvent.touches || [];
      const activePointers = new Set<number>();

      for (const touch of touches) {
        const pointerId = (touch as any).identifier ?? 0;
        activePointers.add(pointerId);
        const cell = touchToCell(touch.locationX, touch.locationY);
        const prevCell = pointerCells.current.get(pointerId);

        if (cell !== null && cell !== prevCell) {
          // Release previous cell if pointer moved to a new one
          if (prevCell !== undefined) {
            onPadRelease?.(prevCell);
          }
          pointerCells.current.set(pointerId, cell);
          onPadPress?.(cell);
        } else if (cell === null && prevCell !== undefined) {
          // Pointer moved outside grid
          onPadRelease?.(prevCell);
          pointerCells.current.delete(pointerId);
        }
      }

      // Release cells for pointers that are no longer active
      for (const [pointerId, cell] of pointerCells.current) {
        if (!activePointers.has(pointerId)) {
          onPadRelease?.(cell);
          pointerCells.current.delete(pointerId);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- touchToCell depends on columns/rows which are already listed
    [columns, rows, onPadPress, onPadRelease]
  );

  const onTouchEnd = useCallback(
    (e: GestureResponderEvent) => {
      // Release the ended pointer
      const pointerId = (e.nativeEvent as any).identifier ?? 0;
      const cell = pointerCells.current.get(pointerId);
      if (cell !== undefined) {
        onPadRelease?.(cell);
        pointerCells.current.delete(pointerId);
      }
    },
    [onPadRelease]
  );

  return (
    <View
      style={style}
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={processPointers}
      onResponderMove={processPointers}
      onResponderRelease={onTouchEnd}
      onResponderTerminate={onTouchEnd}
      {...rest}
    />
  );
});
