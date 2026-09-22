/**
 * SongView Snapshot + Behavioral Tests
 *
 * All components read state from useSongContext (SongStoreProvider).
 * Tests create a real zustand store with mock data.
 */
import React from 'react';
import { act, render, fireEvent, waitFor } from '@testing-library/react-native';
import { Modal, Platform } from 'react-native';
import { create } from 'zustand';
import { ThemeProvider } from '../../../../../theme';
import { SongView } from '../SongView';
import { SongToolbar } from '../SongToolbar';
import { SongMixerTabBar } from '../SongMixerTabBar';
import { SongStoreProvider } from '../../../stores/playgroundStore';
import {
  EditorPolicyProvider,
  type EditorPolicy,
} from '../../../stores/editorPolicy';
import type { SongStore } from '../../../stores/playgroundStore';
import {
  createMockClip,
  createMockNote,
  createMockSong,
  createMockTrack,
  resetMockIds,
} from '../../../mocks';

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
    duplicateSection: jest.fn(),
    removeSection: jest.fn(),
    setTrackVolume: jest.fn(),
    setTrackPan: jest.fn(),
    toggleTrackMute: jest.fn(),
    toggleTrackSolo: jest.fn(),
    addNote: jest.fn(),
    removeNote: jest.fn(),
    updateNote: jest.fn(),
    setClipNotes: jest.fn(),
    createClip: jest.fn(),
    duplicateClip: jest.fn(),
    removeClip: jest.fn(),
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
    toggleAuditionOnPlace: jest.fn(),
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

