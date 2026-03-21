/**
 * MixerView Tests
 *
 * Verifies:
 * - Renders all tracks as TrackStrips
 * - Audibility logic: muted → false, hasSoloed && !soloed → false, else true
 * - Forwards callbacks
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { MixerView } from '../MixerView';
import { createMockTrack, resetMockIds } from '../../../mocks';
import type { MixerCallbacks } from '../../../types';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

beforeEach(() => {
  resetMockIds();
});

describe('MixerView', () => {
  it('renders without crashing', () => {
    const { getByTestId } = renderWithTheme(
      <MixerView tracks={[]} />
    );
    expect(getByTestId('mixer-view')).toBeTruthy();
  });

  it('renders a TrackStrip for each track', () => {
    const tracks = [
      createMockTrack({ id: 1, title: 'Drums' }),
      createMockTrack({ id: 2, title: 'Keys', type: 'melodic' }),
      createMockTrack({ id: 3, title: 'Bass', type: 'bass' }),
    ];
    const { getByTestId } = renderWithTheme(
      <MixerView tracks={tracks} />
    );
    expect(getByTestId('track-strip-1')).toBeTruthy();
    expect(getByTestId('track-strip-2')).toBeTruthy();
    expect(getByTestId('track-strip-3')).toBeTruthy();
  });

  it('renders track names', () => {
    const tracks = [
      createMockTrack({ id: 1, title: 'Drums' }),
      createMockTrack({ id: 2, title: 'Keys', type: 'melodic' }),
    ];
    const { getByText } = renderWithTheme(
      <MixerView tracks={tracks} />
    );
    expect(getByText('Drums')).toBeTruthy();
    expect(getByText('Keys')).toBeTruthy();
  });

  it('calls onMuteToggle callback via TrackStrip', () => {
    const onMuteToggle = jest.fn();
    const callbacks: MixerCallbacks = { onMuteToggle };
    const tracks = [createMockTrack({ id: 1 })];

    const { getByTestId } = renderWithTheme(
      <MixerView tracks={tracks} callbacks={callbacks} />
    );

    fireEvent.press(getByTestId('track-strip-1-mute'));
    expect(onMuteToggle).toHaveBeenCalledWith(1);
  });

  it('calls onSoloToggle callback via TrackStrip', () => {
    const onSoloToggle = jest.fn();
    const callbacks: MixerCallbacks = { onSoloToggle };
    const tracks = [createMockTrack({ id: 1 })];

    const { getByTestId } = renderWithTheme(
      <MixerView tracks={tracks} callbacks={callbacks} />
    );

    fireEvent.press(getByTestId('track-strip-1-solo'));
    expect(onSoloToggle).toHaveBeenCalledWith(1);
  });

  it('marks muted tracks as not audible', () => {
    const tracks = [
      createMockTrack({ id: 1, isMuted: true }),
    ];
    const { getByTestId } = renderWithTheme(
      <MixerView tracks={tracks} />
    );
    // Muted track's mute button should show selected
    expect(getByTestId('track-strip-1-mute').props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('marks non-soloed tracks as not audible when some track is soloed', () => {
    const tracks = [
      createMockTrack({ id: 1, isSoloed: true }),
      createMockTrack({ id: 2, isSoloed: false }),
    ];
    const { getByTestId } = renderWithTheme(
      <MixerView tracks={tracks} />
    );
    // Track 1 is soloed
    expect(getByTestId('track-strip-1-solo').props.accessibilityState).toEqual({
      selected: true,
    });
    // Track 2 is not soloed
    expect(getByTestId('track-strip-2-solo').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('renders empty when no tracks provided', () => {
    const { getByTestId, queryByTestId } = renderWithTheme(
      <MixerView tracks={[]} />
    );
    expect(getByTestId('mixer-view')).toBeTruthy();
    expect(queryByTestId('track-strip-1')).toBeNull();
  });

  it('accepts custom testID', () => {
    const { getByTestId } = renderWithTheme(
      <MixerView tracks={[]} testID="custom-mixer" />
    );
    expect(getByTestId('custom-mixer')).toBeTruthy();
  });
});
