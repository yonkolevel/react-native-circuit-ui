import React from 'react';
import { act, render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { PianoKeyboard } from '../PianoKeyboard';
import { resetMockIds } from '../../../mocks';
import { EditorPolicyProvider } from '../../../stores/editorPolicy';

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
  it('releases every active native key when the view unmounts', () => {
    const onNoteOff = jest.fn();
    const view = renderWithTheme(
      <PianoKeyboard numberOfOctaves={1} onNoteOff={onNoteOff} />
    );

    act(() => view.getByTestId('MultiTouchOverlay').props.onPadPress(7));
    view.unmount();

    expect(onNoteOff).toHaveBeenCalledWith(0);
  });

  it('releases every active native key at a contextual read-only transition', () => {
    const onNoteOn = jest.fn();
    const onNoteOff = jest.fn();
    const view = renderWithTheme(
      <EditorPolicyProvider>
        <PianoKeyboard
          numberOfOctaves={1}
          onNoteOn={onNoteOn}
          onNoteOff={onNoteOff}
        />
      </EditorPolicyProvider>
    );

    act(() => {
      view.getByTestId('MultiTouchOverlay').props.onPadPress(7);
      view.getByTestId('MultiTouchOverlay').props.onPadPress(8);
    });
    view.rerender(
      <ThemeProvider initialMode="dark">
        <EditorPolicyProvider policy={{ readOnly: true }}>
          <PianoKeyboard
            numberOfOctaves={1}
            onNoteOn={onNoteOn}
            onNoteOff={onNoteOff}
          />
        </EditorPolicyProvider>
      </ThemeProvider>
    );

    expect(onNoteOn.mock.calls).toEqual([[0], [2]]);
    expect(onNoteOff.mock.calls).toEqual([[0], [2]]);

    act(() => {
      view.getByTestId('MultiTouchOverlay').props.onPadRelease(7);
      view.getByTestId('MultiTouchOverlay').props.onPadRelease(8);
    });
    view.unmount();
    expect(onNoteOff).toHaveBeenCalledTimes(2);
  });

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