describe('SongView policy accessibility', () => {
  it('does not let SongView, toolbar, mixer, or settings props bypass contextual read-only', () => {
    const store = createTestStore();
    const permissive = {
      readOnly: false,
      capabilities: { metronome: true, mixer: true, tempo: true },
    } as const;
    const { getByTestId, getByLabelText, getAllByLabelText } = render(
      <ThemeProvider initialMode="dark">
        <SongStoreProvider store={store as any}>
          <EditorPolicyProvider policy={{ readOnly: true }}>
            <SongView editorPolicy={permissive} />
          </EditorPolicyProvider>
        </SongStoreProvider>
      </ThemeProvider>
    );

    // The metronome is playback control, not a musical mutation, so read-only
    // leaves it working. Everything below is a real bypass attempt and stays
    // blocked by the contextual policy.
    fireEvent.press(getByTestId('transport-metronome'));
    expect(store.getState().toggleMetronome).toHaveBeenCalled();

    fireEvent.press(getByTestId('tab-mixer'));
    expect(
      getAllByLabelText('Mute track').every(
        (control) => control.props.accessibilityState?.disabled === true
      )
    ).toBe(true);

    fireEvent.press(getByTestId('transport-settings'));
    expect(getByLabelText('Tempo').props.accessibilityState.disabled).toBe(
      true
    );
    expect(
      getByLabelText('Master volume').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('rerenders the whole editor when toolbar playback state changes', async () => {
    const store = createTestStore({ isPlaying: false });
    const screen = renderWithStore(<SongView />, store);

    fireEvent.press(screen.getByTestId('transport-play-pause'));

    await waitFor(() => {
      expect(store.getState().isPlaying).toBe(true);
      expect(
        screen.getByTestId('transport-play-pause').props.accessibilityLabel
      ).toBe('Pause');
    });
  });

  it('announces read-only without disabling the editor container while Play remains enabled', () => {
    const store = createTestStore();
    const { getByLabelText, getByTestId } = renderWithStore(
      <SongView editorPolicy={{ readOnly: true }} />,
      store
    );

    const editor = getByLabelText('Song editor, read only');
    expect(editor.props.accessibilityState?.disabled).not.toBe(true);
    expect(editor.props.accessibilityValue).toEqual({
      text: 'Read only; playback available',
    });
    expect(
      getByTestId('transport-play-pause').props.accessibilityState.disabled
    ).not.toBe(true);
  });

  it('exposes stable accessible controls for empty clips, tracks, and sections', () => {
    const track = createMockTrack({ clips: [] });
    const store = createTestStore({ tracks: [track] });
    const section = store.getState().sections[0]!;
    const screen = renderWithStore(<SongView />, store);

    expect(screen.getByTestId('add-track-button').props).toMatchObject({
      accessibilityLabel: 'Add track',
      accessibilityRole: 'button',
    });
    expect(screen.getByTestId('add-section-button').props).toMatchObject({
      accessibilityLabel: 'Add section',
      accessibilityRole: 'button',
    });
    expect(
      screen.getByTestId(`empty-clip-${track.id}-${section.id}`).props
    ).toMatchObject({
      accessibilityLabel: 'Create clip',
      accessibilityRole: 'button',
    });
  });

  it('disables empty clip creation when clip editing is unavailable', () => {
    const track = createMockTrack({ clips: [] });
    const store = createTestStore({ tracks: [track] });
    const section = store.getState().sections[0]!;
    const screen = renderWithStore(
      <SongView editorPolicy={{ capabilities: { clips: false } }} />,
      store
    );
    const emptyClip = screen.getByTestId(
      `empty-clip-${track.id}-${section.id}`
    );

    expect(emptyClip.props.accessibilityState).toMatchObject({
      disabled: true,
    });
    fireEvent.press(emptyClip);
    expect(store.getState().createClip).not.toHaveBeenCalled();
  });
});

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

  it('hides transport controls when an external control owns playback', () => {
    const store = createTestStore();
    const { getByTestId, queryByTestId } = renderWithStore(
      <SongToolbar editorPolicy={{ hideTransport: true }} />,
      store
    );

    expect(queryByTestId('transport-play-pause')).toBeNull();
    expect(queryByTestId('transport-loop')).toBeNull();
    expect(queryByTestId('transport-metronome')).toBeNull();
    expect(getByTestId('transport-bpm')).toBeTruthy();
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

describe('SongView context menus', () => {
  afterEach(() => jest.restoreAllMocks());

  function dismissContextMenu(screen: ReturnType<typeof renderWithStore>) {
    const modal = screen
      .UNSAFE_getAllByType(Modal)
      .find((element) => element.props.testID === 'song-context-menu-modal');
    expect(modal).toBeDefined();
    act(() => modal!.props.onDismiss());
  }

  const deniedSoundChangePolicies: [string, EditorPolicy][] = [
    ['sound capability', { capabilities: { sound: false } }],
    ['tracks capability', { capabilities: { tracks: false } }],
    ['read-only policy', { readOnly: true }],
  ];

  it('hides Change Sound when no callback is provided', () => {
    const store = createTestStore();
    const screen = renderWithStore(<SongView />, store);

    fireEvent.press(screen.getByTestId('track-label-1'));

    expect(screen.queryByTestId('change-track-sound-action')).toBeNull();
  });

  it('shows Change Sound for drum, melodic, and bass tracks', () => {
    const onChangeTrackSound = jest.fn();
    const store = createTestStore();
    const screen = renderWithStore(
      <SongView onChangeTrackSound={onChangeTrackSound} />,
      store
    );

    [1, 2, 3].forEach((trackId) => {
      fireEvent.press(screen.getByTestId(`track-label-${trackId}`));
      expect(screen.getByTestId('change-track-sound-action')).toBeTruthy();
      expect(
        screen.getByTestId('change-track-sound-action').props.accessibilityLabel
      ).toBe('Change sound');
      expect(
        screen.getByTestId('change-track-sound-action').props.accessibilityRole
      ).toBe('button');
      fireEvent.press(screen.getByTestId('close-song-menu-action'));
    });
  });

  it('omits Change Sound for audio tracks', () => {
    const store = createTestStore({
      tracks: [
        createMockTrack({ id: 1, type: 'drum' }),
        createMockTrack({ id: 4, type: 'audio', title: 'Audio' }),
      ],
    });
    const screen = renderWithStore(
      <SongView onChangeTrackSound={jest.fn()} />,
      store
    );

    fireEvent.press(screen.getByTestId('track-label-4'));

    expect(screen.queryByTestId('change-track-sound-action')).toBeNull();
  });

  it.each(['android', 'web'] as const)(
    'commits menu closure before calling Change Sound on %s',
    async (platform) => {
      jest.replaceProperty(Platform, 'OS', platform);
      const onChangeTrackSound = jest.fn((): void => {
        expect(screen.queryByTestId('song-context-menu')).toBeNull();
      });
      const store = createTestStore();
      const screen = renderWithStore(
        <SongView onChangeTrackSound={onChangeTrackSound} />,
        store
      );

      fireEvent.press(screen.getByTestId('track-label-2'));
      fireEvent.press(screen.getByTestId('change-track-sound-action'));

      await waitFor(() => expect(onChangeTrackSound).toHaveBeenCalledTimes(1));
      expect(onChangeTrackSound).toHaveBeenCalledWith(2);
    }
  );

  it('waits for iOS dismissal and consumes the queued callback once', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const onChangeTrackSound = jest.fn((): void => {
      expect(screen.queryByTestId('song-context-menu')).toBeNull();
    });
    const store = createTestStore();
    const screen = renderWithStore(
      <SongView onChangeTrackSound={onChangeTrackSound} />,
      store
    );

    fireEvent.press(screen.getByTestId('track-label-2'));
    fireEvent.press(screen.getByTestId('change-track-sound-action'));
    expect(onChangeTrackSound).not.toHaveBeenCalled();

    dismissContextMenu(screen);
    expect(onChangeTrackSound).toHaveBeenCalledTimes(1);
    expect(onChangeTrackSound).toHaveBeenCalledWith(2);
    dismissContextMenu(screen);
    expect(onChangeTrackSound).toHaveBeenCalledTimes(1);
  });

  it('drops a queued sound change when the editor unmounts', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const onChangeTrackSound = jest.fn();
    const screen = renderWithStore(
      <SongView onChangeTrackSound={onChangeTrackSound} />,
      createTestStore()
    );
    fireEvent.press(screen.getByTestId('track-label-2'));
    fireEvent.press(screen.getByTestId('change-track-sound-action'));
    const onDismiss = screen
      .UNSAFE_getAllByType(Modal)
      .find((element) => element.props.testID === 'song-context-menu-modal')!
      .props.onDismiss;
    screen.unmount();

    act(() => onDismiss());
    expect(onChangeTrackSound).not.toHaveBeenCalled();
  });

  it.each(deniedSoundChangePolicies)(
    'rechecks %s after iOS dismissal',
    (_name, editorPolicy) => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      const onChangeTrackSound = jest.fn();
      const store = createTestStore();
      const renderEditor = (policy: EditorPolicy) => (
        <ThemeProvider initialMode="dark">
          <SongStoreProvider store={store as any}>
            <SongView
              onChangeTrackSound={onChangeTrackSound}
              editorPolicy={policy}
            />
          </SongStoreProvider>
        </ThemeProvider>
      );
      const screen = render(renderEditor({}));
      fireEvent.press(screen.getByTestId('track-label-2'));
      fireEvent.press(screen.getByTestId('change-track-sound-action'));
      screen.rerender(renderEditor(editorPolicy));

      dismissContextMenu(screen);
      expect(onChangeTrackSound).not.toHaveBeenCalled();
    }
  );

  it.each(['removed', 'audio'] as const)(
    'does not change sound when the queued track becomes %s',
    (change) => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      const onChangeTrackSound = jest.fn();
      const store = createTestStore();
      const screen = renderWithStore(
        <SongView onChangeTrackSound={onChangeTrackSound} />,
        store
      );
      fireEvent.press(screen.getByTestId('track-label-2'));
      fireEvent.press(screen.getByTestId('change-track-sound-action'));
      act(() => {
        store.setState((state) => ({
          tracks:
            change === 'removed'
              ? state.tracks.filter((track) => track.id !== 2)
              : state.tracks.map((track) =>
                  track.id === 2 ? { ...track, type: 'audio' as const } : track
                ),
        }));
      });

      dismissContextMenu(screen);
      expect(onChangeTrackSound).not.toHaveBeenCalled();
    }
  );

  it('rechecks the callback after iOS dismissal', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const onChangeTrackSound = jest.fn();
    const store = createTestStore();
    const renderEditor = (callback?: (id: number) => void) => (
      <ThemeProvider initialMode="dark">
        <SongStoreProvider store={store as any}>
          <SongView onChangeTrackSound={callback} />
        </SongStoreProvider>
      </ThemeProvider>
    );
    const screen = render(renderEditor(onChangeTrackSound));
    fireEvent.press(screen.getByTestId('track-label-2'));
    fireEvent.press(screen.getByTestId('change-track-sound-action'));
    screen.rerender(renderEditor());

    dismissContextMenu(screen);
    expect(onChangeTrackSound).not.toHaveBeenCalled();
  });

  it.each(deniedSoundChangePolicies)(
    'does not offer Change Sound when denied by %s',
    (_name, editorPolicy) => {
      const onChangeTrackSound = jest.fn();
      const store = createTestStore();
      const screen = renderWithStore(
        <SongView
          onChangeTrackSound={onChangeTrackSound}
          editorPolicy={editorPolicy}
        />,
        store
      );

      fireEvent.press(screen.getByTestId('track-label-2'));

      expect(screen.queryByTestId('change-track-sound-action')).toBeNull();
      expect(onChangeTrackSound).not.toHaveBeenCalled();
    }
  );

  it.each(deniedSoundChangePolicies)(
    'removes Change Sound when %s takes effect with the menu open',
    (_name, policy) => {
      const onChangeTrackSound = jest.fn();
      const store = createTestStore();
      const renderEditor = (inheritedPolicy: EditorPolicy) => (
        <ThemeProvider initialMode="dark">
          <SongStoreProvider store={store as any}>
            <EditorPolicyProvider policy={inheritedPolicy}>
              <SongView
                onChangeTrackSound={onChangeTrackSound}
                editorPolicy={{
                  readOnly: false,
                  capabilities: { sound: true, tracks: true },
                }}
              />
            </EditorPolicyProvider>
          </SongStoreProvider>
        </ThemeProvider>
      );
      const screen = render(renderEditor({}));

      fireEvent.press(screen.getByTestId('track-label-2'));
      expect(screen.getByTestId('change-track-sound-action')).toBeTruthy();

      screen.rerender(renderEditor(policy));

      expect(screen.getByTestId('song-context-menu')).toBeTruthy();
      const changeSoundAction = screen.queryByTestId(
        'change-track-sound-action'
      );
      // Exercise a stale action if it is still exposed after the policy change.
      if (changeSoundAction) fireEvent.press(changeSoundAction);
      expect(onChangeTrackSound).not.toHaveBeenCalled();
      expect(changeSoundAction).toBeNull();
    }
  );

  it('explains why the last track cannot be deleted', () => {
    const store = createTestStore({ tracks: [createMockTrack({ id: 1 })] });
    const screen = renderWithStore(<SongView />, store);

    fireEvent.press(screen.getByTestId('track-label-1'));

    expect(screen.getByText('Cannot delete last track')).toBeTruthy();
    expect(screen.queryByTestId('delete-track-action')).toBeNull();
    expect(store.getState().removeTrack).not.toHaveBeenCalled();
  });

  it('deletes a track after confirmation', () => {
    const store = createTestStore({
      tracks: [createMockTrack({ id: 1 }), createMockTrack({ id: 2 })],
    });
    const { getByTestId } = renderWithStore(<SongView />, store);

    fireEvent.press(getByTestId('track-label-1'));
    expect(
      getByTestId('close-song-context-menu', { includeHiddenElements: true })
        .props.accessible
    ).toBe(false);
    expect(
      getByTestId('song-context-menu').props.accessibilityViewIsModal
    ).toBe(true);
    expect(getByTestId('close-song-menu-action').props.accessibilityLabel).toBe(
      'Close menu'
    );
    fireEvent.press(getByTestId('delete-track-action'));
    expect(getByTestId('close-song-menu-action').props.accessibilityLabel).toBe(
      'Cancel'
    );
    fireEvent.press(getByTestId('confirm-delete-track'));

    expect(store.getState().removeTrack).toHaveBeenCalledWith(1);
  });

  it('duplicates and deletes clips from their context menu', () => {
    const clip = createMockClip({ id: 11, sectionID: 1 });
    const store = createTestStore({
      tracks: [createMockTrack({ id: 1, clips: [clip] })],
    });
    const screen = renderWithStore(<SongView />, store);

    fireEvent.press(screen.getByTestId('clip-menu-1-11'));
    expect(
      screen.getByTestId('close-song-menu-action').props.accessibilityLabel
    ).toBe('Close menu');
    fireEvent.press(screen.getByTestId('duplicate-clip-action'));
    expect(store.getState().duplicateClip).toHaveBeenCalledWith(1, 11);

    fireEvent.press(screen.getByTestId('clip-menu-1-11'));
    fireEvent.press(screen.getByTestId('delete-clip-action'));
    expect(store.getState().removeClip).toHaveBeenCalledWith(1, 11);
  });

  it('renames and duplicates sections from their context menu', () => {
    const store = createTestStore();
    const screen = renderWithStore(<SongView />, store);

    fireEvent.press(screen.getByTestId('section-menu-1'));
    expect(
      screen.getByTestId('close-song-menu-action').props.accessibilityLabel
    ).toBe('Close menu');
    fireEvent.press(screen.getByTestId('rename-section-action'));
    expect(
      screen.getByTestId('close-song-menu-action').props.accessibilityLabel
    ).toBe('Cancel');
    fireEvent.changeText(screen.getByTestId('section-name-input'), 'Drop');
    fireEvent.press(screen.getByTestId('save-section-name'));
    expect(store.getState().renameSection).toHaveBeenCalledWith(1, 'Drop');

    fireEvent.press(screen.getByTestId('section-menu-1'));
    fireEvent.press(screen.getByTestId('duplicate-section-action'));
    expect(store.getState().duplicateSection).toHaveBeenCalledWith(1);
  });
});

