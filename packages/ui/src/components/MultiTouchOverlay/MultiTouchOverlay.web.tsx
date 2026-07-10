/**
 * MultiTouchOverlay — Web implementation.
 *
 * Uses the browser Pointer Events API to support true multi-touch and
 * drag-to-play for touch/pen input, matching the Android JS responder implementation.
 * Mouse input stays click-only so desktop pads do not auto-trigger while dragging.
 *
 * Each pointer (finger, stylus, mouse button) is tracked independently
 * by pointerId. Moving a touch/pen pointer across cell boundaries fires release on
 * the old cell and press on the new one, enabling slide-to-play.
 */
import { memo, useRef, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import type { ViewProps, LayoutChangeEvent } from 'react-native';

export interface MultiTouchOverlayProps extends ViewProps {
  rows?: number;
  columns?: number;
  onPadPress?: (index: number) => void;
  onPadRelease?: (index: number) => void;
}

export const shouldDragPointer = ({ pointerType }: { pointerType?: string }) =>
  pointerType !== 'mouse';

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
  const callbacksRef = useRef({ onPadPress, onPadRelease });
  callbacksRef.current = { onPadPress, onPadRelease };

  const releasePointer = useCallback((pointerId: number) => {
    const cell = pointerCells.current.get(pointerId);
    if (cell === undefined) return;
    pointerCells.current.delete(pointerId);
    callbacksRef.current.onPadRelease?.(cell);
  }, []);

  const releaseAll = useCallback(() => {
    const cells = Array.from(pointerCells.current.values());
    pointerCells.current.clear();
    cells.forEach((cell) => callbacksRef.current.onPadRelease?.(cell));
  }, []);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof document === 'undefined' ||
      typeof window.addEventListener !== 'function' ||
      typeof document.addEventListener !== 'function'
    ) {
      return releaseAll;
    }
    const handleVisibilityChange = () => {
      if (document.hidden) releaseAll();
    };
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('blur', releaseAll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseAll();
    };
  }, [releaseAll]);

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

  const getPointerCell = useCallback(
    (e: any): number | null => {
      const nev = e.nativeEvent as PointerEvent;
      const target = e.currentTarget as Element | null;
      if (!target) return null;
      const rect = target.getBoundingClientRect();
      return touchToCell(nev.clientX - rect.left, nev.clientY - rect.top);
    },
    [touchToCell]
  );

  const handlePointerDown = useCallback(
    (e: any) => {
      const nev = e.nativeEvent as PointerEvent;
      const target = e.currentTarget as Element | null;
      target?.setPointerCapture?.(nev.pointerId);

      releasePointer(nev.pointerId);
      const cell = getPointerCell(e);
      if (cell !== null) {
        pointerCells.current.set(nev.pointerId, cell);
        callbacksRef.current.onPadPress?.(cell);
      }
    },
    [getPointerCell, releasePointer]
  );

  const handlePointerMove = useCallback(
    (e: any) => {
      const nev = e.nativeEvent as PointerEvent;
      const target = e.currentTarget as Element | null;
      const rect = target?.getBoundingClientRect();
      const isOutside = rect
        ? nev.clientX < rect.left ||
          nev.clientX >= rect.right ||
          nev.clientY < rect.top ||
          nev.clientY >= rect.bottom
        : false;
      const newCell = isOutside ? null : getPointerCell(e);
      const prevCell = pointerCells.current.get(nev.pointerId);

      if (!shouldDragPointer(nev)) {
        if (isOutside || newCell === null) releasePointer(nev.pointerId);
        return;
      }

      if (newCell !== prevCell) {
        releasePointer(nev.pointerId);
        if (newCell !== null) {
          pointerCells.current.set(nev.pointerId, newCell);
          callbacksRef.current.onPadPress?.(newCell);
        }
      }
    },
    [getPointerCell, releasePointer]
  );

  const handlePointerUp = useCallback(
    (e: any) => releasePointer((e.nativeEvent as PointerEvent).pointerId),
    [releasePointer]
  );

  const webPointerHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
    onPointerLeave: handlePointerUp,
    onLostPointerCapture: handlePointerUp,
  } as any;

  return (
    <View style={style} onLayout={onLayout} {...webPointerHandlers} {...rest} />
  );
});
