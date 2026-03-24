/**
 * MultiTouchOverlay — iOS native multi-touch capture view.
 */
import { memo } from 'react';
import { requireNativeComponent } from 'react-native';
import type { ViewProps } from 'react-native';

interface NativeEvent {
  nativeEvent: { index: number };
}

export interface MultiTouchOverlayProps extends ViewProps {
  rows?: number;
  columns?: number;
  onPadPress?: (index: number) => void;
  onPadRelease?: (index: number) => void;
}

const NativeOverlay = requireNativeComponent<any>('RCTMultiTouchOverlay');

export const MultiTouchOverlay = memo(function MultiTouchOverlay({
  rows = 4, columns = 4, onPadPress, onPadRelease, style, ...rest
}: MultiTouchOverlayProps) {
  return (
    <NativeOverlay
      rows={rows}
      columns={columns}
      onPadPress={(e: NativeEvent) => onPadPress?.(e.nativeEvent.index)}
      onPadRelease={(e: NativeEvent) => onPadRelease?.(e.nativeEvent.index)}
      style={style}
      {...rest}
    />
  );
});
