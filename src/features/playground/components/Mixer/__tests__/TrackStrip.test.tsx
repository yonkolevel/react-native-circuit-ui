/**
 * TrackStrip Tests
 *
 * Verifies:
 * - Renders all sub-components (label, mute, solo, volume, pan)
 * - Forwards callbacks with trackId
 * - Displays track name and section labels
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { TrackStrip } from '../TrackStrip';
import { createMockTrack, resetMockIds } from '../../../mocks';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

beforeEach(() => {
  resetMockIds();
});

describe('TrackStrip', () => {
  it('renders without crashing', () => {
    const track = createMockTrack();
    const { getByTestId } = renderWithTheme(
      <TrackStrip track={track} isAudible={true} />
    );
    expect(getByTestId('track-strip')).toBeTruthy();
  });

  it('renders track label with name', () => {
    const track = createMockTrack({ title: 'Drums' });
    const { getByText } = renderWithTheme(
      <TrackStrip track={track} isAudible={true} />
    );
    expect(getByText('Drums')).toBeTruthy();
  });

  it('renders mute button', () => {
    const track = createMockTrack();
    const { getByTestId } = renderWithTheme(
      <TrackStrip track={track} isAudible={true} />
    );
    expect(getByTestId('track-strip-mute')).toBeTruthy();
  });

  it('renders solo button', () => {
    const track = createMockTrack();
    const { getByTestId } = renderWithTheme(
      <TrackStrip track={track} isAudible={true} />
    );
    expect(getByTestId('track-strip-solo')).toBeTruthy();
  });

  it('renders volume section with label', () => {
    const track = createMockTrack();
    const { getByText, getByTestId } = renderWithTheme(
      <TrackStrip track={track} isAudible={true} />
    );
    expect(getByText('Volume')).toBeTruthy();
    expect(getByTestId('track-strip-volume')).toBeTruthy();
  });

  it('renders pan section with label', () => {
    const track = createMockTrack();
    const { getByText, getByTestId } = renderWithTheme(
      <TrackStrip track={track} isAudible={true} />
    );
    expect(getByText('Pan')).toBeTruthy();
    expect(getByTestId('track-strip-pan')).toBeTruthy();
  });

  it('calls onMuteToggle with trackId when mute pressed', () => {
    const onMuteToggle = jest.fn();
    const track = createMockTrack({ id: 5 });
    const { getByTestId } = renderWithTheme(
      <TrackStrip track={track} isAudible={true} onMuteToggle={onMuteToggle} />
    );
    fireEvent.press(getByTestId('track-strip-mute'));
    expect(onMuteToggle).toHaveBeenCalledWith(5);
  });

  it('calls onSoloToggle with trackId when solo pressed', () => {
    const onSoloToggle = jest.fn();
    const track = createMockTrack({ id: 7 });
    const { getByTestId } = renderWithTheme(
      <TrackStrip track={track} isAudible={true} onSoloToggle={onSoloToggle} />
    );
    fireEvent.press(getByTestId('track-strip-solo'));
    expect(onSoloToggle).toHaveBeenCalledWith(7);
  });

  it('reflects muted state on MuteButton', () => {
    const track = createMockTrack({ isMuted: true });
    const { getByTestId } = renderWithTheme(
      <TrackStrip track={track} isAudible={false} />
    );
    expect(getByTestId('track-strip-mute').props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('reflects soloed state on SoloButton', () => {
    const track = createMockTrack({ isSoloed: true });
    const { getByTestId } = renderWithTheme(
      <TrackStrip track={track} isAudible={true} />
    );
    expect(getByTestId('track-strip-solo').props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('accepts custom testID', () => {
    const track = createMockTrack();
    const { getByTestId } = renderWithTheme(
      <TrackStrip track={track} isAudible={true} testID="custom-strip" />
    );
    expect(getByTestId('custom-strip')).toBeTruthy();
  });
});
