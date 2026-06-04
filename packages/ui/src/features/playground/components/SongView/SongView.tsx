/**
 * SongView — Main DAW container
 *
 * All state and actions from useSongContext() — zero song/callback/mixer props.
 * Only receives `onBack` (navigation lives outside the store).
 *
 * Layout matching iOS exactly:
 * - Fixed track labels column (80px wide, left side)
 * - Horizontally scrollable section headers + clips (right side)
 */
import { memo } from 'react';
import { View, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import { SongToolbar } from './SongToolbar';
import { SongMixerTabBar } from './SongMixerTabBar';
import { MixerView } from '../Mixer';
import { SongSettings } from '../Settings';
import { useSongContext, useSongActions } from '../../stores/playgroundStore';
import { useShallow } from 'zustand/react/shallow';
import type { Clip, InstrumentType } from '../../types';
import { INSTRUMENT_COLORS } from '../../types';

const TRACK_ICONS: Record<string, any> = {
  drum: Icons.drumTrack,
  melodic: Icons.melodicTrack,
  bass: Icons.bassTrack,
  audio: Icons.audioTrack,
};
const TRACK_LABELS: Record<string, string> = {
  drum: 'Drums',
  melodic: 'Melodic',
  bass: 'Bass',
  audio: 'Audio',
};
export const GRID = {
  CELL_W: 80,
  CELL_H: 60,
  SECTION_H: 50,
  GAP: 4,
} as const;

const { CELL_W, CELL_H, SECTION_H, GAP } = GRID;

// ── Clip Cell ───────────────────────────────────────────────────────────────

const CLIP_PAD = 2;
const ClipCell = memo(function ClipCell({
  clip,
  color,
  instrumentType,
  sampleCount,
  defaultOctave,
  onPress,
}: {
  clip?: Clip;
  color: string;
  instrumentType?: InstrumentType;
  sampleCount?: number;
  defaultOctave?: number;
  onPress?: () => void;
}) {
  if (!clip) {
    return (
      <Pressable
        onPress={onPress}
        style={[s.emptyCell, { borderColor: color }]}
      >
        <Icon icon={Icons.plus} size={17} color={color} />
      </Pressable>
    );
  }

  const notes = clip.notes;
  const beatsInClip = Math.max(1, clip.activeLengthInBars) * 4;
  const stepsPerBeat = 4;
  const totalSteps = beatsInClip * stepsPerBeat;
  const totalPad = 4 + CLIP_PAD;
  const w = CELL_W - totalPad * 2;
  const h = CELL_H - totalPad * 2;
  const stepWidth = w / totalSteps;

  const isDrum = instrumentType === 'drum';
  const pitchCount = Math.max(1, sampleCount ?? (isDrum ? 12 : 24));
  const noteNumbers = notes.map((n) => n.noteNumber);
  const effectiveBase =
    defaultOctave && defaultOctave > 0
      ? defaultOctave
      : noteNumbers.length > 0
        ? Math.min(...noteNumbers)
        : 0;
  const rawNoteHeight = h / pitchCount;
  const noteHeight = Math.max(rawNoteHeight, 3);
  const minNoteWidth = Math.max(stepWidth * 0.9, 2);

  return (
    <Pressable
      onPress={onPress}
      style={[s.cell, { backgroundColor: color, borderRadius: 6 }]}
    >
      <View style={[s.cellContent, { padding: CLIP_PAD }]}>
        {notes.slice(0, 30).map((note, i) => {
          if (note.position >= beatsInClip) return null;
          const stepPos = note.position * stepsPerBeat;
          const x = Math.max(0, Math.min(stepPos * stepWidth, w));
          const noteIdx = Math.max(
            0,
            Math.min(note.noteNumber - effectiveBase, pitchCount - 1)
          );
          const yOffset = noteIdx * rawNoteHeight;
          const durW = note.duration * stepsPerBeat * stepWidth;
          const remainW =
            Math.max(0, beatsInClip - note.position) * stepsPerBeat * stepWidth;
          const noteW = Math.min(Math.max(minNoteWidth, durW), remainW);
          const top = h - yOffset - noteHeight;

          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: Math.max(0, top),
                width: noteW,
                height: noteHeight * 0.9,
                backgroundColor: 'rgba(26,28,32,0.4)',
                borderRadius: 2,
              }}
            />
          );
        })}
      </View>
    </Pressable>
  );
});

// ── SongView ────────────────────────────────────────────────────────────────

