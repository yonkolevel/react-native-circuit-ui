/**
 * SongView Component Tests
 *
 * Tests for SongView (main container), SongToolbar (transport controls),
 * and SongMixerTabBar (2-tab navigation).
 *
 * Matches SwiftUI behavior:
 * - Toolbar: play/pause, loop (green when on), metronome, settings gear
 * - Tab bar: Song | Mixer (2 tabs), orange bg on active, #666 on inactive
 * - Tab bar hidden for settings and editor views
 * - Toolbar hidden for editor views
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { SongView } from '../SongView';
import { SongToolbar } from '../SongToolbar';
import { SongMixerTabBar } from '../SongMixerTabBar';
import { createMockSong, resetMockIds } from '../../../mocks';
import type { SongCallbacks, SongDestination } from '../../../types';

// ─── Test Helpers ───────────────────────────────────────────────────────────

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

beforeEach(() => {
  resetMockIds();
});

// ─── SongView Tests ─────────────────────────────────────────────────────────

describe('SongView', () => {
  it('renders without crashing', () => {
    const song = createMockSong();
    const { getByTestId } = renderWithTheme(
      <SongView song={song} />
    );
    expect(getByTestId('song-view')).toBeTruthy();
  });

  it('renders song arrangement content when currentView is "song"', () => {
    const song = createMockSong({ currentView: 'song' });
    const { getByTestId } = renderWithTheme(
      <SongView song={song} />
    );
    expect(getByTestId('content-song')).toBeTruthy();
  });

  it('renders mixer content when currentView is "mixer"', () => {
    const song = createMockSong({ currentView: 'mixer' });
    const { getByTestId } = renderWithTheme(
      <SongView song={song} />
    );
    expect(getByTestId('content-mixer')).toBeTruthy();
  });

  it('renders settings content when currentView is "settings"', () => {
    const song = createMockSong({ currentView: 'settings' });
    const { getByTestId } = renderWithTheme(
      <SongView song={song} />
    );
    expect(getByTestId('content-settings')).toBeTruthy();
  });

  it('renders piano roll content for pianoRoll destination', () => {
    const song = createMockSong({
      currentView: {
        kind: 'pianoRoll',
        config: { clipId: 1, trackId: 1, instrumentType: 'melodic' },
      },
    });
    const { getByTestId } = renderWithTheme(
      <SongView song={song} />
    );
    expect(getByTestId('content-piano-roll')).toBeTruthy();
  });

  it('renders audio editor content for audioClipEditor destination', () => {
    const song = createMockSong({
      currentView: {
        kind: 'audioClipEditor',
        config: { clipId: 2, trackId: 3, audioFileReference: 'file.wav' },
      },
    });
    const { getByTestId } = renderWithTheme(
      <SongView song={song} />
    );
    expect(getByTestId('content-audio-editor')).toBeTruthy();
  });

  it('hides tab bar when in piano roll editor', () => {
    const song = createMockSong({
      currentView: {
        kind: 'pianoRoll',
        config: { clipId: 1, trackId: 1, instrumentType: 'drum' },
      },
    });
    const { queryByTestId } = renderWithTheme(
      <SongView song={song} />
    );
    expect(queryByTestId('tab-song')).toBeNull();
    expect(queryByTestId('tab-mixer')).toBeNull();
  });

  it('hides toolbar when in piano roll editor', () => {
    const song = createMockSong({
      currentView: {
        kind: 'pianoRoll',
        config: { clipId: 1, trackId: 1, instrumentType: 'drum' },
      },
    });
    const { queryByTestId } = renderWithTheme(
      <SongView song={song} />
    );
    expect(queryByTestId('song-toolbar')).toBeNull();
  });

  it('hides tab bar when in settings view', () => {
    const song = createMockSong({ currentView: 'settings' });
    const { queryByTestId } = renderWithTheme(
      <SongView song={song} />
    );
    expect(queryByTestId('tab-song')).toBeNull();
    expect(queryByTestId('tab-mixer')).toBeNull();
  });

  it('shows toolbar when in settings view', () => {
    const song = createMockSong({ currentView: 'settings' });
    const { getByTestId } = renderWithTheme(
      <SongView song={song} />
    );
    expect(getByTestId('song-toolbar')).toBeTruthy();
  });

  it('shows tab bar when in song view', () => {
    const song = createMockSong({ currentView: 'song' });
    const { getByTestId } = renderWithTheme(
      <SongView song={song} />
    );
    expect(getByTestId('tab-song')).toBeTruthy();
    expect(getByTestId('tab-mixer')).toBeTruthy();
  });

  it('shows tab bar when in mixer view', () => {
    const song = createMockSong({ currentView: 'mixer' });
    const { getByTestId } = renderWithTheme(
      <SongView song={song} />
    );
    expect(getByTestId('tab-song')).toBeTruthy();
    expect(getByTestId('tab-mixer')).toBeTruthy();
  });

  it('calls onNavigate when a tab is pressed', () => {
    const onNavigate = jest.fn();
    const song = createMockSong({ currentView: 'song' });
    const callbacks: SongCallbacks = { onNavigate };

    const { getByTestId } = renderWithTheme(
      <SongView song={song} callbacks={callbacks} />
    );

    fireEvent.press(getByTestId('tab-mixer'));
    expect(onNavigate).toHaveBeenCalledWith('mixer');
  });
});

// ─── SongToolbar Tests ──────────────────────────────────────────────────────

describe('SongToolbar', () => {
  it('renders all transport controls', () => {
    const song = createMockSong();
    const { getByTestId } = renderWithTheme(
      <SongToolbar song={song} />
    );
    expect(getByTestId('transport-play-pause')).toBeTruthy();
    expect(getByTestId('transport-loop')).toBeTruthy();
    expect(getByTestId('transport-metronome')).toBeTruthy();
    expect(getByTestId('transport-settings')).toBeTruthy();
  });

  it('calls onPlay when play button pressed and not playing', () => {
    const onPlay = jest.fn();
    const song = createMockSong({ isPlaying: false });
    const callbacks: SongCallbacks = { onPlay };

    const { getByTestId } = renderWithTheme(
      <SongToolbar song={song} callbacks={callbacks} />
    );

    fireEvent.press(getByTestId('transport-play-pause'));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('calls onPause when play button pressed and currently playing', () => {
    const onPause = jest.fn();
    const song = createMockSong({ isPlaying: true });
    const callbacks: SongCallbacks = { onPause };

    const { getByTestId } = renderWithTheme(
      <SongToolbar song={song} callbacks={callbacks} />
    );

    fireEvent.press(getByTestId('transport-play-pause'));
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleLoop when loop button pressed', () => {
    const onToggleLoop = jest.fn();
    const song = createMockSong();
    const callbacks: SongCallbacks = { onToggleLoop };

    const { getByTestId } = renderWithTheme(
      <SongToolbar song={song} callbacks={callbacks} />
    );

    fireEvent.press(getByTestId('transport-loop'));
    expect(onToggleLoop).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleMetronome when metronome button pressed', () => {
    const onToggleMetronome = jest.fn();
    const song = createMockSong();
    const callbacks: SongCallbacks = { onToggleMetronome };

    const { getByTestId } = renderWithTheme(
      <SongToolbar song={song} callbacks={callbacks} />
    );

    fireEvent.press(getByTestId('transport-metronome'));
    expect(onToggleMetronome).toHaveBeenCalledTimes(1);
  });

  it('calls onNavigate("settings") when settings button pressed', () => {
    const onNavigate = jest.fn();
    const song = createMockSong();
    const callbacks: SongCallbacks = { onNavigate };

    const { getByTestId } = renderWithTheme(
      <SongToolbar song={song} callbacks={callbacks} />
    );

    fireEvent.press(getByTestId('transport-settings'));
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  it('has correct accessibility label for play state', () => {
    const song = createMockSong({ isPlaying: false });
    const { getByLabelText } = renderWithTheme(
      <SongToolbar song={song} />
    );
    expect(getByLabelText('Play')).toBeTruthy();
  });

  it('has correct accessibility label for pause state', () => {
    const song = createMockSong({ isPlaying: true });
    const { getByLabelText } = renderWithTheme(
      <SongToolbar song={song} />
    );
    expect(getByLabelText('Pause')).toBeTruthy();
  });

  it('has correct accessibility state for loop enabled', () => {
    const song = createMockSong({ isLoopEnabled: true });
    const { getByTestId } = renderWithTheme(
      <SongToolbar song={song} />
    );
    expect(getByTestId('transport-loop').props.accessibilityState).toEqual({ selected: true });
  });

  it('has correct accessibility state for loop disabled', () => {
    const song = createMockSong({ isLoopEnabled: false });
    const { getByTestId } = renderWithTheme(
      <SongToolbar song={song} />
    );
    expect(getByTestId('transport-loop').props.accessibilityState).toEqual({ selected: false });
  });

  it('has correct accessibility state for metronome enabled', () => {
    const song = createMockSong({ isMetronomeEnabled: true });
    const { getByTestId } = renderWithTheme(
      <SongToolbar song={song} />
    );
    expect(getByTestId('transport-metronome').props.accessibilityState).toEqual({ selected: true });
  });
});

// ─── SongMixerTabBar Tests ──────────────────────────────────────────────────

describe('SongMixerTabBar', () => {
  it('renders both tabs (Song and Mixer)', () => {
    const { getByTestId } = renderWithTheme(
      <SongMixerTabBar currentView="song" />
    );
    expect(getByTestId('tab-song')).toBeTruthy();
    expect(getByTestId('tab-mixer')).toBeTruthy();
  });

  it('does not render a settings tab', () => {
    const { queryByTestId } = renderWithTheme(
      <SongMixerTabBar currentView="song" />
    );
    expect(queryByTestId('tab-settings')).toBeNull();
  });

  it('highlights the song tab when currentView is "song"', () => {
    const { getByTestId } = renderWithTheme(
      <SongMixerTabBar currentView="song" />
    );
    const songTab = getByTestId('tab-song');
    expect(songTab.props.accessibilityState).toEqual({ selected: true });
  });

  it('highlights the mixer tab when currentView is "mixer"', () => {
    const { getByTestId } = renderWithTheme(
      <SongMixerTabBar currentView="mixer" />
    );
    const mixerTab = getByTestId('tab-mixer');
    expect(mixerTab.props.accessibilityState).toEqual({ selected: true });
  });

  it('falls back to song tab for object destinations', () => {
    const currentView: SongDestination = {
      kind: 'pianoRoll',
      config: { clipId: 1, trackId: 1, instrumentType: 'drum' },
    };
    const { getByTestId } = renderWithTheme(
      <SongMixerTabBar currentView={currentView} />
    );
    const songTab = getByTestId('tab-song');
    expect(songTab.props.accessibilityState).toEqual({ selected: true });
  });

  it('falls back to song tab for settings destination', () => {
    const { getByTestId } = renderWithTheme(
      <SongMixerTabBar currentView="settings" />
    );
    const songTab = getByTestId('tab-song');
    expect(songTab.props.accessibilityState).toEqual({ selected: true });
  });

  it('calls onTabPress with correct destination', () => {
    const onTabPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <SongMixerTabBar currentView="song" onTabPress={onTabPress} />
    );

    fireEvent.press(getByTestId('tab-mixer'));
    expect(onTabPress).toHaveBeenCalledWith('mixer');

    fireEvent.press(getByTestId('tab-song'));
    expect(onTabPress).toHaveBeenCalledWith('song');
  });

  it('has correct accessibility roles', () => {
    const { getByTestId } = renderWithTheme(
      <SongMixerTabBar currentView="song" />
    );
    const songTab = getByTestId('tab-song');
    expect(songTab.props.accessibilityRole).toBe('tab');
  });

  it('renders tab bar container', () => {
    const { getByTestId } = renderWithTheme(
      <SongMixerTabBar currentView="song" />
    );
    expect(getByTestId('song-mixer-tab-bar')).toBeTruthy();
  });
});
