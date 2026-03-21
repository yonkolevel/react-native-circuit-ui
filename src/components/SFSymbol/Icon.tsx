/**
 * Icon — Convenience wrapper that takes an IconDef from Icons map
 *
 * Usage:
 *   import { Icon, Icons } from './SFSymbol';
 *   <Icon icon={Icons.play} size={24} color="#fff" />
 */
import { memo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SFSymbol } from './SFSymbol';
import type { IconDef } from './icons';
import type { SFSymbolWeight } from './SFSymbol';

export interface IconProps {
  icon: IconDef;
  size?: number;
  color?: string;
  weight?: SFSymbolWeight;
  style?: StyleProp<ViewStyle>;
}

export const Icon = memo(function Icon({ icon, size = 24, color = '#FFFFFF', weight, style }: IconProps) {
  return (
    <SFSymbol
      name={icon.sf}
      fallback={icon.fallback}
      size={size}
      color={color}
      weight={weight}
      style={style}
    />
  );
});
