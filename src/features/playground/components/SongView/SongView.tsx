/**
 * SongView — Main DAW container (fully wired)
 *
 * Routes to actual sub-components based on currentView:
 *   'song'    → SongToolbar + Sections + TrackList + AddTrack + SongMixerTabBar
 *   'mixer'   → SongToolbar + MixerView + SongMixerTabBar
 *   'settings'→ SongToolbar + SongSettings
 *   pianoRoll → ClipEditorView (full screen, no toolbar/tabbar)
 */
import { memo, useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../../../theme';
import { SongToolbar } from './SongToolbar';
import { SongMixerTabBar } from './SongMixerTabBar';
import { TrackView, AddTrackRow } from '../TrackView';
import { MixerView } from '../Mixer';
import { SongSectionsView } from '../Sections';
import { SongSettings } from '../Settings';
import { ClipEditorView } from '../ClipEditor';
import { BottomPanel } from '../BottomPanel';
import { DrumPadsView } from '../DrumPads';
import { PianoKeyboard } from '../PianoKeyboard';
import { AddTrackMenu } from '../Toolbar';
import { SoundBankView } from '../SoundBank';
import type { SongState, SongCallbacks, SongDestination, MixerCallbacks, ClipEditorCallbacks } from '../../types';

export interface SongViewProps {
  song: SongState;
  callbacks?: SongCallbacks;
  mixerCallbacks?: MixerCallbacks;
  clipEditorCallbacks?: ClipEditorCallbacks;
  style?: StyleProp<ViewStyle>;
}

export const SongView = memo(function SongView({
  song, callbacks, mixerCallbacks, clipEditorCallbacks, style,
}: SongViewProps) {
  const { colors } = useTheme();
  const [bottomPanelExpanded, setBottomPanelExpanded] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const handleTabPress = useCallback((dest: SongDestination) => {
    callbacks?.onNavigate?.(dest);
  }, [callbacks]);

  const handleClipPress = useCallback((clipId: number, trackId: number) => {
    callbacks?.onClipSelect?.(clipId, trackId);
  }, [callbacks]);

  const handleTrackPress = useCallback((trackId: number) => {
    setSelectedTrackId(trackId);
    setBottomPanelExpanded(true);
    callbacks?.onTrackSelect?.(trackId);
  }, [callbacks]);

  // Determine what to show
  const view = song.currentView;
  const isEditorView = typeof view !== 'string';
  const showToolbar = typeof view === 'string';
  const showTabBar = typeof view === 'string' && (view === 'song' || view === 'mixer');
  const selectedTrack = selectedTrackId != null ? song.tracks.find(t => t.id === selectedTrackId) : null;

  // ── Editor views (full screen, no chrome) ─────────────────────────────
  if (isEditorView) {
    if (view.kind === 'pianoRoll') {
      const clip = song.tracks
        .flatMap(t => t.clips)
        .find(c => c.id === view.config.clipId);
      if (clip) {
        return (
          <ClipEditorView
            clip={clip}
            instrumentType={view.config.instrumentType}
            soundBank={song.tracks.find(t => t.id === view.config.trackId)?.soundBank}
            isPlaying={song.isPlaying}
            isRecording={song.isRecording}
            isMetronomeEnabled={song.isMetronomeEnabled}
            playheadPosition={song.currentBeatPosition}
            callbacks={clipEditorCallbacks}
            onBack={() => callbacks?.onNavigate?.('song')}
          />
        );
      }
    }
    // Fallback for audio clip editor or unknown
    return null;
  }

  // ── Standard views (with toolbar + optional tabbar) ───────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack }, style]} accessibilityLabel="Song view">
      {showToolbar && <SongToolbar song={song} callbacks={callbacks} />}

      {/* Content area */}
      <View style={styles.content}>
        {view === 'song' && (
          <>
            {/* Sections bar */}
            <SongSectionsView
              sections={song.sections}
              currentSectionId={song.currentSection.id}
              onSelect={(id) => callbacks?.onSectionSelect?.(id)}
              onAdd={() => {}}
            />

            {/* Track list */}
            <ScrollView style={styles.trackList}>
              {song.tracks.map(track => (
                <TrackView
                  key={track.id}
                  track={track}
                  isSelected={track.id === selectedTrackId}
                  onClipPress={(clipId) => handleClipPress(clipId, track.id)}
                  onTrackPress={handleTrackPress}
                />
              ))}
              <AddTrackRow onPress={() => callbacks?.onAddTrack?.('drum')} />
            </ScrollView>

            {/* Bottom panel — shows instrument for selected track */}
            {selectedTrack && (
              <BottomPanel
                isExpanded={bottomPanelExpanded}
                onToggle={() => setBottomPanelExpanded(!bottomPanelExpanded)}
              >
                {selectedTrack.type === 'drum' ? (
                  <DrumPadsView
                    samples={selectedTrack.soundBank.samples}
                    onPadPress={() => {}}
                    onPadRelease={() => {}}
                    highlightColor={selectedTrack.color}
                  />
                ) : (
                  <PianoKeyboard
                    numberOfOctaves={2}
                    highlightColor={selectedTrack.color}
                    showNoteNames
                    onNoteOn={() => {}}
                    onNoteOff={() => {}}
                  />
                )}
              </BottomPanel>
            )}
          </>
        )}

        {view === 'mixer' && (
          <MixerView
            tracks={song.tracks}
            callbacks={mixerCallbacks}
          />
        )}

        {view === 'settings' && (
          <SongSettings
            song={song}
            onTempoChange={callbacks?.onTempoChange}
            onToggleMetronome={callbacks?.onToggleMetronome}
            onToggleLoop={callbacks?.onToggleLoop}
          />
        )}

        {/* Add track menu overlay */}
        {song.isNewTrackMenuVisible && (
          <View style={styles.menuOverlay}>
            <AddTrackMenu
              onSelect={(type) => callbacks?.onAddTrack?.(type)}
              onClose={() => {}}
            />
          </View>
        )}

        {/* Sound bank picker overlay */}
        {song.isSoundBankViewVisible && (
          <View style={styles.menuOverlay}>
            <SoundBankView
              soundBanks={song.soundBanks}
              categoryFilter={song.currentSoundBankCategorySelection}
              onSelect={() => {}}
              onDone={() => {}}
            />
          </View>
        )}
      </View>

      {showTabBar && (
        <SongMixerTabBar
          currentView={song.currentView}
          onTabPress={handleTabPress}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  trackList: { flex: 1 },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
  },
});

export default SongView;
