import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { MixerView } from '../MixerView';
import { createMockTrack, resetMockIds } from '../../../mocks';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

beforeEach(() => resetMockIds());

describe('MixerView snapshots', () => {
  it('matches snapshot with 3 tracks', () => {
    const tracks = [
      createMockTrack({ id: 1, type: 'drum', title: 'Drums' }),
      createMockTrack({ id: 2, type: 'melodic', title: 'Keys' }),
      createMockTrack({ id: 3, type: 'bass', title: 'Bass' }),
    ];
    const tree = renderWithTheme(<MixerView tracks={tracks} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot with muted track', () => {
    const tracks = [createMockTrack({ id: 1, type: 'drum', isMuted: true })];
    const tree = renderWithTheme(<MixerView tracks={tracks} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot with soloed track', () => {
    const tracks = [
      createMockTrack({ id: 1, type: 'drum', isSoloed: true }),
      createMockTrack({ id: 2, type: 'melodic' }),
    ];
    const tree = renderWithTheme(<MixerView tracks={tracks} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
