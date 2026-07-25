/**
 * ClipSettingsModal — matches iOS ClipSettingsView.swift
 *
 * Controls: metronome toggle, tempo slider, show note labels toggle.
 * Presented as a full-screen modal on iOS, sheet on macOS.
 */
import { memo, useState } from 'react';
import { View, Switch, Pressable, Modal, StyleSheet } from 'react-native';
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
      <View style={[styles.container, { backgroundColor: colors.mcBlack }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Pressable onPress={onClose} hitSlop={8}>
            <Text variant="label" color={colors.mcOrange}>
              Done
            </Text>
          </Pressable>
        </View>

        {/* Settings */}
        <View style={styles.content}>
          {/* Metronome */}
          <View style={[styles.row, { borderBottomColor: colors.mcBlack4 }]}>
            <Text variant="label" color={colors.mcWhite}>
              Metronome
            </Text>
            <Switch
              value={isMetronomeEnabled}
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
              <Text variant="extraSmall" color={colors.mcGray}>
                Display note/sample names on piano roll notes
              </Text>
            </View>
            <Switch
              value={showNoteLabels}
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
              <Text variant="extraSmall" color={colors.mcGray}>
                Moving/resizing notes snaps to the step grid
              </Text>
            </View>
            <Switch
              value={snapToGrid}
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
                <Text variant="extraSmall" color={colors.mcGray}>
                  Drum hits can&apos;t be resized longer
                </Text>
              </View>
              <Switch
                value={lockNoteDuration}
                onValueChange={() => onToggleLockNoteDuration?.()}
                trackColor={{ false: colors.mcBlack4, true: colors.mcGreen }}
              />
            </View>
          )}
        </View>
      </View>
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
