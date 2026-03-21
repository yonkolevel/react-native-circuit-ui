/**
 * MultiTouchOverlay — Native iOS multi-touch capture view.
 * Transparent overlay that maps touches to a grid. Blocks parent ScrollView.
 */
import { memo } from 'react';
import { requireNativeComponent, Platform, View } from 'react-native';
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

const NativeOverlay = Platform.OS === 'ios'
  ? requireNativeComponent<any>('RCTMultiTouchOverlay')
  : null;

export const MultiTouchOverlay = memo(function MultiTouchOverlay({
  rows = 4, columns = 4, onPadPress, onPadRelease, style, ...rest
}: MultiTouchOverlayProps) {
  if (!NativeOverlay) {
    return <View style={style} {...rest} />;
  }

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
