import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { PianoKeyboard } from '../PianoKeyboard';
import { resetMockIds } from '../../../mocks';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

beforeEach(() => resetMockIds());

describe('PianoKeyboard snapshots', () => {
  it('matches snapshot with 2 octaves', () => {
    const tree = renderWithTheme(<PianoKeyboard numberOfOctaves={2} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot with note names shown', () => {
    const tree = renderWithTheme(
      <PianoKeyboard numberOfOctaves={1} showNoteNames />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot with custom highlight color', () => {
    const tree = renderWithTheme(
      <PianoKeyboard
        numberOfOctaves={2}
        highlightColor="#FF5C24"
        showNoteNames
      />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

describe('PianoKeyboard interactions', () => {
  it('renders keys without crashing', () => {
    const onNoteOn = jest.fn();
    const tree = renderWithTheme(
      <PianoKeyboard numberOfOctaves={1} onNoteOn={onNoteOn} />
    );
    // Piano renders Pressable keys on non-iOS platforms (test env = undefined = non-iOS)
    // Just verify it renders without error
    expect(tree.toJSON()).toBeTruthy();
  });
});
