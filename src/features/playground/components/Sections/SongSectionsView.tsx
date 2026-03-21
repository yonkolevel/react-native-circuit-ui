import { memo } from 'react';
import { ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';
import type { SongSection } from '../../types';

interface SectionPillProps { section: SongSection; isActive: boolean; onPress?: (id: number) => void; }

export const SectionPill = memo(function SectionPill({ section, isActive, onPress }: SectionPillProps) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={() => onPress?.(section.id)}
      style={[styles.pill, { backgroundColor: isActive ? colors.mcOrange : colors.mcBlack3, borderColor: isActive ? colors.mcOrange : colors.mcBlack4 }]}
       accessibilityState={{ selected: isActive }} accessibilityLabel={section.name}>
      <Text variant="small" color={isActive ? colors.mcBlack : colors.mcWhite}>{section.name}</Text>
    </Pressable>
  );
});

export interface SongSectionsViewProps {
  sections: SongSection[];
  currentSectionId: number;
  onSelect?: (id: number) => void;
  onAdd?: () => void;
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
}

export const SongSectionsView = memo(function SongSectionsView({ sections, currentSectionId, onSelect, onAdd }: SongSectionsViewProps) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}
       accessibilityLabel="Song sections">
      {sections.map(s => (
        <SectionPill key={s.id} section={s} isActive={s.id === currentSectionId} onPress={onSelect} />
      ))}
      <Pressable onPress={onAdd} style={[styles.addBtn, { borderColor: colors.mcWhite4 }]}
        accessibilityRole="button" accessibilityLabel="Add section">
        <Text variant="label" color={colors.mcWhite3}>+</Text>
      </Pressable>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  addBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
});
