/**
 * Android multi-touch grid overlay using raw touch events.
 *
 * Tracks all active pointers and maps them to grid cells.
 * When a pointer enters a new cell → onPadPress. When it leaves → onPadRelease.
 * Supports simultaneous touches (chords, rolls, fast tapping).
 */
import { memo, useRef, useCallback, useEffect } from 'react';
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
  const onPadReleaseRef = useRef(onPadRelease);
  onPadReleaseRef.current = onPadRelease;
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
          if (prevCell !== undefined) {
            pointerCells.current.delete(pointerId);
            if (![...pointerCells.current.values()].includes(prevCell))
              onPadRelease?.(prevCell);
          }
          const isAlreadyHeld = [...pointerCells.current.values()].includes(
            cell
          );
          pointerCells.current.set(pointerId, cell);
          if (!isAlreadyHeld) onPadPress?.(cell);
        } else if (cell === null && prevCell !== undefined) {
          pointerCells.current.delete(pointerId);
          if (![...pointerCells.current.values()].includes(prevCell))
            onPadRelease?.(prevCell);
        }
      }

      // Release cells for pointers that are no longer active
      for (const [pointerId, cell] of pointerCells.current) {
        if (!activePointers.has(pointerId)) {
          pointerCells.current.delete(pointerId);
          if (![...pointerCells.current.values()].includes(cell))
            onPadRelease?.(cell);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- touchToCell depends on columns/rows which are already listed
    [columns, rows, onPadPress, onPadRelease]
  );

  const releaseAllPointers = useCallback(() => {
    const cells = new Set(pointerCells.current.values());
    pointerCells.current.clear();
    for (const cell of cells) onPadReleaseRef.current?.(cell);
  }, []);

  useEffect(() => releaseAllPointers, [releaseAllPointers]);

  return (
    <View
      style={style}
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={processPointers}
      onResponderStart={processPointers}
      onResponderMove={processPointers}
      onResponderEnd={processPointers}
      onResponderRelease={processPointers}
      onResponderTerminate={releaseAllPointers}
      {...rest}
    />
  );
});
