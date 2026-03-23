/**
 * TrophiesView — Matches TrophiesView.swift
 *
 * LazyVGrid: 3 columns (iPhone) / 6 columns (desktop), 92pt min, spacing 20
 * Header: "TROPHY GALLERY" in .caption, mcWhite2 color
 */
import { memo } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions, Image } from 'react-native';
import { Text } from '../../../components/Text';
import { useTheme } from '../../../theme';
import { makeSpacing } from '../../../theme/spacing';
import type { Trophy } from '../types';

interface TrophyViewProps {
  trophy: Trophy;
  onPress?: (trophy: Trophy) => void;
}

const TrophyView = memo(function TrophyView({ trophy, onPress }: TrophyViewProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => trophy.achieved && onPress?.(trophy)}
      style={[styles.trophy, { opacity: trophy.achieved ? 1 : 0.4 }]}
      accessibilityRole="button"
      accessibilityLabel={`Trophy: ${trophy.title}${trophy.achieved ? ', achieved' : ''}`}
    >
      {trophy.imageUrl ? (
        <Image source={{ uri: trophy.imageUrl }} style={styles.trophyImage} resizeMode="contain" />
      ) : (
        <View style={[styles.trophyPlaceholder, { backgroundColor: trophy.achieved ? colors.mcGreen2 : colors.mcBlack4 }]}>
          <Text variant="h4">{trophy.achieved ? '🏆' : '?'}</Text>
        </View>
      )}
      <Text variant="extraSmall" center color={colors.mcWhite2} numberOfLines={2}>
        {trophy.title}
      </Text>
    </Pressable>
  );
});

export interface TrophiesViewProps {
  trophies: Trophy[];
  onSelect?: (trophy: Trophy) => void;
}

export const TrophiesView = memo(function TrophiesView({ trophies, onSelect }: TrophiesViewProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const columns = isPhone ? 3 : 6;

  return (
    <View style={styles.container}>
      <Text variant="small" uppercase color={colors.mcWhite2} style={styles.header}>
        Trophy gallery
      </Text>
      <View style={[styles.grid, { gap: 20 }]}>
        {trophies.map(trophy => (
          <View key={trophy.id} style={{ width: `${100 / columns - 2}%` }}>
            <TrophyView trophy={trophy} onPress={onSelect} />
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { paddingTop: makeSpacing(5) },
  header: { marginBottom: makeSpacing(5) },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  trophy: { alignItems: 'center', gap: 6 },
  trophyImage: { width: 80, height: 80 },
  trophyPlaceholder: { width: 80, height: 80, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});

export { TrophyView };
