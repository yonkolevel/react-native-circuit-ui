/**
 * MultiTouchOverlay — Web implementation.
 *
 * Uses the browser Pointer Events API to support true multi-touch and
 * drag-to-play, matching the Android JS responder implementation.
 *
 * Each pointer (finger, stylus, mouse button) is tracked independently
 * by pointerId. Moving a pointer across cell boundaries fires release on
 * the old cell and press on the new one, enabling slide-to-play.
 */
import { memo, useRef, useCallback } from 'react';
import { View } from 'react-native';
import type { ViewProps, LayoutChangeEvent } from 'react-native';

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
  ...rest
}: MultiTouchOverlayProps) {
  const layoutRef = useRef({ width: 0, height: 0 });
  // Map from pointerId → current cell index
  const pointerCells = useRef<Map<number, number>>(new Map());

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    layoutRef.current = {
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    };
  }, []);

  const touchToCell = useCallback(
    (x: number, y: number): number | null => {
      const { width, height } = layoutRef.current;
      if (width === 0 || height === 0) return null;
      const col = Math.floor((x / width) * columns);
      const row = Math.floor((y / height) * rows);
      if (col < 0 || col >= columns || row < 0 || row >= rows) return null;
      return row * columns + col;
    },
    [columns, rows]
  );

  const handlePointerDown = useCallback(
    (e: any) => {
      const nev = e.nativeEvent as PointerEvent;
      // Capture so we receive move/up even after cursor leaves the element
      (nev.currentTarget as Element | null)?.setPointerCapture?.(nev.pointerId);

      // offsetX/Y is relative to the element's padding edge — exactly what we need
      // Fall back to clientX - rect.left if offsetX is unavailable
      const target = nev.currentTarget as Element | null;
      let x = nev.offsetX;
      let y = nev.offsetY;
      if (x === undefined && target) {
        const rect = target.getBoundingClientRect();
        x = nev.clientX - rect.left;
        y = nev.clientY - rect.top;
      }

      const cell = touchToCell(x, y);
      if (cell !== null) {
        pointerCells.current.set(nev.pointerId, cell);
        onPadPress?.(cell);
      }
    },
    [touchToCell, onPadPress]
  );

  const handlePointerMove = useCallback(
    (e: any) => {
      const nev = e.nativeEvent as PointerEvent;
      const target = nev.currentTarget as Element | null;
      let x = nev.offsetX;
      let y = nev.offsetY;
      if (x === undefined && target) {
        const rect = target.getBoundingClientRect();
        x = nev.clientX - rect.left;
        y = nev.clientY - rect.top;
      }

      const newCell = touchToCell(x, y);
      const prevCell = pointerCells.current.get(nev.pointerId);

      if (newCell !== prevCell) {
        if (prevCell !== undefined) onPadRelease?.(prevCell);
        if (newCell !== null) {
          pointerCells.current.set(nev.pointerId, newCell);
          onPadPress?.(newCell);
        } else {
          pointerCells.current.delete(nev.pointerId);
        }
      }
    },
    [touchToCell, onPadPress, onPadRelease]
  );

  const handlePointerUp = useCallback(
    (e: any) => {
      const nev = e.nativeEvent as PointerEvent;
      const prevCell = pointerCells.current.get(nev.pointerId);
      if (prevCell !== undefined) {
        onPadRelease?.(prevCell);
        pointerCells.current.delete(nev.pointerId);
      }
    },
    [onPadRelease]
  );

  return (
    <View
      style={style}
      onLayout={onLayout}
      // @ts-ignore — RN Web forwards these to the DOM element
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      {...rest}
    />
  );
});