export interface SongViewProps {
  /** Navigation back — lives outside the song store */
  onBack?: () => void;
  /** Export callbacks — wired from PlaygroundScreen to native StorageBridge */
  onExportAudio?: () => void;
  onExportBundle?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const SongView = memo(function SongView({
  onBack,
  onExportAudio,
  onExportBundle,
  style,
}: SongViewProps) {
  const { colors } = useTheme();

  // State — fine-grained selectors
  const currentTab = useSongContext((s) => s.currentTab);
  const tracks = useSongContext(useShallow((s) => s.tracks));
  const sections = useSongContext(useShallow((s) => s.sections));
  const currentSectionId = useSongContext((s) => s.currentSectionId);

  // Actions — stable refs, no subscription
  const {
    openClipEditor,
    createClip,
    setCurrentSection,
    addSection,
    showAddTrackMenu,
    removeTrack,
    renameSection,
    removeSection,
  } = useSongActions();

  const showTab = currentTab === 'song' || currentTab === 'mixer';

  return (
    <View style={[s.root, { backgroundColor: colors.mcBlack }, style]}>
      <SongToolbar onBack={onBack} />

      <View style={s.body}>
        {currentTab === 'song' && (
          <View style={s.grid}>
            {/* Fixed labels column */}
            <View style={s.labelsCol}>
              <View style={s.labelsSpacer} />
              {tracks.map((t) => (
                <Pressable
                  key={t.id}
                  onLongPress={() => {
                    Alert.alert('Delete Track', `Delete "${t.title}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => removeTrack(t.id),
                      },
                    ]);
                  }}
                  style={[
                    s.label,
                    {
                      backgroundColor:
                        (INSTRUMENT_COLORS[t.type] || '#fff') + 'CC',
                    },
                  ]}
                >
                  <Icon
                    icon={TRACK_ICONS[t.type] || Icons.drumTrack}
                    size={20}
                    color={colors.mcBlack}
                  />
                  <Text
                    variant="extraSmall10"
                    color={colors.mcBlack}
                    style={s.labelTxt}
                  >
                    {TRACK_LABELS[t.type] || t.title}
                  </Text>
                </Pressable>
              ))}
              <Pressable onPress={showAddTrackMenu} style={s.addTrack}>
                <Icon icon={Icons.plus} size={12} color={colors.mcBlack5} />
                <Text variant="small" color={colors.mcBlack5}>
                  Add track
                </Text>
              </Pressable>
            </View>

            {/* Scrollable sections + clips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.clipsScroll}
            >
              <View>
                <View style={s.sections}>
                  {sections.map((sec, index) => {
                    const isActive = sec.id === currentSectionId;
                    return (
                      <Pressable
                        key={sec.id}
                        onPress={() => setCurrentSection(sec.id)}
                        onLongPress={() => {
                          Alert.alert(
                            sec.name || `Section ${index + 1}`,
                            undefined,
                            [
                              {
                                text: 'Rename',
                                onPress: () => {
                                  Alert.prompt?.(
                                    'Rename Section',
                                    undefined,
                                    (newName: string) => {
                                      if (newName.trim())
                                        renameSection(sec.id, newName.trim());
                                    },
                                    'plain-text',
                                    sec.name || `Section ${index + 1}`
                                  );
                                  // Alert.prompt is iOS-only; on Android renameSection is called from settings
                                },
                              },
                              ...(sections.length > 1
                                ? [
                                    {
                                      text: 'Delete',
                                      style: 'destructive' as const,
                                      onPress: () => removeSection(sec.id),
                                    },
                                  ]
                                : []),
                              { text: 'Cancel', style: 'cancel' as const },
                            ]
                          );
                        }}
                        style={[
                          s.secTab,
                          {
                            backgroundColor: isActive
                              ? colors.mcWhite
                              : colors.mcWhite3,
                          },
                        ]}
                        accessibilityLabel={`Section ${sec.name || index + 1}`}
                        accessibilityRole="button"
                      >
                        <Text
                          variant="small"
                          color={colors.mcBlack}
                          center
                          numberOfLines={1}
                        >
                          {sec.name || `${index + 1}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    onPress={addSection}
                    style={[s.addSecBtn, { borderColor: colors.black5 }]}
                  >
                    <Icon icon={Icons.plus} size={16} color={colors.mcBlack5} />
                  </Pressable>
                </View>
                <View style={s.clipRows}>
                  {tracks.map((t) => (
                    <View key={t.id} style={s.clipRow}>
                      {sections.map((sec) => {
                        const clip = t.clips.find(
                          (c) => c.sectionID === sec.id
                        );
                        return (
                          <ClipCell
                            key={sec.id}
                            clip={clip}
                            color={INSTRUMENT_COLORS[t.type] || '#fff'}
                            instrumentType={t.type}
                            sampleCount={t.soundBank?.samples?.length}
                            defaultOctave={t.soundBank?.defaultOctave}
                            onPress={() => {
                              if (clip) {
                                openClipEditor(t.id, clip.id);
                              } else {
                                // Create clip then immediately open editor
                                // Compute new ID using same logic as songStore.createClip
                                const allClipIds = tracks.flatMap((tr) =>
                                  tr.clips.map((c) => c.id)
                                );
                                const newClipId =
                                  allClipIds.length > 0
                                    ? Math.max(...allClipIds) + 1
                                    : 0;
                                createClip(t.id, sec.id);
                                openClipEditor(t.id, newClipId);
                              }
                            }}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        )}
        {currentTab === 'mixer' && <MixerView />}
        {currentTab === 'settings' && (
          <SongSettings
            onExportAudio={onExportAudio}
            onExportBundle={onExportBundle}
          />
        )}
      </View>

      {showTab && <SongMixerTabBar />}
    </View>
  );
});

const s = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
  grid: { flex: 1, flexDirection: 'row' },
  labelsCol: {
    width: CELL_W,
    gap: GAP,
    marginRight: GAP,
  },
  clipsScroll: { flex: 1 },
  label: {
    width: CELL_W,
    height: CELL_H,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  labelsSpacer: { height: SECTION_H },
  labelTxt: { fontSize: 10, fontWeight: '500' as const },
  sections: {
    flexDirection: 'row',
    gap: GAP,
    marginBottom: GAP,
  },
  secTab: {
    width: CELL_W,
    height: SECTION_H,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 4,
  },
  addSecBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  clipRows: { gap: GAP },
  clipRow: {
    flexDirection: 'row',
    gap: GAP,
    height: CELL_H,
  },
  cell: {
    width: CELL_W,
    height: CELL_H,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  emptyCell: {
    width: CELL_W,
    height: CELL_H,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    borderWidth: 1,
  },
  cellContent: { flex: 1, width: '100%', position: 'relative' },
  addTrack: {
    width: CELL_W,
    height: CELL_H,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
});

export default SongView;
