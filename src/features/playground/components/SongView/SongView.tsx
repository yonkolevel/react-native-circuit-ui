/**
 * SongView — Main DAW container
 *
 * Layout matching iOS exactly:
 * - Fixed track labels column (80px wide, left side)
 * - Horizontally scrollable section headers + clips (right side)
 * - Labels and clips aligned vertically
 */
import { memo, useCallback } from 'react';
import { View, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import { SongToolbar } from './SongToolbar';
import { SongMixerTabBar } from './SongMixerTabBar';
import { MixerView } from '../Mixer';
import { SongSettings } from '../Settings';
import type {
  Clip,
  InstrumentType,
  SongViewState,
  SongCallbacks,
  SongDestination,
  MixerCallbacks,
  ClipEditorCallbacks,
} from '../../types';
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
// Exported for layout alignment tests
export const GRID = {
  CELL_W: 80,
  CELL_H: 60,
  SECTION_H: 50,
  GAP: 4,
} as const;

const { CELL_W, CELL_H, SECTION_H, GAP } = GRID;

// ── Clip Cell ───────────────────────────────────────────────────────────────

/**
 * ClipCell — Renders a single clip in the song grid.
 *
 * Matches iOS ClipViewMIDINotesPreview:
 * - Empty clip: instrument color bg + "+" icon (rgba black overlay)
 * - Clip with notes: instrument color bg, notes as mcBlack2.opacity(0.4) rounded rects
 * - Note positioning: quantized to steps (16th notes), vertical by pitch range
 * - Padding: 2pt on all sides (matching iOS GeometryReader padding)
 */
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
  /** Number of samples in soundBank (drums) or 24 (melodic/bass) */
  sampleCount?: number;
  /** soundBank.defaultOctave — base MIDI note for pitch offset */
  defaultOctave?: number;
  onPress?: () => void;
}) {
  if (!clip) {
    // iOS EmptyClipView: transparent bg, stroke border in track color, "+" in track color
    return (
      <Pressable
        onPress={onPress}
        style={[s.emptyCell, { borderColor: color }]}
      >
        <Icon icon={Icons.plus} size={17} color={color} />
      </Pressable>
    );
  }

  // iOS: uses pianoRollPitchCount (soundBank.samples.count for drums, 24 for melodic)
  // and soundBank.defaultOctave as the base MIDI note for vertical positioning.
  const notes = clip.notes;
  const beatsInClip = Math.max(1, clip.activeLengthInBars) * 4;
  const stepsPerBeat = 4;
  const totalSteps = beatsInClip * stepsPerBeat;
  const w = CELL_W - CLIP_PAD * 2;
  const h = CELL_H - CLIP_PAD * 2;
  const stepWidth = w / totalSteps;

  const isDrum = instrumentType === 'drum';
  const pitchCount = Math.max(1, sampleCount ?? (isDrum ? 12 : 24));
  const baseNote = defaultOctave ?? 0;
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

          // X: quantize position to step grid
          const stepPos = note.position * stepsPerBeat;
          const xRaw = stepPos * stepWidth + CLIP_PAD;

          // Y: iOS uses baseNote (soundBank.defaultOctave) as reference
          const noteIdx = Math.min(
            Math.max(0, note.noteNumber - baseNote),
            pitchCount - 1
          );
          const yRaw = noteIdx * rawNoteHeight + CLIP_PAD;
          const maxY = Math.max(CLIP_PAD, h - noteHeight + CLIP_PAD);
          const yOffset = Math.min(Math.max(yRaw, CLIP_PAD), maxY);

          // Width: quantize duration, clamp to remaining clip space
          const stepDur = note.duration * stepsPerBeat;
          const durW = stepDur * stepWidth;
          const remainW =
            Math.max(0, (beatsInClip - note.position) * stepsPerBeat) *
            stepWidth;
          const noteW = Math.min(Math.max(minNoteWidth, durW), remainW);
          const maxX = Math.max(CLIP_PAD, w - noteW + CLIP_PAD);
          const x = Math.min(Math.max(xRaw, CLIP_PAD), maxX);

          // iOS: y = height - yOffset - noteHeight + padding (top-down, high pitch at top)
          const top = h - yOffset - noteHeight + CLIP_PAD;

          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top,
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
  song: SongViewState;
  callbacks?: SongCallbacks;
  mixerCallbacks?: MixerCallbacks;
  clipEditorCallbacks?: ClipEditorCallbacks;
  style?: StyleProp<ViewStyle>;
}

