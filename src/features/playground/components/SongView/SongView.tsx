/**
 * SongView — Main DAW container
 *
 * Layout matching iOS exactly:
 * - Fixed track labels column (80px wide, left side)
 * - Horizontally scrollable section headers + clips (right side)
 * - Labels and clips aligned vertically
 */
import { memo, useCallback, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import { createDrumSamples } from '../../mocks';
import { SongToolbar } from './SongToolbar';
import { SongMixerTabBar } from './SongMixerTabBar';
import { MixerView } from '../Mixer';
import { SongSettings } from '../Settings';
import { BottomPanel } from '../BottomPanel';
import { DrumPadsView } from '../DrumPads';
import { PianoKeyboard } from '../PianoKeyboard';
import type { Clip, SongViewState, SongCallbacks, SongDestination, MixerCallbacks, ClipEditorCallbacks } from '../../types';
import { INSTRUMENT_COLORS } from '../../types';

const TRACK_ICONS: Record<string, any> = {
  drum: Icons.drumTrack, melodic: Icons.melodicTrack, bass: Icons.bassTrack, audio: Icons.audioTrack,
};
const TRACK_LABELS: Record<string, string> = {
  drum: 'Drums', melodic: 'Melodic', bass: 'Bass', audio: 'Audio',
};
const CELL_W = 80;
const CELL_H = 60;
const SECTION_H = 50;
const GAP = 4;

// ── Clip Cell ───────────────────────────────────────────────────────────────

const ClipCell = memo(function ClipCell({ clip, color, onPress }: { clip?: Clip; color: string; onPress?: () => void }) {
  if (!clip) {
    return (
      <Pressable onPress={onPress} style={[s.cell, { backgroundColor: color, borderRadius: 6 }]}>
        <Icon icon={Icons.plus} size={14} color={'rgba(0,0,0,0.3)'} />
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={[s.cell, { backgroundColor: color, borderRadius: 6 }]}>
      <View style={s.cellContent}>
        {clip.notes.slice(0, 20).map((note: any, i: number) => {
          const notes = clip.notes;
          const maxB = Math.max(...notes.map((n: any) => n.position + n.duration), 4);
          const minN = Math.min(...notes.map((n: any) => n.noteNumber));
          const maxN = Math.max(...notes.map((n: any) => n.noteNumber));
          const rng = Math.max(maxN - minN, 1);
          return (
            <View key={i} style={{
              position: 'absolute',
              left: (note.position / maxB) * (CELL_W - 8),
              top: (CELL_H - 8) - ((note.noteNumber - minN) / rng) * (CELL_H - 12),
              width: Math.max((note.duration / maxB) * (CELL_W - 8), 2),
              height: Math.max((CELL_H - 8) / rng, 3) * 0.8,
              backgroundColor: 'rgba(26,28,32,0.4)', borderRadius: 1,
            }} />
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

export const SongView = memo(function SongView({ song, callbacks, mixerCallbacks, style }: SongViewProps) {
  const { colors } = useTheme();
  const [bottomOpen, setBottomOpen] = useState(false);
  const [selTrackId, setSelTrackId] = useState<number | null>(null);

  const handleTab = useCallback((d: SongDestination) => { callbacks?.onNavigate?.(d); }, [callbacks]);
  const handleTrack = useCallback((id: number) => {
    console.log('[SongView] Track pressed:', id);
    setSelTrackId(id);
    setBottomOpen(true);
  }, []);

  const view = song.currentView;
  if (typeof view !== 'string') return null; // editor views handled by parent

  const showTab = view === 'song' || view === 'mixer';
  const selTrack = selTrackId != null ? song.tracks.find(t => t.id === selTrackId) : null;

  return (
    <View style={[s.root, { backgroundColor: colors.mcBlack }, style]}>
      <SongToolbar song={song} callbacks={callbacks} />

      <View style={s.body}>
        {view === 'song' && (
          <>
            <ScrollView style={s.scroll}>
              <View style={s.grid}>
                {/* Scrollable sections + clips — padded left for labels */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <View style={s.sections}>
                      {song.sections.map(sec => (
                        <Pressable key={sec.id} onPress={() => callbacks?.onSectionSelect?.(sec.id)}
                          style={[s.secTab, { backgroundColor: sec.id === song.currentSectionId ? colors.mcOrange : colors.mcBlack3 }]}>
                          <Text variant="small" color={sec.id === song.currentSectionId ? colors.mcBlack : colors.mcWhite} center>
                            {sec.name}
                          </Text>
                        </Pressable>
                      ))}
                      <Pressable style={[s.secTab, { borderWidth: 1, borderColor: colors.mcBlack5, borderStyle: 'dashed' }]}>
                        <Icon icon={Icons.plus} size={14} color={colors.mcBlack5} />
                      </Pressable>
                    </View>
                    <View style={s.clipRows}>
                      {song.tracks.map(t => (
                        <View key={t.id} style={s.clipRow}>
                          {song.sections.map(sec => (
                            <ClipCell key={sec.id} clip={t.clips.find(c => c.sectionID === sec.id)}
                              color={INSTRUMENT_COLORS[t.type] || '#fff'}
                              onPress={() => { const c = t.clips.find(cl => cl.sectionID === sec.id); if (c) callbacks?.onClipSelect?.(c.id, t.id); }} />
                          ))}
                        </View>
                      ))}
                    </View>
                  </View>
                </ScrollView>

                {/* Absolute labels column — overlaid on left */}
                <View style={s.labelsOverlay}>
                  <View style={{ height: SECTION_H + GAP }} />
                  {song.tracks.map(t => (
                    <Pressable
                      key={t.id}
                      onPress={() => handleTrack(t.id)}
                      style={[s.label, { backgroundColor: (INSTRUMENT_COLORS[t.type] || '#fff') + 'CC' }]}
                    >
                      <Icon icon={TRACK_ICONS[t.type] || Icons.drumTrack} size={15} color={colors.mcBlack} />
                      <Text variant="extraSmall" color={colors.mcBlack} bold style={s.labelTxt}>
                        {TRACK_LABELS[t.type] || t.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable onPress={() => callbacks?.onAddTrack?.('drum')} style={s.addTrack}>
                <Icon icon={Icons.plus} size={14} color={colors.mcWhite3} />
                <Text variant="small" color={colors.mcWhite3}>Add track</Text>
              </Pressable>
            </ScrollView>

            {selTrack && (
              <BottomPanel isExpanded={bottomOpen} onToggle={() => setBottomOpen(!bottomOpen)}>
                {selTrack.type === 'drum' ? (
                  <DrumPadsView samples={createDrumSamples()} highlightColor={selTrack.colorHex} />
                ) : (
                  <PianoKeyboard numberOfOctaves={2} highlightColor={selTrack.colorHex} showNoteNames />
                )}
              </BottomPanel>
            )}
          </>
        )}
        {view === 'mixer' && <MixerView tracks={song.tracks} callbacks={mixerCallbacks} />}
        {view === 'settings' && <SongSettings song={song} />}
      </View>

      {showTab && <SongMixerTabBar currentView={song.currentView} onTabPress={handleTab} />}
    </View>
  );
});

const s = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
  scroll: { flex: 1 },
  grid: { position: 'relative' },
  labelsOverlay: { position: 'absolute', left: 0, top: 0, width: CELL_W, gap: GAP, zIndex: 1 },
  label: { width: CELL_W, height: CELL_H, justifyContent: 'center', alignItems: 'center', gap: 4 },
  labelTxt: { fontSize: 10 },
  sections: { flexDirection: 'row', gap: GAP, marginBottom: GAP, paddingLeft: CELL_W + GAP },
  secTab: { width: CELL_W, height: SECTION_H, justifyContent: 'center', alignItems: 'center' },
  clipRows: { gap: GAP },
  clipRow: { flexDirection: 'row', gap: GAP, paddingLeft: CELL_W + GAP, height: CELL_H },
  cell: { width: CELL_W, height: CELL_H, justifyContent: 'center', alignItems: 'center', padding: 4 },
  cellContent: { flex: 1, width: '100%', position: 'relative' },
  addTrack: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingLeft: 16 },
});

export default SongView;
