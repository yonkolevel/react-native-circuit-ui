/**
 * CircuitUI Spacing System
 *
 * Matches MidicircuitKit/Sources/Utils/Spacing.swift
 * Base unit: 4pt (same as `makeSpacing(_ multiplier: Int)`)
 */
import type { ViewStyle } from 'react-native';
import {
  spacing,
  makeSpacing,
  layout,
  borderRadius,
  cardDimensions,
} from '@circuit-ui/tokens';

export { spacing, makeSpacing, layout, borderRadius, cardDimensions };

// ─── Shadows ────────────────────────────────────────────────────────────────
// SwiftUI uses .shadow(radius: 6) on cards

export const shadows: Record<'none' | 'sm' | 'md' | 'lg', ViewStyle> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  /** Matches SwiftUI .shadow(radius: 6) */
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export default {
  spacing,
  makeSpacing,
  layout,
  borderRadius,
  shadows,
  cardDimensions,
};