export const SongView = memo(function SongView({
  song,
  callbacks,
  mixerCallbacks,
  style,
}: SongViewProps) {
  const { colors } = useTheme();

  const handleTab = useCallback(
    (d: SongDestination) => {
      callbacks?.onNavigate?.(d);
    },
    [callbacks]
  );

  const view = song.currentView;
  if (typeof view !== 'string') return null; // editor views handled by parent

  const showTab = view === 'song' || view === 'mixer';

  return (
    <View style={[s.root, { backgroundColor: colors.mcBlack }, style]}>
      <SongToolbar song={song} callbacks={callbacks} />

      <View style={s.body}>
        {view === 'song' && (
          <>
            {/* Grid: labels column (outside ScrollView for touch) + scrollable clips */}
            <View style={s.grid}>
              {/* Fixed labels column — NOT in ScrollView so taps work on Android */}
              <View style={s.labelsCol}>
                <View style={s.labelsSpacer} />
                {song.tracks.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => callbacks?.onTrackSelect?.(t.id)}
                    onLongPress={() => {
                      Alert.alert('Delete Track', `Delete "${t.title}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => callbacks?.onDeleteTrack?.(t.id),
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
                <Pressable
                  onPress={() => callbacks?.onAddTrack?.('drum')}
                  style={s.addTrack}
                >
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
                    {song.sections.map((sec) => {
                      const isActive = sec.id === song.currentSectionId;
                      return (
                        <Pressable
                          key={sec.id}
                          onPress={() => callbacks?.onSectionSelect?.(sec.id)}
                          style={[
                            s.secTab,
                            {
                              backgroundColor: isActive
                                ? colors.mcWhite
                                : colors.mcWhite3,
                            },
                          ]}
                        >
                          <Text
                            variant="small"
                            color={colors.mcBlack}
                            center
                            numberOfLines={1}
                          >
                            {sec.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      onPress={() => callbacks?.onAddSection?.()}
                      style={[s.addSecBtn, { borderColor: colors.black5 }]}
                    >
                      <Icon
                        icon={Icons.plus}
                        size={16}
                        color={colors.mcBlack5}
                      />
                    </Pressable>
                  </View>
                  <View style={s.clipRows}>
                    {song.tracks.map((t) => (
                      <View key={t.id} style={s.clipRow}>
                        {song.sections.map((sec) => (
                          <ClipCell
                            key={sec.id}
                            clip={t.clips.find((c) => c.sectionID === sec.id)}
                            color={INSTRUMENT_COLORS[t.type] || '#fff'}
                            instrumentType={t.type}
                            sampleCount={t.soundBank?.samples?.length}
                            defaultOctave={t.soundBank?.defaultOctave}
                            onPress={() => {
                              const c = t.clips.find(
                                (cl) => cl.sectionID === sec.id
                              );
                              if (c) {
                                callbacks?.onClipSelect?.(c.id, t.id);
                              } else {
                                callbacks?.onEmptyClipPress?.(t.id, sec.id);
                              }
                            }}
                          />
                        ))}
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          </>
        )}
        {view === 'mixer' && (
          <MixerView tracks={song.tracks} callbacks={mixerCallbacks} />
        )}
        {view === 'settings' && (
          <SongSettings
            song={song}
            onTempoChange={callbacks?.onTempoChange}
            onMasterVolumeChange={callbacks?.onMasterVolumeChange}
            onToggleMetronome={callbacks?.onToggleMetronome}
          />
        )}
      </View>

      {showTab && (
        <SongMixerTabBar
          currentView={song.currentView}
          onTabPress={handleTab}
        />
      )}
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
  // iOS EmptyClipView: .overlay(Rectangle().stroke(color, lineWidth: 1))
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