describe('SongView share beat flow', () => {
  it('dispatches the share action from settings', () => {
    const onShareBeat = jest.fn();
    const store = createTestStore({ currentTab: 'settings' } as any);

    const { getByLabelText } = renderWithStore(
      <SongView onShareBeat={onShareBeat} />,
      store
    );

    fireEvent.press(getByLabelText('SHARE BEAT'));
    expect(onShareBeat).toHaveBeenCalledTimes(1);
  });

  it('hides the share action when the platform does not provide one', () => {
    const store = createTestStore({ currentTab: 'settings' } as any);
    const { queryByLabelText } = renderWithStore(<SongView />, store);

    expect(queryByLabelText('SHARE BEAT')).toBeNull();
  });
});

describe('SongView export audio flow', () => {
  // Settings row mirrors iOS: it is always enabled and navigates into the
  // export view. The export guard lives inside that view, not on the row.

  it('Settings export row is always enabled, even for an empty playground', () => {
    const emptyTrack = createMockTrack({
      id: 1,
      clips: [createMockClip({ notes: [] })],
    });
    const store = createTestStore({
      currentTab: 'settings',
      tracks: [emptyTrack],
    } as any);

    const { getByLabelText } = renderWithStore(<SongView />, store);

    const settingsRow = getByLabelText('EXPORT AUDIO');
    expect(settingsRow.props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

  it('opens the export view and disables the export button when empty', () => {
    const onExportAudio = jest.fn();
    const emptyTrack = createMockTrack({
      id: 1,
      clips: [createMockClip({ notes: [] })],
    });
    const store = createTestStore({
      currentTab: 'settings',
      tracks: [emptyTrack],
    } as any);

    const { getByLabelText } = renderWithStore(
      <SongView onExportAudio={onExportAudio} />,
      store
    );

    // Open the export view from the Settings row.
    fireEvent.press(getByLabelText('EXPORT AUDIO'));

    const exportButton = getByLabelText('Export Audio');
    expect(exportButton.props.accessibilityState).toMatchObject({
      disabled: true,
    });

    fireEvent.press(exportButton);
    expect(onExportAudio).not.toHaveBeenCalled();
  });

  it('enables the export button once a clip has MIDI notes', async () => {
    const onExportAudio = jest.fn();
    const track = createMockTrack({
      id: 1,
      clips: [createMockClip({ notes: [createMockNote()] })],
    });
    const store = createTestStore({
      currentTab: 'settings',
      tracks: [track],
    } as any);

    const { getByLabelText } = renderWithStore(
      <SongView onExportAudio={onExportAudio} />,
      store
    );

    fireEvent.press(getByLabelText('EXPORT AUDIO'));

    const exportButton = getByLabelText('Export Audio');
    expect(exportButton.props.accessibilityState).toMatchObject({
      disabled: false,
    });

    fireEvent.press(exportButton);
    await waitFor(() =>
      expect(exportButton.props.accessibilityState).toMatchObject({
        disabled: true,
      })
    );
    await waitFor(() =>
      expect(exportButton.props.accessibilityState).toMatchObject({
        disabled: false,
      })
    );
    expect(onExportAudio).toHaveBeenCalledTimes(1);
  });
});
