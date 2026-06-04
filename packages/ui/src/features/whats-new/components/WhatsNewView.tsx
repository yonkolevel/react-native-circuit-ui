/**
 * WhatsNewView — Full port of WhatsNewKit's WhatsNewView.swift.
 *
 * Features:
 * - Configurable layout (spacing, sizing, alignment)
 * - Primary action with customizable colors + haptic feedback
 * - Optional secondary action (dismiss, openURL, custom handler)
 * - Feature images: SF Symbol (with fallback), asset, or custom element
 * - Auto-persists presented version on dismiss (if versionStore provided)
 * - Dark theme by default (Midicircuit brand)
 *
 * Usage:
 *   <WhatsNewView
 *     whatsNew={{ version: { major: 2, minor: 0, patch: 0 }, features: [...] }}
 *     versionStore={asyncStorageStore}
 *     onDismiss={() => setVisible(false)}
 *   />
 */
import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import type {
  WhatsNewViewProps,
  WhatsNewFeature,
  WhatsNewFeatureImage,
  WhatsNewPrimaryAction,
  WhatsNewSecondaryAction,
} from '../types';
import { resolveLayout } from '../models/WhatsNewLayout';
import { fireHaptic } from '../utils/haptics';

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_ACCENT = '#FF5C24'; // mcOrange
const DEFAULT_PRIMARY_BG = DEFAULT_ACCENT;
const DEFAULT_PRIMARY_FG = '#000000';
const DEFAULT_TITLE = "What's New";
const DEFAULT_PRIMARY_TITLE = 'Continue';

// ─── SF Symbol Fallback ─────────────────────────────────────────────────────

const SF_SYMBOL_FALLBACK: Record<string, string> = {
  'musical.notes': '♫',
  'music.note': '♪',
  'music.note.list': '♪',
  'waveform': '〜',
  'waveform.circle': '〜',
  'star.fill': '★',
  'star': '☆',
  'sparkles': '✦',
  'bolt.fill': '⚡',
  'bolt': '⚡',
  'mic.fill': '🎤',
  'mic': '🎤',
  'guitars.fill': '🎸',
  'guitars': '🎸',
  'pianokeys.inverse': '🎹',
  'speaker.wave.3.fill': '🔊',
  'arrow.down.circle': '↓',
  'square.and.arrow.up': '↑',
  'person.crop.circle': '👤',
  'trophy.fill': '🏆',
  'trophy': '🏆',
  'chart.bar.fill': '📊',
  'paintbrush.fill': '🖌',
  'slider.horizontal.3': '☰',
  'gear': '⚙',
  'bell.fill': '🔔',
  'checkmark.circle.fill': '✓',
  'rectangle.stack.fill': '▤',
  'hammer.fill': '🔨',
  'link': '🔗',
  'heart.fill': '❤',
  'hand.thumbsup.fill': '👍',
  'exclamationmark.triangle.fill': '⚠',
};

// ─── Feature Image ──────────────────────────────────────────────────────────

function FeatureImage({
  image,
  width,
}: {
  image: WhatsNewFeatureImage;
  width: number;
}) {
  if (image.type === 'custom') {
    return (
      <View
        style={[styles.featureImageContainer, { width }]}
        testID="whats-new-icon"
      >
        {image.element}
      </View>
    );
  }

  // systemName or asset — use fallback text
  const icon =
    image.type === 'systemName'
      ? (SF_SYMBOL_FALLBACK[image.name] ?? '●')
      : image.name.charAt(0).toUpperCase();

  const color = image.color ?? DEFAULT_ACCENT;

  return (
    <View
      style={[styles.featureImageContainer, { width }]}
      testID="whats-new-icon"
    >
      <Text style={[styles.featureImageText, { color }]}>{icon}</Text>
    </View>
  );
}

// ─── Feature Row ────────────────────────────────────────────────────────────

