/**
 * PlaygroundsDashboard — Matches PlaygroundsDashboardView.swift exactly
 *
 * Header: "Playgrounds" in .mcH4 + McButton("+ New", primary)
 * List: LazyVStack of playground cards
 * Card: HStack { StaticGradientCover(88x88) + VStack(name .mcLabel, author .mcSmall, date .mcSmall) + Menu }
 * All text: .mcWhite
 * Padding: horizontal 24 (iPhone) / 40 (desktop), top 24/40
 * Background: mcBlack
 */
import { memo } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Text } from '../../../../components/Text';
import { GradientCover } from '../../../../components/GradientCover';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import type { PlaygroundState } from '../../types';

// ── Playground Card ─────────────────────────────────────────────────────────

interface PlaygroundCardProps {
  playground: PlaygroundState;
  index: number;
  onPress?: (id: string) => void;
  onMenuPress?: (id: string) => void;
}

const PlaygroundCard = memo(function PlaygroundCard({
  playground,
  index,
  onPress,
  onMenuPress,
}: PlaygroundCardProps) {
  const { colors } = useTheme();

  // Format date matching Swift .formatted()
  const dateSource = playground.updatedAt || playground.createdAt;
  const date = new Date(dateSource);
  const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  return (
    <Pressable
      onPress={() => onPress?.(playground.id)}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
      accessibilityRole="none"
      accessibilityLabel={`Playground: ${playground.name}`}
    >
      {/* Gradient cover — 88×88 square, no border radius (matches Swift) */}
      <GradientCover id={playground.id} width={88} height={88} />

      {/* Info — VStack(name .mcLabel, author .mcSmall, date .mcSmall), all .mcWhite */}
      <View style={styles.cardInfo}>
        <Text variant="label" color={colors.mcWhite} numberOfLines={1}>
          {playground.name}
        </Text>
        {playground.author ? (
          <Text variant="small" color={colors.mcWhite} numberOfLines={1}>
            {playground.author}
          </Text>
        ) : null}
        <Text variant="small" color={colors.mcWhite}>
          {dateStr}
        </Text>
      </View>

      {/* Menu — native context menu trigger (ellipsis icon) */}
      <Pressable
        onPress={() => onMenuPress?.(playground.id)}
        style={styles.menuBtn}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="More options"
        testID={`playgroundMenuButton_${index}`}
      >
        <Icon icon={Icons.more} size={20} color={colors.mcWhite3} />
      </Pressable>
    </Pressable>
  );
});

// ── Dashboard ───────────────────────────────────────────────────────────────

export interface PlaygroundsDashboardProps {
  playgrounds: PlaygroundState[];
  isLoading?: boolean;
  onSelect?: (id: string) => void;
  onCreate?: () => void;
  onMenuPress?: (id: string) => void;
}

export const PlaygroundsDashboard = memo(function PlaygroundsDashboard({
  playgrounds,
  isLoading,
  onSelect,
  onCreate,
  onMenuPress,
}: PlaygroundsDashboardProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const padding = isPhone ? 24 : 40;

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack }]}>
      {/* Header — matches Swift headerView() */}
      <View
        style={[
          styles.header,
          { paddingHorizontal: padding, paddingTop: padding },
        ]}
      >
        <Text variant="h3" color={colors.mcWhite}>
          Playgrounds
        </Text>
        {playgrounds.length > 0 && (
          <Pressable
            onPress={onCreate}
            style={[styles.newBtn, { backgroundColor: colors.mcOrange }]}
            accessibilityRole="button"
            accessibilityLabel="Create new playground"
          >
            <Text variant="label" color={colors.mcWhite}>
              + New
            </Text>
          </Pressable>
        )}
      </View>

      {/* List — matches Swift dashboardContent() states */}
      {isLoading && playgrounds.length === 0 ? (
        /* Initial load — centered spinner + text (matches Swift ProgressView + "Loading playgrounds…") */
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.mcOrange} />
          <Text
            variant="small"
            color={colors.mcWhite3}
            style={styles.loadingText}
          >
            Loading playgrounds…
          </Text>
        </View>
      ) : playgrounds.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="labelRegular2" color={colors.mcOrange} center>
            You haven't created a Playground yet
          </Text>
          <View style={styles.emptyButton}>
            <Pressable
              onPress={onCreate}
              style={[styles.newBtn, { backgroundColor: colors.mcOrange }]}
            >
              <Text variant="label" color={colors.mcWhite}>
                + New
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {/* Refresh overlay — small spinner at top (matches Swift .overlay(alignment: .top)) */}
          {isLoading ? (
            <View style={styles.refreshIndicator}>
              <ActivityIndicator size="small" color={colors.mcOrange} />
            </View>
          ) : null}
          <ScrollView
            contentContainerStyle={[
              styles.list,
              { paddingHorizontal: padding },
            ]}
          >
            {playgrounds.map((p, index) => (
              <PlaygroundCard
                key={p.id}
                playground={p}
                index={index}
                onPress={onSelect}
                onMenuPress={onMenuPress}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  list: { gap: 0 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  cardInfo: { flex: 1, gap: 2, marginLeft: 12 },
  menuBtn: { padding: 12 },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
  },
  emptyButton: { marginTop: 0 },
  listContainer: { flex: 1 },
  refreshIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  newBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
});
