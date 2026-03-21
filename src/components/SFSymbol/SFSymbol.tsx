/**
 * SFSymbol — Cross-platform SF Symbol / Lucide icon component
 *
 * On iOS: Uses expo-symbols for native SF Symbols (UIImage(systemName:))
 * On Android/Web: Falls back to lucide-react-native
 *
 * Usage:
 *   <SFSymbol name="play.fill" fallback={Play} size={24} color="#fff" />
 *
 * The `name` prop uses SF Symbol naming (e.g., "square.grid.2x2", "music.quarternote.3")
 * The `fallback` prop is a Lucide icon component used on non-iOS platforms
 */
import { memo } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

// Conditionally import expo-symbols (iOS only)
let SymbolView: any = null;
try {
  if (Platform.OS === 'ios') {
    SymbolView = require('expo-symbols').SymbolView;
  }
} catch {
  // expo-symbols not installed — fall back to Lucide
}

export type SFSymbolWeight = 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';

export interface SFSymbolProps {
  /** SF Symbol name (e.g., "play.fill", "square.grid.2x2") */
  name: string;
  /** Lucide icon component as fallback for Android/Web */
  fallback?: LucideIcon;
  /** Icon size in points. Default: 24 */
  size?: number;
  /** Icon color */
  color?: string;
  /** SF Symbol weight. Default: 'regular' */
  weight?: SFSymbolWeight;
  /** Container style */
  style?: StyleProp<ViewStyle>;
}

export const SFSymbol = memo(function SFSymbol({
  name,
  fallback: FallbackIcon,
  size = 24,
  color = '#FFFFFF',
  weight = 'regular',
  style,
}: SFSymbolProps) {
  // iOS with expo-symbols available — use native SF Symbols
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

  // Fallback: Lucide icon
  if (FallbackIcon) {
    return (
      <View style={style}>
        <FallbackIcon size={size} color={color} />
      </View>
    );
  }

  // No fallback — render nothing
  return null;
});

const styles = StyleSheet.create({
  symbol: { width: '100%', height: '100%' },
});

export default SFSymbol;
