/**
 * ClipSettingsModal — matches iOS ClipSettingsView.swift
 *
 * Controls: metronome toggle, tempo slider, show note labels toggle.
 * Presented as a full-screen modal on iOS, sheet on macOS.
 */
import { memo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Switch,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';
import { makeSpacing } from '../../../../theme/spacing';

let SliderComponent: any = null;
try {
  SliderComponent = require('@react-native-community/slider').default;
} catch {}

export interface ClipSettingsModalProps {
  visible: boolean;
  tempo: number;
  isMetronomeEnabled: boolean;
  showNoteLabels: boolean;
  /** Whether dragging notes snaps to whole steps (placing a new note always snaps regardless). */
  snapToGrid?: boolean;
  /** Drum clips only — show the Lock Note Length row */
  showLockNoteDuration?: boolean;
  /** Whether notes on this (drum) clip can be resized longer */
  lockNoteDuration?: boolean;
  onClose: () => void;
  onTempoChange?: (bpm: number) => void;
  onToggleMetronome?: () => void;
  onToggleNoteLabels?: () => void;
  onToggleSnapToGrid?: () => void;
  onToggleLockNoteDuration?: () => void;
  onSampleKit?: () => void;
  sampleKitButtonTestID?: string;
}

export const ClipSettingsModal = memo(function ClipSettingsModal({
  visible,
  tempo,
  isMetronomeEnabled,
  showNoteLabels,
  snapToGrid = false,
  showLockNoteDuration = false,
  lockNoteDuration = true,
  onClose,
  onTempoChange,
  onToggleMetronome,
  onToggleNoteLabels,
  onToggleSnapToGrid,
  onToggleLockNoteDuration,
  onSampleKit,
  sampleKitButtonTestID,
}: ClipSettingsModalProps) {
  const { colors } = useTheme();
  const [tempoDisplay, setTempoDisplay] = useState<number | null>(null);
  const tempoValue = tempoDisplay ?? tempo;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.mcBlack }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityLabel="Done"
            accessibilityRole="button"
          >
            <Text variant="label" color={colors.mcOrange}>
              Done
            </Text>
          </Pressable>
        </View>

        {/* Settings */}
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Metronome */}
          <View style={[styles.row, { borderBottomColor: colors.mcBlack4 }]}>
            <Text variant="label" color={colors.mcWhite}>
              Metronome
            </Text>
            <Switch
              value={isMetronomeEnabled}
              accessibilityLabel="Metronome"
              accessibilityHint="Play a click with the song"
              onValueChange={() => onToggleMetronome?.()}
              trackColor={{ false: colors.mcBlack4, true: colors.mcGreen }}
            />
          </View>

          {/* Tempo — label, value and slider grouped so the divider sits below
              the whole control, not between the label and its slider. */}
          <View
            style={[styles.tempoGroup, { borderBottomColor: colors.mcBlack4 }]}
          >
            <View style={styles.tempoHeader}>
              <Text variant="label" color={colors.mcWhite}>
                Tempo
              </Text>
              <Text variant="label" color={colors.mcWhite3}>
                {Math.round(tempoValue)} BPM
              </Text>
            </View>
            {SliderComponent && (
              <SliderComponent
                style={styles.slider}
                accessibilityLabel="Tempo"
                accessibilityRole="adjustable"
                accessibilityValue={{ text: `${Math.round(tempoValue)} BPM` }}
                minimumValue={40}
                maximumValue={240}
                value={tempo}
                step={1}
                onValueChange={setTempoDisplay}
                onSlidingComplete={(v: number) => {
                  setTempoDisplay(null);
                  onTempoChange?.(v);
                }}
                minimumTrackTintColor={colors.mcOrange}
                maximumTrackTintColor={colors.mcBlack4}
                thumbTintColor={colors.mcWhite}
              />
            )}
          </View>

          {/* Show Note Labels on Piano Roll Notes */}
          <View
            style={[
              styles.row,
              { borderBottomColor: colors.mcBlack4, alignItems: 'flex-start' },
            ]}
          >
            <View style={styles.labelWithSubtitle}>
              <Text variant="label" color={colors.mcWhite}>
                Show Labels on Notes
              </Text>
              <Text variant="small" color={colors.mcGray}>
                Display note/sample names on piano roll notes
              </Text>
            </View>
            <Switch
              value={showNoteLabels}
              accessibilityLabel="Show labels on notes"
              onValueChange={() => onToggleNoteLabels?.()}
              trackColor={{ false: colors.mcBlack4, true: colors.mcGreen }}
            />
          </View>

          {/* Snap to Grid — placing a new note always snaps; this only
              governs dragging existing notes to move/resize them. */}
          <View
            style={[
              styles.row,
              { borderBottomColor: colors.mcBlack4, alignItems: 'flex-start' },
            ]}
          >
            <View style={styles.labelWithSubtitle}>
              <Text variant="label" color={colors.mcWhite}>
                Snap to Grid
              </Text>
              <Text variant="small" color={colors.mcGray}>
                Moving/resizing notes snaps to the step grid
              </Text>
            </View>
            <Switch
              value={snapToGrid}
              accessibilityLabel="Snap note edits to grid"
              onValueChange={() => onToggleSnapToGrid?.()}
              trackColor={{ false: colors.mcBlack4, true: colors.mcGreen }}
            />
          </View>

          {/* Lock Note Length — drum clips only. A one-shot sample doesn't
              sustain just because the note block got longer, so this is on
              by default and most users won't need to touch it. */}
          {showLockNoteDuration && (
            <View
              style={[
                styles.row,
                {
                  borderBottomColor: colors.mcBlack4,
                  alignItems: 'flex-start',
                },
              ]}
            >
              <View style={styles.labelWithSubtitle}>
                <Text variant="label" color={colors.mcWhite}>
                  Lock Note Length
                </Text>
                <Text variant="small" color={colors.mcGray}>
                  Drum hits can&apos;t be resized longer
                </Text>
              </View>
              <Switch
                value={lockNoteDuration}
                accessibilityLabel="Lock drum note length"
                onValueChange={() => onToggleLockNoteDuration?.()}
                trackColor={{ false: colors.mcBlack4, true: colors.mcGreen }}
              />
            </View>
          )}

          {onSampleKit && (
            <Pressable
              onPress={() => {
                onClose();
                onSampleKit();
              }}
              accessibilityLabel="Sample a kit"
              accessibilityRole="button"
              testID={sampleKitButtonTestID}
              style={[styles.actionRow, { borderBottomColor: colors.mcBlack4 }]}
            >
              <Text variant="label" color={colors.mcOrange}>
                Sample a Kit
              </Text>
              {/* `small` (12pt), not `extraSmall` (8pt) — below the 11pt floor
                  body copy is unreadable for many users. */}
              <Text variant="small" color={colors.mcGray}>
                Record or load audio and chop it across the pads
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 24,
  },
  headerSpacer: { flex: 1 },
  content: {
    paddingTop: 36,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: makeSpacing(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  labelWithSubtitle: {
    flex: 1,
    paddingRight: makeSpacing(2),
  },
  actionRow: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: makeSpacing(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tempoGroup: {
    paddingVertical: makeSpacing(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tempoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 36,
    marginTop: makeSpacing(2),
  },
});
