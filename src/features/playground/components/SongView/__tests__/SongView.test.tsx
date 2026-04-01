/**
 * SongView Snapshot + Behavioral Tests
 *
 * All components read state from useSongContext (SongStoreProvider).
 * Tests create a real zustand store with mock data.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { create } from 'zustand';
import { ThemeProvider } from '../../../../../theme';
import { SongView } from '../SongView';
import { SongToolbar } from '../SongToolbar';
import { SongMixerTabBar } from '../SongMixerTabBar';
import { SongStoreProvider } from '../../../stores/playgroundStore';
import type { SongStore } from '../../../stores/playgroundStore';
import { createMockSong, resetMockIds } from '../../../mocks';

function createTestStore(
  overrides: Partial<ReturnType<typeof createMockSong>> = {}
) {
  const song = createMockSong(overrides);
  return create<SongStore>()((set) => ({
    ...song,
    currentTab: (overrides as any).currentTab ?? 'song',
    // Actions
    setRecording: jest.fn(),
    setPlaying: jest.fn((playing) => set({ isPlaying: playing })),
    setTempo: jest.fn(),
    toggleMetronome: jest.fn(() =>
      set((s) => ({ isMetronomeEnabled: !s.isMetronomeEnabled }))
    ),
    toggleLoop: jest.fn(() =>
      set((s) => ({ isLoopEnabled: !s.isLoopEnabled }))
    ),
    setCurrentSection: jest.fn(),
    addSection: jest.fn(),
    renameSection: jest.fn(),
    setTrackVolume: jest.fn(),
    setTrackPan: jest.fn(),
    toggleTrackMute: jest.fn(),
    toggleTrackSolo: jest.fn(),
    addNote: jest.fn(),
    removeNote: jest.fn(),
    updateNote: jest.fn(),
    setClipNotes: jest.fn(),
    createClip: jest.fn(),
    setClipLength: jest.fn(),
    addNewTrack: jest.fn(),
    removeTrack: jest.fn(),
    showSongView: jest.fn(),
    showAddTrackMenu: jest.fn(),
    showSoundBankPicker: jest.fn(),
    fetchSoundBanks: jest.fn(),
    selectSoundBank: jest.fn(),
    previewSoundBank: jest.fn(),
    stopPreview: jest.fn(),
    confirmSoundBank: jest.fn(),
    undoClipEdit: jest.fn(),
    redoClipEdit: jest.fn(),
    liveNoteOn: jest.fn(),
    liveNoteOff: jest.fn(),
    showClipSettings: jest.fn(),
    hideClipSettings: jest.fn(),
    togglePianoNoteNames: jest.fn(),
    openClipEditor: jest.fn(),
    setCurrentTab: jest.fn((tab: string) => set({ currentTab: tab as any })),
    setMasterVolume: jest.fn(),
  }));
}

function renderWithStore(
  ui: React.ReactElement,
  store: ReturnType<typeof createTestStore>
) {
  return render(
    <ThemeProvider initialMode="dark">
      <SongStoreProvider store={store as any}>{ui}</SongStoreProvider>
    </ThemeProvider>
  );
}

beforeEach(() => resetMockIds());

// ─── Snapshot Tests ─────────────────────────────────────────────────────────

describe('SongView snapshots', () => {
  it('matches snapshot for song view', () => {
    const store = createTestStore();
    const tree = renderWithStore(<SongView />, store);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot for mixer view', () => {
    const store = createTestStore({ currentTab: 'mixer' } as any);
    const tree = renderWithStore(<SongView />, store);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot for settings view', () => {
    const store = createTestStore({ currentTab: 'settings' } as any);
    const tree = renderWithStore(<SongView />, store);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

describe('SongToolbar snapshots', () => {
  it('matches snapshot when stopped', () => {
    const store = createTestStore({ isPlaying: false });
    const tree = renderWithStore(<SongToolbar />, store);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot when playing', () => {
    const store = createTestStore({ isPlaying: true });
    const tree = renderWithStore(<SongToolbar />, store);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

describe('SongMixerTabBar snapshots', () => {
  it('matches snapshot with song active', () => {
    const store = createTestStore();
    const tree = renderWithStore(<SongMixerTabBar />, store);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot with mixer active', () => {
    const store = createTestStore({ currentTab: 'mixer' } as any);
    const tree = renderWithStore(<SongMixerTabBar />, store);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

// ─── Behavioral Tests ───────────────────────────────────────────────────────

describe('SongToolbar behavior', () => {
  it('calls setPlaying(true) when not playing', () => {
    const store = createTestStore({ isPlaying: false });
    const { getByTestId } = renderWithStore(<SongToolbar />, store);
    fireEvent.press(getByTestId('transport-play-pause'));
    expect(store.getState().setPlaying).toHaveBeenCalledWith(true);
  });

  it('calls setPlaying(false) when playing', () => {
    const store = createTestStore({ isPlaying: true });
    const { getByTestId } = renderWithStore(<SongToolbar />, store);
    fireEvent.press(getByTestId('transport-play-pause'));
    expect(store.getState().setPlaying).toHaveBeenCalledWith(false);
  });

  it('calls toggleLoop', () => {
    const store = createTestStore();
    const { getByTestId } = renderWithStore(<SongToolbar />, store);
    fireEvent.press(getByTestId('transport-loop'));
    expect(store.getState().toggleLoop).toHaveBeenCalled();
  });

  it('calls toggleMetronome', () => {
    const store = createTestStore();
    const { getByTestId } = renderWithStore(<SongToolbar />, store);
    fireEvent.press(getByTestId('transport-metronome'));
    expect(store.getState().toggleMetronome).toHaveBeenCalled();
  });
});

describe('SongMixerTabBar behavior', () => {
  it('renders both tabs', () => {
    const store = createTestStore();
    const { getByTestId } = renderWithStore(<SongMixerTabBar />, store);
    expect(getByTestId('tab-song')).toBeTruthy();
    expect(getByTestId('tab-mixer')).toBeTruthy();
  });

  it('calls setCurrentTab with mixer', () => {
    const store = createTestStore();
    const { getByTestId } = renderWithStore(<SongMixerTabBar />, store);
    fireEvent.press(getByTestId('tab-mixer'));
    expect(store.getState().setCurrentTab).toHaveBeenCalledWith('mixer');
  });
});
