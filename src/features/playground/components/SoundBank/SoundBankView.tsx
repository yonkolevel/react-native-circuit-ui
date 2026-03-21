/**
 * SoundBankView — Matches Swift SoundBankView
 *
 * SwiftUI: VStack(spacing: 0) { headerView, ScrollView { LazyVStack } }
 * - Header: type name uppercased (buttonLabelBold), mcWhite, centered + Done button
 * - Header bg: mcBlack2, padding top/bottom 16, horizontal 40 (iPhone: 16)
 * - Items: soundBank.name in buttonLabelSemiBold, selected = mcOrange, else mcWhite
 * - Speaker/stop icon on right
 * - Divider between items in mcWhite6
 * - Full background: mcBlack4
 */
import { memo, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';
import { Icon, Icons } from '../../../../components/SFSymbol';
import type { SoundBank, InstrumentType } from '../../types';

export interface SoundBankViewProps {
  soundBanks: SoundBank[];
  selectedSlug?: string;
  categoryFilter?: InstrumentType;
  categoryName?: string;
  onSelect?: (slug: string) => void;
  onDone?: (selectedName: string) => void;
  onPreview?: (slug: string) => void;
}

export const SoundBankView = memo(function SoundBankView({
  soundBanks, selectedSlug, categoryFilter, categoryName, onSelect, onDone, onPreview,
}: SoundBankViewProps) {
  const { colors } = useTheme();
  const [playingSlug, setPlayingSlug] = useState<string | null>(null);

  const filtered = useMemo(() =>
    categoryFilter ? soundBanks.filter(sb => sb.category === categoryFilter) : soundBanks,
    [soundBanks, categoryFilter]);

  const selectedBank = filtered.find(sb => sb.instrumentSlug === selectedSlug);

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack4 }]}>
      {/* Header — matches Swift headerView() */}
      <View style={[styles.header, { backgroundColor: colors.mcBlack2 }]}>
        <Text variant="buttonLabelBold" uppercase color={colors.mcWhite} center style={styles.headerTitle}>
          {categoryName || categoryFilter?.toUpperCase() || 'SOUNDS'}
        </Text>
        {selectedBank && (
          <Pressable onPress={() => onDone?.(selectedBank.name)} style={styles.doneButton}
            accessibilityRole="button" accessibilityLabel="Done">
            <Text variant="label" color={colors.mcWhite}>Done</Text>
          </Pressable>
        )}
      </View>

      {/* Sound bank list */}
      <ScrollView>
        {filtered.map((sb, idx) => {
          const isSelected = sb.instrumentSlug === selectedSlug;
          const isPlaying = playingSlug === sb.instrumentSlug;

          return (
            <View key={sb.instrumentSlug}>
              <Pressable
                onPress={() => onSelect?.(sb.instrumentSlug)}
                style={styles.item}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={sb.name}
              >
                {/* Name — mcOrange when selected, mcWhite otherwise */}
                <Text
                  variant="buttonLabelSemiBold"
                  color={isSelected ? colors.mcOrange : colors.mcWhite}
                  style={styles.itemName}
                  numberOfLines={1}
                >
                  {sb.name}
                </Text>

                {/* Preview play/stop button */}
                <Pressable
                  onPress={() => {
                    if (isPlaying) {
                      setPlayingSlug(null);
                    } else {
                      setPlayingSlug(sb.instrumentSlug);
                      onPreview?.(sb.instrumentSlug);
                    }
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? 'Stop preview' : 'Preview sound'}
                >
                  {isPlaying ? (
                    <Icon icon={Icons.stop} size={16} color={isSelected ? colors.mcOrange : colors.mcWhite} />
                  ) : (
                    <Icon icon={Icons.speaker} size={16} color={isSelected ? colors.mcOrange : colors.mcWhite} />
                  )}
                </Pressable>
              </Pressable>

              {/* Divider — matches Swift Divider().background(Color.mcWhite6) */}
              {idx < filtered.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.mcWhite6 }]} />
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingTop: 16, paddingBottom: 16, paddingHorizontal: 16,
    position: 'relative',
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  doneButton: { position: 'absolute', right: 16 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16,
  },
  itemName: { flex: 1 },
  divider: { height: 0.5, marginHorizontal: 0 },
});
