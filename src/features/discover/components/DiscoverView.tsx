/**
 * DiscoverView — Matches DiscoverView.swift
 *
 * ScrollView with optional FeaturedCard hero, recommended circuits, popular circuits.
 * Loading → error placeholder → content states.
 */
import { memo } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '../../../components/Text';
import { useTheme } from '../../../theme';
import { makeSpacing } from '../../../theme/spacing';

export interface FeaturedContent {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  textColor?: string;
}

export interface DiscoverFeed {
  featured?: FeaturedContent;
  recommended: any[]; // CircuitDetails[]
  popular: any[];
}

export interface DiscoverViewProps {
  status: 'loading' | 'error' | 'loaded';
  feed: DiscoverFeed;
  onRetry?: () => void;
  onCircuitPress?: (circuitId: string) => void;
  onFeaturedPress?: () => void;
  /** Render prop for circuit cards (receives array of circuit data) */
  renderCircuitCard?: (circuit: any) => React.ReactNode;
  /** Render prop for featured hero */
  renderFeatured?: (featured: FeaturedContent) => React.ReactNode;
}

export const DiscoverView = memo(function DiscoverView({
  status, feed, onRetry: _onRetry, renderCircuitCard, renderFeatured,
}: DiscoverViewProps) {
  const { colors } = useTheme();

  if (status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.mcWhite} />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.centered}>
        <Text variant="body" color={colors.secondaryText}>Unable to load content</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Featured hero */}
      {feed.featured && renderFeatured?.(feed.featured)}

      {/* Recommended */}
      {feed.recommended.length > 0 && (
        <View style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>Recommended</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {feed.recommended.map((circuit, i) => (
              <View key={circuit.id || i}>{renderCircuitCard?.(circuit)}</View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Popular */}
      {feed.popular.length > 0 && (
        <View style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>Popular</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {feed.popular.map((circuit, i) => (
              <View key={circuit.id || i}>{renderCircuitCard?.(circuit)}</View>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: makeSpacing(5) },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { gap: makeSpacing(3), paddingTop: makeSpacing(5) },
  sectionTitle: { paddingHorizontal: makeSpacing(4) },
  horizontalList: { paddingHorizontal: makeSpacing(4), gap: makeSpacing(3) },
});
