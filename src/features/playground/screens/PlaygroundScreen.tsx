/**
 * PlaygroundScreen — prototype connected screen
 * In production, this lives in midicircuit-rn and uses the real songStore.
 */
import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { create } from 'zustand';
import { SongView } from '../components/SongView';
import { useTheme } from '../../../theme';
import { createMockSong } from '../mocks';
import { SongStoreProvider } from '../stores/playgroundStore';
import type { SongStore } from '../stores/playgroundStore';

const noop = (() => {}) as any;

interface Props {
  onBack?: () => void;
}

export const PlaygroundScreen = memo(function PlaygroundScreen({
  onBack,
}: Props) {
  const { colors } = useTheme();
  const mockSong = createMockSong();

  const useMockStore = create<SongStore>()(() => ({
    ...mockSong,
    setPlaying: noop,
    setRecording: noop,
    setTempo: noop,
    toggleMetronome: noop,
    toggleLoop: noop,
    setCurrentSection: noop,
    addSection: noop,
    renameSection: noop,
    removeSection: noop,
    setTrackVolume: noop,
    setTrackPan: noop,
    toggleTrackMute: noop,
    toggleTrackSolo: noop,
    addNote: noop,
    removeNote: noop,
    updateNote: noop,
    setClipNotes: noop,
    createClip: noop,
    setClipLength: noop,
    addNewTrack: noop,
    removeTrack: noop,
    showSongView: noop,
    showAddTrackMenu: noop,
    showSoundBankPicker: noop,
    fetchSoundBanks: async () => {},
    selectSoundBank: noop,
    previewSoundBank: noop,
    stopPreview: noop,
    confirmSoundBank: noop,
    undoClipEdit: noop,
    redoClipEdit: noop,
    liveNoteOn: noop,
    liveNoteOff: noop,
    showClipSettings: noop,
    hideClipSettings: noop,
    togglePianoNoteNames: noop,
    openClipEditor: noop,
    setCurrentTab: noop,
    setMasterVolume: noop,
  }));

  return (
    <SongStoreProvider store={useMockStore as any}>
      <View style={[styles.container, { backgroundColor: colors.mcBlack }]}>
        <SongView onBack={onBack} />
      </View>
    </SongStoreProvider>
  );
});

const styles = StyleSheet.create({ container: { flex: 1 } });
