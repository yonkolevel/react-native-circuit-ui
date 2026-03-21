/**
 * PlaygroundScreen — connected SongView with songStore
 *
 * The main DAW screen. Reads from songStore and passes state + callbacks.
 */
import { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SongView } from '../components/SongView';
import { useSongStore } from '../stores/songStore';
import { useTheme } from '../../../theme';
import type { SongCallbacks, MixerCallbacks } from '../types';

interface Props {
  onBack?: () => void;
}

export const PlaygroundScreen = memo(function PlaygroundScreen({ onBack }: Props) {
  const { colors } = useTheme();
  const store = useSongStore();

  const songCallbacks: SongCallbacks = useMemo(() => ({
    onPlay: store.play,
    onPause: store.pause,
    onStop: store.stop,
    onRecord: store.toggleRecord,
    onTempoChange: store.setTempo,
    onTrackSelect: () => {},
    onClipSelect: store.selectClip,
    onAddTrack: store.addTrack,
    onDeleteTrack: store.deleteTrack,
    onSectionSelect: store.selectSection,
    onNavigate: store.navigate,
    onToggleMetronome: store.toggleMetronome,
    onToggleLoop: store.toggleLoop,
    onBack,
  }), [store, onBack]);

  const mixerCallbacks: MixerCallbacks = useMemo(() => ({
    onVolumeChange: store.setTrackVolume,
    onPanChange: store.setTrackPan,
    onMuteToggle: store.toggleMute,
    onSoloToggle: store.toggleSolo,
  }), [store]);

  // Build SongState from store (store IS the state since it extends SongState)
  const songState = useMemo(() => ({
    id: store.id,
    sections: store.sections,
    currentSection: store.currentSection,
    isPlaying: store.isPlaying,
    tempo: store.tempo,
    masterVolume: store.masterVolume,
    lengthInBeats: store.lengthInBeats,
    isLoopEnabled: store.isLoopEnabled,
    isMetronomeEnabled: store.isMetronomeEnabled,
    isRecording: store.isRecording,
    isRecordingArmed: store.isRecordingArmed,
    tracks: store.tracks,
    soundBanks: store.soundBanks,
    currentView: store.currentView,
    currentBeatPosition: store.currentBeatPosition,
    zoomLevel: store.zoomLevel,
    isNewTrackMenuVisible: store.isNewTrackMenuVisible,
    isSoundBankViewVisible: store.isSoundBankViewVisible,
    isSectionNameEditViewVisible: store.isSectionNameEditViewVisible,
    isClipSettingsVisible: store.isClipSettingsVisible,
    currentSoundBankCategorySelection: store.currentSoundBankCategorySelection,
  }), [store]);

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack }]}>
      <SongView
        song={songState}
        callbacks={songCallbacks}
        mixerCallbacks={mixerCallbacks}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
});
