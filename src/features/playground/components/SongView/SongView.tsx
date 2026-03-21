/**
 * SongView — Main DAW container matching iOS exactly
 *
 * Layout: ZStack with sections as column headers, tracks as rows
 * - Sections: horizontal row offset 84px from left
 * - Track labels: 80px wide column, offset 54px from top (below sections)
 * - Clips: 80×60 grid aligned under each section, per track
 * - All sections visible horizontally (scrollable)
 */
import { memo, useCallback, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import { SongToolbar } from './SongToolbar';
import { SongMixerTabBar } from './SongMixerTabBar';
import { MixerView } from '../Mixer';
import { SongSettings } from '../Settings';
import { AddTrackMenu } from '../Toolbar';
import { BottomPanel } from '../BottomPanel';
import { DrumPadsView } from '../DrumPads';
import { PianoKeyboard } from '../PianoKeyboard';
import type { Clip, SongViewState, SongCallbacks, SongDestination, MixerCallbacks, ClipEditorCallbacks } from '../../types';
import { INSTRUMENT_COLORS } from '../../types';

// ── Track Label (80×60 colored strip) ───────────────────────────────────────

const TRACK_SF_ICONS: Record<string, any> = {
  drum: Icons.drumTrack,
  melodic: Icons.melodicTrack,
  bass: Icons.bassTrack,
  audio: Icons.audioTrack,
};

const TRACK_LABELS: Record<string, string> = {
  drum: 'Drums', melodic: 'Melodic', bass: 'Bass', audio: 'Audio',
};

// ── Clip cell (80×60) ───────────────────────────────────────────────────────

const ClipCell = memo(function ClipCell({ clip, color, onPress }: { clip?: Clip; color: string; onPress?: () => void }) {

  if (!clip) {
    // Empty clip — plus icon with stroke border
    return (
      <Pressable onPress={onPress} style={[styles.clipCell, { borderColor: color, borderWidth: 0.5 }]}>
        <Icon icon={Icons.plus} size={12} color={color} />
      </Pressable>
    );
  }

  // Clip with MIDI preview
  return (
    <Pressable onPress={onPress} style={[styles.clipCell, { backgroundColor: color, borderRadius: 6 }]}>
      <View style={styles.clipContent}>
        {clip.notes.map((note: any, i: number) => {
          const maxBeat = Math.max(...clip.notes.map((n: any) => n.position + n.duration), 4);
          const minNote = Math.min(...clip.notes.map((n: any) => n.noteNumber));
          const maxNote = Math.max(...clip.notes.map((n: any) => n.noteNumber));
          const range = Math.max(maxNote - minNote, 1);
          const x = (note.position / maxBeat) * 72;
          const w = Math.max((note.duration / maxBeat) * 72, 2);
          const y = 52 - ((note.noteNumber - minNote) / range) * 48;
          return (
            <View key={i} style={{
              position: 'absolute', left: x, top: y,
              width: w, height: Math.max(52 / range, 3) * 0.8,
              backgroundColor: 'rgba(26,28,32,0.4)', borderRadius: 1,
            }} />
          );
        })}
      </View>
    </Pressable>
  );
});

// ── SongView Props ──────────────────────────────────────────────────────────

export interface SongViewProps {
  song: SongViewState;
  callbacks?: SongCallbacks;
  mixerCallbacks?: MixerCallbacks;
  clipEditorCallbacks?: ClipEditorCallbacks;
  style?: StyleProp<ViewStyle>;
}

// ── Main Component ──────────────────────────────────────────────────────────

export const SongView = memo(function SongView({
  song, callbacks, mixerCallbacks, style,
}: SongViewProps) {
  const [bottomPanelExpanded, setBottomPanelExpanded] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const { colors } = useTheme();
  const handleTabPress = useCallback((dest: SongDestination) => {
    callbacks?.onNavigate?.(dest);
  }, [callbacks]);

  const handleTrackPress = useCallback((trackId: number) => {
    setSelectedTrackId(trackId);
    setBottomPanelExpanded(true);
  }, []);

  const view = song.currentView;
  const isEditorView = typeof view !== 'string';
  const showToolbar = typeof view === 'string';
  const showTabBar = typeof view === 'string' && (view === 'song' || view === 'mixer');
  const selectedTrack = selectedTrackId != null ? song.tracks.find(t => t.id === selectedTrackId) : null;

  // Editor view — full screen
  if (isEditorView) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack }, style]}>
      {showToolbar && <SongToolbar song={song} callbacks={callbacks} />}

      <View style={styles.content}>
        {view === 'song' && (
          <>
            <ScrollView style={styles.scrollArea}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.gridContainer}>
                  {/* Section headers — offset 84px from left, at top */}
                  <View style={styles.sectionHeaders}>
                    {song.sections.map(section => {
                      const isActive = section.id === song.currentSectionId;
                      return (
                        <Pressable
                          key={section.id}
                          onPress={() => callbacks?.onSectionSelect?.(section.id)}
                          style={[styles.sectionTab, {
                            backgroundColor: isActive ? colors.mcOrange : colors.mcBlack3,
                          }]}
                        >
                          <Text variant="small" color={isActive ? colors.mcBlack : colors.mcWhite} center>
                            {section.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {/* Add section button */}
                    <Pressable
                      onPress={() => {}}
                      style={[styles.sectionTab, { borderWidth: 1, borderColor: colors.mcBlack5, borderStyle: 'dashed' }]}
                    >
                      <Icon icon={Icons.plus} size={14} color={colors.mcBlack5} />
                    </Pressable>
                  </View>

                  {/* Track rows — each row has label + clips per section */}
                  <View style={styles.trackRows}>
                    {song.tracks.map(track => {
                      const trackColor = INSTRUMENT_COLORS[track.type] || colors.mcWhite;
                      const trackIcon = TRACK_SF_ICONS[track.type] || Icons.drumTrack;

                      return (
                        <View key={track.id} style={styles.trackRow}>
                          {/* Track label — 80×60 colored */}
                          <Pressable
                            onPress={() => handleTrackPress(track.id)}
                            style={[styles.trackLabel, { backgroundColor: trackColor + 'CC' }]}
                          >
                            <Icon icon={trackIcon} size={15} color={colors.mcBlack} />
                            <Text variant="extraSmall" color={colors.mcBlack} bold style={styles.trackLabelText}>
                              {TRACK_LABELS[track.type] || track.title}
                            </Text>
                          </Pressable>

                          {/* Clips — one per section */}
                          {song.sections.map(section => {
                            const clip = track.clips.find(c => c.sectionID === section.id);
                            return (
                              <ClipCell
                                key={section.id}
                                clip={clip}
                                color={trackColor}
                                onPress={() => {
                                  if (clip) {
                                    callbacks?.onClipSelect?.(clip.id, track.id);
                                  }
                                }}
                              />
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              {/* Add track */}
              <Pressable onPress={() => callbacks?.onAddTrack?.('drum')} style={styles.addTrackRow}>
                <Icon icon={Icons.plus} size={14} color={colors.mcWhite3} />
                <Text variant="small" color={colors.mcWhite3}>Add track</Text>
              </Pressable>
            </ScrollView>

            {/* Bottom panel */}
            {selectedTrack && (
              <BottomPanel isExpanded={bottomPanelExpanded} onToggle={() => setBottomPanelExpanded(!bottomPanelExpanded)}>
                {selectedTrack.type === 'drum' ? (
                  <DrumPadsView samples={[]} onPadPress={() => {}} onPadRelease={() => {}} highlightColor={selectedTrack.colorHex} />
                ) : (
                  <PianoKeyboard numberOfOctaves={2} highlightColor={selectedTrack.colorHex} showNoteNames />
                )}
              </BottomPanel>
            )}
          </>
        )}

        {view === 'mixer' && <MixerView tracks={song.tracks} callbacks={mixerCallbacks} />}
        {view === 'settings' && <SongSettings song={song} />}

        {song.isNewTrackMenuVisible && (
          <View style={styles.overlay}>
            <AddTrackMenu onSelect={(type) => callbacks?.onAddTrack?.(type)} />
          </View>
        )}
      </View>

      {showTabBar && <SongMixerTabBar currentView={song.currentView} onTabPress={handleTabPress} />}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  scrollArea: { flex: 1 },

  // Grid — sections as columns, tracks as rows
  gridContainer: {},
  sectionHeaders: {
    flexDirection: 'row',
    paddingLeft: 84, // offset for track labels
    gap: 4,
    marginBottom: 4,
  },
  sectionTab: {
    width: 80,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
  },

  trackRows: { gap: 4 },
  trackRow: { flexDirection: 'row', gap: 4 },
  trackLabel: {
    width: 80, height: 60,
    justifyContent: 'center', alignItems: 'center',
    gap: 4,
  },
  trackLabelText: { fontSize: 10 },

  clipCell: {
    width: 80, height: 60,
    justifyContent: 'center', alignItems: 'center',
    padding: 4,
  },
  clipContent: { flex: 1, width: '100%', position: 'relative' },

  addTrackRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingLeft: 16,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
  },
});

export default SongView;
