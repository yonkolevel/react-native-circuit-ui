import { memo } from 'react';
import { ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';
import type { SongSection } from '../../types';
import {
  isEditorCapabilityAllowed,
  useResolvedEditorPolicy,
  type EditorPolicy,
} from '../../stores/editorPolicy';

interface SectionPillProps {
  section: SongSection;
  isActive: boolean;
  onPress?: (id: number) => void;
  disabled?: boolean;
  editorPolicy?: EditorPolicy;
}

export const SectionPill = memo(function SectionPill({
  section,
  isActive,
  onPress,
  disabled: disabledProp = false,
  editorPolicy,
}: SectionPillProps) {
  const { colors } = useTheme();
  const policy = useResolvedEditorPolicy(editorPolicy);
  const disabled =
    disabledProp || !isEditorCapabilityAllowed(policy, 'arrangement');
  return (
    <Pressable
      onPress={() => onPress?.(section.id)}
      disabled={disabled || undefined}
      style={[
        styles.pill,
        {
          backgroundColor: isActive ? colors.mcOrange : colors.mcBlack3,
          borderColor: isActive ? colors.mcOrange : colors.mcBlack4,
        },
      ]}
      accessibilityState={{
        selected: isActive,
        disabled: disabled || undefined,
      }}
      accessibilityLabel={section.name}
    >
      <Text variant="small" color={isActive ? colors.mcBlack : colors.mcWhite}>
        {section.name}
      </Text>
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
  editorPolicy?: EditorPolicy;
}

export const SongSectionsView = memo(function SongSectionsView({
  sections,
  currentSectionId,
  onSelect,
  onAdd,
  editorPolicy,
}: SongSectionsViewProps) {
  const { colors } = useTheme();
  const policy = useResolvedEditorPolicy(editorPolicy);
  const canArrange = isEditorCapabilityAllowed(policy, 'arrangement');
  const canEditSections = isEditorCapabilityAllowed(policy, 'sections');
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      accessibilityLabel="Song sections"
    >
      {sections.map((s) => (
        <SectionPill
          key={s.id}
          section={s}
          isActive={s.id === currentSectionId}
          onPress={canArrange ? onSelect : undefined}
          disabled={!canArrange}
          editorPolicy={policy}
        />
      ))}
      <Pressable
        onPress={onAdd}
        disabled={canEditSections ? undefined : true}
        accessibilityState={canEditSections ? undefined : { disabled: true }}
        style={[styles.addBtn, { borderColor: colors.mcWhite4 }]}
        accessibilityRole="button"
        accessibilityLabel="Add section"
      >
        <Text variant="label" color={colors.mcWhite3}>
          +
        </Text>
      </Pressable>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  pill: {
    width: 80,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    width: 36,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
