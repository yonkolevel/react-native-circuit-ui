/**
 * SongView Snapshot + Behavioral Tests
 *
 * Snapshots lock in the component tree structure.
 * Behavioral tests verify callbacks and state transitions.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { SongView } from '../SongView';
import { SongToolbar } from '../SongToolbar';
import { SongMixerTabBar } from '../SongMixerTabBar';
import { createMockSong, resetMockIds } from '../../../mocks';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

beforeEach(() => resetMockIds());

// ─── Snapshot Tests ─────────────────────────────────────────────────────────

describe('SongView snapshots', () => {
  it('matches snapshot for song view', () => {
    const song = createMockSong({ currentView: 'song' });
    const tree = renderWithTheme(<SongView song={song} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot for mixer view', () => {
    const song = createMockSong({ currentView: 'mixer' });
    const tree = renderWithTheme(<SongView song={song} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot for settings view', () => {
    const song = createMockSong({ currentView: 'settings' });
    const tree = renderWithTheme(<SongView song={song} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

describe('SongToolbar snapshots', () => {
  it('matches snapshot when stopped', () => {
    const song = createMockSong({ isPlaying: false });
    const tree = renderWithTheme(<SongToolbar song={song} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot when playing', () => {
    const song = createMockSong({ isPlaying: true });
    const tree = renderWithTheme(<SongToolbar song={song} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

describe('SongMixerTabBar snapshots', () => {
  it('matches snapshot with song active', () => {
    const tree = renderWithTheme(<SongMixerTabBar currentView="song" />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot with mixer active', () => {
    const tree = renderWithTheme(<SongMixerTabBar currentView="mixer" />);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

// ─── Behavioral Tests ───────────────────────────────────────────────────────

describe('SongView behavior', () => {
  it('returns null for editor views', () => {
    const song = createMockSong({
      currentView: {
        kind: 'pianoRoll',
        config: { clipId: 1, trackId: 1, instrumentType: 'drum' },
      },
    });
    const { toJSON } = renderWithTheme(<SongView song={song} />);
    expect(toJSON()).toBeNull();
  });
});

describe('SongToolbar behavior', () => {
  it('calls onPlay when not playing', () => {
    const onPlay = jest.fn();
    const song = createMockSong({ isPlaying: false });
    const { getByTestId } = renderWithTheme(
      <SongToolbar song={song} callbacks={{ onPlay }} />
    );
    fireEvent.press(getByTestId('transport-play-pause'));
    expect(onPlay).toHaveBeenCalled();
  });

  it('calls onPause when playing', () => {
    const onPause = jest.fn();
    const song = createMockSong({ isPlaying: true });
    const { getByTestId } = renderWithTheme(
      <SongToolbar song={song} callbacks={{ onPause }} />
    );
    fireEvent.press(getByTestId('transport-play-pause'));
    expect(onPause).toHaveBeenCalled();
  });

  it('calls onToggleLoop', () => {
    const onToggleLoop = jest.fn();
    const song = createMockSong();
    const { getByTestId } = renderWithTheme(
      <SongToolbar song={song} callbacks={{ onToggleLoop }} />
    );
    fireEvent.press(getByTestId('transport-loop'));
    expect(onToggleLoop).toHaveBeenCalled();
  });

  it('calls onToggleMetronome', () => {
    const onToggleMetronome = jest.fn();
    const song = createMockSong();
    const { getByTestId } = renderWithTheme(
      <SongToolbar song={song} callbacks={{ onToggleMetronome }} />
    );
    fireEvent.press(getByTestId('transport-metronome'));
    expect(onToggleMetronome).toHaveBeenCalled();
  });
});

describe('SongMixerTabBar behavior', () => {
  it('renders both tabs', () => {
    const { getByTestId } = renderWithTheme(
      <SongMixerTabBar currentView="song" />
    );
    expect(getByTestId('tab-song')).toBeTruthy();
    expect(getByTestId('tab-mixer')).toBeTruthy();
  });

  it('calls onTabPress with mixer', () => {
    const onTabPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <SongMixerTabBar currentView="song" onTabPress={onTabPress} />
    );
    fireEvent.press(getByTestId('tab-mixer'));
    expect(onTabPress).toHaveBeenCalledWith('mixer');
  });
});
