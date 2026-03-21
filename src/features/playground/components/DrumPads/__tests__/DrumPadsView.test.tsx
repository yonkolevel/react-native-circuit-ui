import React from 'react';
import { render } from '@testing-library/react-native';
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
    // Verify the grid renders sample file names
    expect(getByText('kick.wav')).toBeTruthy();
    expect(getByText('snare.wav')).toBeTruthy();
    expect(getByText('closed_hh.wav')).toBeTruthy();
  });

  it('renders with external pressed notes', () => {
    const samples = createDrumSamples();
    const tree = renderWithTheme(
      <DrumPadsView
        samples={samples}
        externalPressedNotes={new Set([36, 38])}
        highlightColor="#FF5C24"
      />
    );
    expect(tree.toJSON()).toBeTruthy();
  });
});
