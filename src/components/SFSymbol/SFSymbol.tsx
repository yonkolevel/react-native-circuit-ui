/**
 * SFSymbol — Cross-platform icon component
 *
 * iOS: expo-symbols for native SF Symbols
 * Android: Text-based fallback (no SVG) to avoid Fabric topSvgLayout crash
 * Web: Lucide fallback
 */
import { memo } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

// iOS: expo-symbols
let SymbolView: any = null;
try {
  if (Platform.OS === 'ios') {
    SymbolView = require('expo-symbols').SymbolView;
  }
} catch {}

// Android: @expo/vector-icons (font-based, no SVG)
let MaterialCommunityIcons: any = null;
try {
  if (Platform.OS === 'android') {
    MaterialCommunityIcons =
      require('@expo/vector-icons/MaterialCommunityIcons').default;
  }
} catch {}

export type SFSymbolWeight =
  | 'ultraLight'
  | 'thin'
  | 'light'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy'
  | 'black';

export interface SFSymbolProps {
  name: string;
  fallback?: LucideIcon;
  /** Material Community Icons name for Android */
  androidIcon?: string;
  size?: number;
  color?: string;
  weight?: SFSymbolWeight;
  style?: StyleProp<ViewStyle>;
}

export const SFSymbol = memo(function SFSymbol({
  name,
  fallback: FallbackIcon,
  androidIcon,
  size = 24,
  color = '#FFFFFF',
  weight = 'regular',
  style,
}: SFSymbolProps) {
  // iOS: native SF Symbols
  if (Platform.OS === 'ios' && SymbolView) {
    return (
      <View style={[{ width: size, height: size }, style]}>
        <SymbolView
          name={name}
          size={size}
          tintColor={color}
          weight={weight}
          style={styles.symbol}
          resizeMode="scaleAspectFit"
        />
      </View>
    );
  }

  // Android: MaterialCommunityIcons (font-based, no SVG crash)
  if (Platform.OS === 'android' && MaterialCommunityIcons && androidIcon) {
    return (
      <View style={style}>
        <MaterialCommunityIcons name={androidIcon} size={size} color={color} />
      </View>
    );
  }

  // Web or fallback: Lucide (SVG — only safe on web/old arch)
  if (FallbackIcon) {
    return (
      <View style={style}>
        <FallbackIcon size={size} color={color} />
      </View>
    );
  }

  // Last resort: nothing
  return null;
});

const styles = StyleSheet.create({
  symbol: { width: '100%', height: '100%' },
});
