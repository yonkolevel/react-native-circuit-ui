/**
 * MultiTouchOverlay — cross-platform multi-touch grid.
 *
 * iOS: Native UIView (RCTMultiTouchOverlay) for zero-latency touch capture.
 * Android: JS-based pointer tracking via responder system.
 */
import { memo } from 'react';
import { requireNativeComponent, Platform } from 'react-native';
import type { ViewProps } from 'react-native';
import { AndroidMultiTouch } from './AndroidMultiTouch';

interface NativeEvent {
  nativeEvent: { index: number };
}

export interface MultiTouchOverlayProps extends ViewProps {
  rows?: number;
  columns?: number;
  onPadPress?: (index: number) => void;
  onPadRelease?: (index: number) => void;
}

const NativeOverlay = Platform.OS === 'ios'
  ? requireNativeComponent<any>('RCTMultiTouchOverlay')
  : null;

export const MultiTouchOverlay = memo(function MultiTouchOverlay({
  rows = 4, columns = 4, onPadPress, onPadRelease, style, ...rest
}: MultiTouchOverlayProps) {
  if (Platform.OS === 'ios' && NativeOverlay) {
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
  }

  // Android: JS-based multi-touch
  return (
    <AndroidMultiTouch
      rows={rows}
      columns={columns}
      onPadPress={onPadPress}
      onPadRelease={onPadRelease}
      style={style}
      {...rest}
    />
  );
});