function FeatureRow({
  feature,
  imageWidth,
  horizontalSpacing,
  horizontalAlignment,
  verticalSpacing,
}: {
  feature: WhatsNewFeature;
  imageWidth: number;
  horizontalSpacing: number;
  horizontalAlignment: 'top' | 'center';
  verticalSpacing: number;
}) {
  return (
    <View
      style={[
        styles.featureRow,
        {
          gap: horizontalSpacing,
          alignItems: horizontalAlignment === 'top' ? 'flex-start' : 'center',
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${feature.title}. ${feature.subtitle}`}
    >
      <FeatureImage image={feature.image} width={imageWidth} />
      <View style={[styles.featureContent, { gap: verticalSpacing }]}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
      </View>
    </View>
  );
}

// ─── Secondary Action Button ────────────────────────────────────────────────

function SecondaryActionButton({
  action,
  onDismiss,
}: {
  action: WhatsNewSecondaryAction;
  onDismiss: () => void;
}) {
  const handlePress = useCallback(() => {
    void fireHaptic(action.hapticFeedback);

    switch (action.action.type) {
      case 'dismiss':
        onDismiss();
        break;
      case 'openURL':
        void Linking.openURL(action.action.url);
        break;
      case 'custom':
        action.action.handler();
        break;
    }
  }, [action, onDismiss]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Text
        style={[
          styles.secondaryActionText,
          { color: action.foregroundColor ?? DEFAULT_ACCENT },
        ]}
      >
        {action.title}
      </Text>
    </TouchableOpacity>
  );
}

// ─── WhatsNewView ───────────────────────────────────────────────────────────

export function WhatsNewView({
  whatsNew,
  versionStore,
  layout: layoutOverride,
  onDismiss,
}: WhatsNewViewProps) {
  const layout = resolveLayout(layoutOverride);
  const primary: Required<WhatsNewPrimaryAction> = useMemo(
    () => ({
      title: whatsNew.primaryAction?.title ?? DEFAULT_PRIMARY_TITLE,
      backgroundColor:
        whatsNew.primaryAction?.backgroundColor ?? DEFAULT_PRIMARY_BG,
      foregroundColor:
        whatsNew.primaryAction?.foregroundColor ?? DEFAULT_PRIMARY_FG,
      hapticFeedback:
        whatsNew.primaryAction?.hapticFeedback ?? (undefined as any),
      onDismiss: whatsNew.primaryAction?.onDismiss ?? (undefined as any),
    }),
    [whatsNew.primaryAction]
  );

  const handlePrimaryPress = useCallback(() => {
    // Fire-and-forget async work (haptics + persistence)
    void fireHaptic(primary.hapticFeedback);
    if (versionStore) {
      void versionStore.save(whatsNew.version);
    }

    // Invoke custom onDismiss from primaryAction config
    primary.onDismiss?.();

    // Invoke component-level onDismiss
    onDismiss?.();
  }, [primary, versionStore, whatsNew.version, onDismiss]);

  return (
    <View style={styles.container} testID="whats-new-view">
      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: layout.contentPaddingTop,
            paddingBottom: layout.scrollViewBottomContentInset,
          },
        ]}
        showsVerticalScrollIndicator={layout.showsScrollViewIndicators}
      >
        {/* Title */}
        <Text style={[styles.title, { marginBottom: layout.contentSpacing }]}>
          {whatsNew.title ?? DEFAULT_TITLE}
        </Text>

        {/* Feature list */}
        <View
          style={{
            gap: layout.featureListSpacing,
            paddingLeft: layout.featureListPaddingLeft,
          }}
        >
          {whatsNew.features.map((feature, index) => (
            <FeatureRow
              key={`feature-${index}`}
              feature={feature}
              imageWidth={layout.featureImageWidth}
              horizontalSpacing={layout.featureHorizontalSpacing}
              horizontalAlignment={layout.featureHorizontalAlignment}
              verticalSpacing={layout.featureVerticalSpacing}
            />
          ))}
        </View>
      </ScrollView>

      {/* Fixed footer */}
      <View style={[styles.footer, { gap: layout.footerActionSpacing }]}>
        {/* Secondary action (if present) */}
        {whatsNew.secondaryAction && (
          <SecondaryActionButton
            action={whatsNew.secondaryAction}
            onDismiss={handlePrimaryPress}
          />
        )}

        {/* Primary action button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              backgroundColor: primary.backgroundColor,
              borderRadius: layout.footerPrimaryActionButtonCornerRadius,
            },
          ]}
          onPress={handlePrimaryPress}
          activeOpacity={0.8}
          testID="whats-new-primary-action"
        >
          <Text
            style={[
              styles.primaryButtonText,
              { color: primary.foregroundColor },
            ]}
          >
            {primary.title}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // mcBlack
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 34, // .largeTitle
    fontWeight: '700',
    color: '#F7F7F7', // mcWhite
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
  },
  featureImageContainer: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureImageText: {
    fontSize: 24, // .title equivalent
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15, // .subheadline.weight(.semibold)
    fontWeight: '600',
    color: '#F7F7F7', // .primary on dark
  },
  featureSubtitle: {
    fontSize: 15, // .subheadline
    fontWeight: '400',
    color: 'rgba(247, 247, 247, 0.60)', // .secondary on dark
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 34, // safe area + padding
    paddingTop: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17, // .headline
    fontWeight: '600',
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '400',
  },
});
