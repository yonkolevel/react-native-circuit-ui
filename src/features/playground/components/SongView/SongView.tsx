/**
 * SongView — Main DAW container
 *
 * Layout matching iOS exactly:
 * - Fixed track labels column (80px wide, left side)
 * - Horizontally scrollable section headers + clips (right side)
 * - Labels and clips aligned vertically
 */
import { memo, useCallback } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import * as ContextMenu from 'zeego/context-menu';
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
  onPress,
}: {
  clip?: Clip;
  color: string;
  onPress?: () => void;
}) {
  if (!clip) {
    // iOS EmptyClipView: transparent bg, stroke border in track color, "+" in track color
    return (
      <Pressable
        onPress={onPress}
        style={[s.emptyCell, { borderColor: color }]}
      >
        <Icon icon={Icons.plus} size={14} color={color} />
      </Pressable>
    );
  }

  // Pre-compute note range (outside render loop)
  const notes = clip.notes;
  const beatsInClip = Math.max(1, clip.activeLengthInBars) * 4;
  const stepsPerBeat = 4;
  const totalSteps = beatsInClip * stepsPerBeat;
  const w = CELL_W - CLIP_PAD * 2;
  const h = CELL_H - CLIP_PAD * 2;
  const stepWidth = w / totalSteps;

  // Pitch range — match iOS soundBank.defaultOctave fallback
  const noteNumbers = notes.map((n) => n.noteNumber);
  const minNote = noteNumbers.length > 0 ? Math.min(...noteNumbers) : 0;
  const maxNote = noteNumbers.length > 0 ? Math.max(...noteNumbers) : 127;
  const pitchCount = Math.max(maxNote - minNote + 1, 1);
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
          const xRaw = stepPos * stepWidth;
          const noteIdx = Math.min(
            Math.max(0, note.noteNumber - minNote),
            pitchCount - 1
          );
          const yRaw = noteIdx * rawNoteHeight;
          const stepDur = note.duration * stepsPerBeat;
          const durW = stepDur * stepWidth;
          const remainW =
            (beatsInClip - note.position) * stepsPerBeat * stepWidth;
          const noteW = Math.min(Math.max(minNoteWidth, durW), remainW);
          const x = Math.min(Math.max(xRaw, 0), Math.max(0, w - noteW));
          const y = Math.min(Math.max(yRaw, 0), Math.max(0, h - noteHeight));
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: x,
                bottom: y, // iOS renders bottom-up (low pitch at bottom)
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
                  <ContextMenu.Root key={t.id}>
                    <ContextMenu.Trigger>
                      <Pressable
                        onPress={() => callbacks?.onTrackSelect?.(t.id)}
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
                          size={15}
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
                    </ContextMenu.Trigger>
                    <ContextMenu.Content>
                      <ContextMenu.Item
                        key="delete"
                        onSelect={() => callbacks?.onDeleteTrack?.(t.id)}
                        destructive
                      >
                        <ContextMenu.ItemTitle>Delete Track</ContextMenu.ItemTitle>
                      </ContextMenu.Item>
                    </ContextMenu.Content>
                  </ContextMenu.Root>
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
                                ? '#FFFFFF'
                                : 'rgba(247,247,247,0.6)',
                            },
                          ]}
                        >
                          <Text
                            variant="small"
                            color={'#000000'}
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
                      style={s.addSecBtn}
                    >
                      <Icon
                        icon={Icons.plus}
                        size={14}
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
        {view === 'settings' && <SongSettings song={song} />}
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
    borderColor: 'rgba(255,255,255,0.2)',
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
