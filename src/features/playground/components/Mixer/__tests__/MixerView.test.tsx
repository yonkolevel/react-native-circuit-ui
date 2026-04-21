import { render } from '@testing-library/react-native';
import { create } from 'zustand';
import { ThemeProvider } from '../../../../../theme';
import { MixerView } from '../MixerView';
import { SongStoreProvider } from '../../../stores/playgroundStore';
import type { SongStore } from '../../../stores/playgroundStore';
import { createMockTrack, createMockSong, resetMockIds } from '../../../mocks';

const noop = (() => {}) as any;

function createTestStore(tracks: ReturnType<typeof createMockTrack>[]) {
  const song = createMockSong();
  return create<SongStore>()(() => ({
    ...song,
    tracks,
    currentTab: 'mixer' as const,
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
}

function renderWithStore(tracks: ReturnType<typeof createMockTrack>[]) {
  const store = createTestStore(tracks);
  return render(
    <ThemeProvider initialMode="dark">
      <SongStoreProvider store={store as any}>
        <MixerView />
      </SongStoreProvider>
    </ThemeProvider>
  );
}

beforeEach(() => resetMockIds());

describe('MixerView snapshots', () => {
  it('matches snapshot with 3 tracks', () => {
    const tracks = [
      createMockTrack({ id: 1, type: 'drum', title: 'Drums' }),
      createMockTrack({ id: 2, type: 'melodic', title: 'Keys' }),
      createMockTrack({ id: 3, type: 'bass', title: 'Bass' }),
    ];
    const tree = renderWithStore(tracks);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot with muted track', () => {
    const tracks = [createMockTrack({ id: 1, type: 'drum', isMuted: true })];
    const tree = renderWithStore(tracks);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot with soloed track', () => {
    const tracks = [
      createMockTrack({ id: 1, type: 'drum', isSoloed: true }),
      createMockTrack({ id: 2, type: 'melodic' }),
    ];
    const tree = renderWithStore(tracks);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
