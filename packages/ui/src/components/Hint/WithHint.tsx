/**
 * WithHint — RN port of MidicircuitKit/Sources/SharedViews/WithHintView.swift.
 *
 * Wraps a target element and, while its hintID is the active hint, overlays a
 * pulsing HintBubble centered on the element plus a tooltip carrying the tip
 * text. The tooltip auto-dismisses after 3s (matching the iOS .popover dismiss
 * task) while the bubble persists until the step advances.
 *
 * The overlay is non-interactive (pointerEvents="none") so taps pass straight
 * through to the wrapped element — the tour advances when the user taps it.
 */
import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../Text';
import { HintBubble } from '../HintBubble';
import { useTheme, hexToRgba } from '../../theme';
import { useHintContext } from './HintContext';

/** Matches WithHintView.swift's 3-second popover auto-dismiss. */
const TOOLTIP_DISMISS_MS = 3000;

export interface WithHintProps {
  hintID: string;
  children: React.ReactNode;
  /** Where the tooltip sits relative to the element. Default 'below'. */
  tooltipPlacement?: 'above' | 'below';
  /** Style for the wrapper (e.g. flex:1 for full-size targets). */
  style?: StyleProp<ViewStyle>;
}

export const WithHint = memo(function WithHint({
  hintID,
  children,
  tooltipPlacement = 'below',
  style,
}: WithHintProps) {
  const { colors } = useTheme();
  const { activeHintIDs, tip } = useHintContext();
  const active = activeHintIDs.has(hintID);

  const [tooltipVisible, setTooltipVisible] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (active && tip) {
      setTooltipVisible(true);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(
        () => setTooltipVisible(false),
        TOOLTIP_DISMISS_MS
      );
    } else {
      setTooltipVisible(false);
    }
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [active, tip]);

  const tooltipBg = colors.mcBlack3;
  const tooltipBorder = hexToRgba(colors.mcGreen, 0.5);

  return (
    <View style={[styles.anchor, active && styles.activeAnchor, style]}>
      {children}

      {active && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.bubbleLayer]}
        >
          <HintBubble />
        </View>
      )}

      {active && tooltipVisible && tip ? (
        <View
          pointerEvents="none"
          style={[
            styles.tooltipLayer,
            tooltipPlacement === 'below'
              ? styles.tooltipBelow
              : styles.tooltipAbove,
          ]}
        >
          {tooltipPlacement === 'below' && (
            <View style={[styles.caretUp, { borderBottomColor: tooltipBg }]} />
          )}
          <View
            style={[
              styles.tooltipCard,
              { backgroundColor: tooltipBg, borderColor: tooltipBorder },
            ]}
          >
            <Text
              variant="caption"
              color={colors.mcWhite}
              style={styles.tooltipText}
            >
              {tip}
            </Text>
          </View>
          {tooltipPlacement === 'above' && (
            <View style={[styles.caretDown, { borderTopColor: tooltipBg }]} />
          )}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  anchor: {
    position: 'relative',
  },
  activeAnchor: {
    zIndex: 1000,
    elevation: 1000,
  },
  bubbleLayer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    elevation: 1001,
  },
  // Widened well beyond the wrapper so the tooltip can render at full width
  // and stay centered on the element regardless of the element's own size.
  tooltipLayer: {
    position: 'absolute',
    left: -200,
    right: -200,
    alignItems: 'center',
    zIndex: 1002,
    elevation: 1002,
  },
  tooltipBelow: {
    top: '100%',
    marginTop: 6,
  },
  tooltipAbove: {
    bottom: '100%',
    marginBottom: 6,
  },
  tooltipCard: {
    maxWidth: 260,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  tooltipText: {
    textAlign: 'center',
  },
  caretUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  caretDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
