import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { DrumPadsView } from '../DrumPadsView';
import { createDrumSamples, resetMockIds } from '../../../mocks';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

beforeEach(() => resetMockIds());

describe('DrumPadsView snapshots', () => {
  it('matches snapshot with default samples', () => {
    const samples = createDrumSamples();
    const tree = renderWithTheme(<DrumPadsView samples={samples} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot with custom highlight color', () => {
    const samples = createDrumSamples();
    const tree = renderWithTheme(
      <DrumPadsView samples={samples} highlightColor="#FF5C24" />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

describe('DrumPadsView interactions', () => {
  it('renders all 16 pad labels', () => {
    const samples = createDrumSamples();
    const { getByText } = renderWithTheme(<DrumPadsView samples={samples} />);
    // Verify the grid renders sample names (human readable)
    expect(getByText('Kick')).toBeTruthy();
    expect(getByText('Snare')).toBeTruthy();
    expect(getByText('Closed HH')).toBeTruthy();
  });

  it('exposes playable pads with balanced accessibility activation', () => {
    jest.useFakeTimers();
    const samples = createDrumSamples();
    const onPadPress = jest.fn();
    const onPadRelease = jest.fn();
    const { getByRole } = renderWithTheme(
      <DrumPadsView
        samples={samples}
        onPadPress={onPadPress}
        onPadRelease={onPadRelease}
      />
    );

    fireEvent(getByRole('button', { name: 'Kick' }), 'accessibilityAction', {
      nativeEvent: { actionName: 'activate' },
    });
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();

    expect(onPadPress).toHaveBeenCalledWith(0);
    expect(onPadRelease).toHaveBeenCalledWith(0);
    expect(getByRole('button', { name: 'Snare' })).toBeTruthy();
  });

  it('keeps low drum pads on the bottom row and maps touches to sample indices', () => {
    const samples = createDrumSamples();
    const onPadPress = jest.fn();
    const { getAllByRole, getByTestId } = renderWithTheme(
      <DrumPadsView samples={samples} onPadPress={onPadPress} />
    );

    expect(
      getAllByRole('button').map((pad) => pad.props.accessibilityLabel)
    ).toEqual(
      [
        ...samples.slice(12, 16),
        ...samples.slice(8, 12),
        ...samples.slice(4, 8),
        ...samples.slice(0, 4),
      ].map((sample) => sample.name)
    );

    act(() => getByTestId('MultiTouchOverlay').props.onPadPress(0));
    expect(onPadPress).toHaveBeenCalledWith(12);
  });

  it('ignores touches on empty visual cells', () => {
    const onPadPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <DrumPadsView
        samples={createDrumSamples().slice(0, 4)}
        onPadPress={onPadPress}
      />
    );
    const overlay = getByTestId('MultiTouchOverlay');

    act(() => overlay.props.onPadPress(0));
    expect(onPadPress).not.toHaveBeenCalled();

    act(() => overlay.props.onPadPress(12));
    expect(onPadPress).toHaveBeenCalledWith(0);
  });

  it('highlights pads by externally pressed MIDI note', () => {
    const samples = createDrumSamples();
    const { getByRole } = renderWithTheme(
      <DrumPadsView
        samples={samples}
        externalPressedNotes={new Set([36, 38])}
        highlightColor="#FF5C24"
      />
    );

    expect(getByRole('button', { name: 'Kick' }).props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#FF5C24' }),
      ])
    );
    expect(getByRole('button', { name: 'Snare' }).props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#FF5C24' }),
      ])
    );
    expect(getByRole('button', { name: 'Closed HH' }).props.style).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#FF5C24' }),
      ])
    );
  });
});
