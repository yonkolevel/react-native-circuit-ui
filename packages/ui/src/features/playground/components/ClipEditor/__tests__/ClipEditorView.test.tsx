import React from 'react';
import { Alert, ScrollView } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { SkiaPianoRollGrid } from '../../../../../components/PianoRoll';
import {
  ClipEditorView,
  ClipLengthBar,
  rangeForBarDrag,
} from '../ClipEditorView';
import {
  createMockDrumClip,
  createMockMelodyClip,
  createDrumSamples,
  resetMockIds,
} from '../../../mocks';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

beforeEach(() => resetMockIds());

describe('ClipEditorView snapshots', () => {
  it('matches snapshot with drum clip', () => {
    const clip = createMockDrumClip({ id: 1, trackID: 1, sectionID: 1 });
    const tree = renderWithTheme(
      <ClipEditorView
        clip={clip}
        instrumentType="drum"
        samples={createDrumSamples()}
      />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot with melody clip', () => {
    const clip = createMockMelodyClip({ id: 2, trackID: 2, sectionID: 1 });
    const tree = renderWithTheme(
      <ClipEditorView clip={clip} instrumentType="melodic" />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot when playing', () => {
    const clip = createMockDrumClip({ id: 3, trackID: 1, sectionID: 1 });
    const tree = renderWithTheme(
      <ClipEditorView
        clip={clip}
        instrumentType="drum"
        isPlaying
        getBeatPosition={() => 2.5}
      />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot with recording enabled', () => {
    const clip = createMockDrumClip({ id: 4, trackID: 1, sectionID: 1 });
    const tree = renderWithTheme(
      <ClipEditorView clip={clip} instrumentType="drum" isRecording />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

describe('ClipLengthBar range selection', () => {
  it('focuses a tapped bar without changing the loop range', () => {
    const onSetActiveBarRange = jest.fn();
    const onNavigateToBar = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <ClipLengthBar
        lengthInBars={2}
        activeBarStart={0}
        activeLengthInBars={2}
        trackColor="#FF6C3A"
        notes={[]}
        onSetActiveBarRange={onSetActiveBarRange}
        onNavigateToBar={onNavigateToBar}
      />
    );

    fireEvent(getByLabelText('Bar 2'), 'accessibilityTap');

    expect(onSetActiveBarRange).not.toHaveBeenCalled();
    expect(onNavigateToBar).toHaveBeenCalledWith(1);
    expect(getByLabelText('Bar 1').props.style[1].backgroundColor).toBe(
      getByLabelText('Bar 2').props.style[1].backgroundColor
    );
    expect(getByLabelText('Bar 2').props.style[1].borderWidth).toBe(1);
  });

  it('does not expose long-press duplicate or delete actions', () => {
    const { getByLabelText, queryByLabelText } = renderWithTheme(
      <ClipLengthBar
        lengthInBars={2}
        activeBarStart={0}
        activeLengthInBars={2}
        trackColor="#FF6C3A"
        notes={[]}
      />
    );

    fireEvent(getByLabelText('Bar 2'), 'longPress');

    expect(queryByLabelText('Delete bar')).toBeNull();
    expect(queryByLabelText('Duplicate bar')).toBeNull();
    expect(getByLabelText('Remove bar')).toBeTruthy();
    expect(getByLabelText('Add bar')).toBeTruthy();
  });

  it('uses a native alert to choose how to add the second bar', () => {
    const onIncrease = jest.fn();
    const onDuplicateBar = jest.fn();
    let alertButtons: Array<{
      text?: string;
      onPress?: () => void;
    }> = [];
    const alertSpy = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons) => {
        alertButtons = (buttons ?? []) as typeof alertButtons;
      });

    const { getByLabelText } = renderWithTheme(
      <ClipLengthBar
        lengthInBars={1}
        activeBarStart={0}
        activeLengthInBars={1}
        trackColor="#FF6C3A"
        notes={[{ noteNumber: 36, velocity: 127, position: 0, duration: 0.25 }]}
        onIncrease={onIncrease}
        onDuplicateBar={onDuplicateBar}
      />
    );

    fireEvent.press(getByLabelText('Add bar'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Add Bar',
      'Would you like to duplicate the notes from the last bar?',
      expect.any(Array)
    );
    alertButtons.find((button) => button.text === 'Add Empty Bar')?.onPress?.();
    alertButtons
      .find((button) => button.text === 'Duplicate notes from the last bar')
      ?.onPress?.();
    expect(onIncrease).toHaveBeenCalledTimes(1);
    expect(onDuplicateBar).toHaveBeenCalledWith(0);

    alertSpy.mockRestore();
  });

  it('adds an empty bar directly when the clip has no notes', () => {
    const onIncrease = jest.fn();
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByLabelText } = renderWithTheme(
      <ClipLengthBar
        lengthInBars={1}
        activeBarStart={0}
        activeLengthInBars={1}
        trackColor="#FF6C3A"
        notes={[]}
        onIncrease={onIncrease}
      />
    );

    fireEvent.press(getByLabelText('Add bar'));

    expect(onIncrease).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('selects every bar between drag endpoints, in either direction', () => {
    expect(rangeForBarDrag(1, 3)).toEqual([1, 3]);
    expect(rangeForBarDrag(3, 1)).toEqual([1, 3]);
    expect(rangeForBarDrag(2, 2)).toEqual([2, 1]);
  });
});

describe('ClipEditorView interactions', () => {
  it('scrolls the piano roll when a bar is focused', () => {
    const clip = createMockDrumClip({ id: 5, trackID: 1, sectionID: 1 });
    const { getByLabelText, UNSAFE_getAllByType } = renderWithTheme(
      <ClipEditorView
        clip={clip}
        instrumentType="drum"
        samples={createDrumSamples()}
      />
    );
    const gridScrollView = UNSAFE_getAllByType(ScrollView).find(
      (view) => view.props.horizontal
    );

    expect(gridScrollView?.props.nestedScrollEnabled).toBe(true);
    fireEvent(getByLabelText('Bar 3'), 'accessibilityTap');

    expect(gridScrollView?.instance.scrollTo).toHaveBeenCalledWith({
      x: expect.any(Number),
      animated: true,
    });
    expect(
      gridScrollView?.instance.scrollTo.mock.calls[0][0].x
    ).toBeGreaterThan(0);
  });

  it('clamps the piano roll to the remaining bars when the clip shrinks', () => {
    const clip = createMockDrumClip({
      id: 6,
      trackID: 1,
      sectionID: 1,
      lengthInBars: 3,
      activeLengthInBars: 3,
    });
    const { getByLabelText, UNSAFE_getAllByType, rerender } = renderWithTheme(
      <ClipEditorView
        clip={clip}
        instrumentType="drum"
        samples={createDrumSamples()}
      />
    );
    const gridScrollView = UNSAFE_getAllByType(ScrollView).find(
      (view) => view.props.horizontal
    )!;

    fireEvent(getByLabelText('Bar 3'), 'accessibilityTap');
    const focusedX = gridScrollView.instance.scrollTo.mock.calls.at(-1)[0].x;

    rerender(
      <ThemeProvider initialMode="dark">
        <ClipEditorView
          clip={{ ...clip, lengthInBars: 2, activeLengthInBars: 2 }}
          instrumentType="drum"
          samples={createDrumSamples()}
        />
      </ThemeProvider>
    );

    const clampedX = gridScrollView.instance.scrollTo.mock.calls.at(-1)[0].x;
    expect(clampedX).toBeGreaterThan(0);
    expect(clampedX).toBeLessThan(focusedX);
  });

  it('calls onClose when back is pressed', () => {
    const onClose = jest.fn();
    const clip = createMockDrumClip({ id: 5, trackID: 1, sectionID: 1 });
    const { getByLabelText } = renderWithTheme(
      <ClipEditorView
        clip={clip}
        instrumentType="drum"
        callbacks={{ onClose }}
      />
    );
    fireEvent.press(getByLabelText('Back'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onUndo when undo is pressed', () => {
    const onUndo = jest.fn();
    const clip = createMockDrumClip({ id: 6, trackID: 1, sectionID: 1 });
    const { getByLabelText } = renderWithTheme(
      <ClipEditorView
        clip={clip}
        instrumentType="drum"
        canUndo
        callbacks={{ onUndo }}
      />
    );
    fireEvent.press(getByLabelText('Undo'));
    expect(onUndo).toHaveBeenCalled();
  });

  it('calls onRedo when redo is pressed', () => {
    const onRedo = jest.fn();
    const clip = createMockDrumClip({ id: 7, trackID: 1, sectionID: 1 });
    const { getByLabelText } = renderWithTheme(
      <ClipEditorView
        clip={clip}
        instrumentType="drum"
        canRedo
        callbacks={{ onRedo }}
      />
    );
    fireEvent.press(getByLabelText('Redo'));
    expect(onRedo).toHaveBeenCalled();
  });

  it('keeps the piano roll callback props stable across an unrelated re-render', () => {
    // Regression test: these were previously inline arrow functions
    // recreated on every ClipEditorView render, which silently defeated
    // SkiaPianoRollGrid's memo() (and, before its own gestures were
    // memoized, forced a gesture-recognizer rebuild) for state changes —
    // like a toolbar-only prop — that have nothing to do with the grid.
    const clip = createMockDrumClip({ id: 8, trackID: 1, sectionID: 1 });
    const { UNSAFE_getByType, rerender } = renderWithTheme(
      <ClipEditorView clip={clip} instrumentType="drum" canUndo={false} />
    );
    const grid = UNSAFE_getByType(SkiaPianoRollGrid);
    const firstProps = {
      onNotePress: grid.props.onNotePress,
      onNoteResize: grid.props.onNoteResize,
      onNoteMove: grid.props.onNoteMove,
      onGridTap: grid.props.onGridTap,
      onPitchLabelTap: grid.props.onPitchLabelTap,
      onToggleExpand: grid.props.onToggleExpand,
    };

    rerender(
      <ThemeProvider initialMode="dark">
        <ClipEditorView clip={clip} instrumentType="drum" canUndo />
      </ThemeProvider>
    );
    const rerenderedGrid = UNSAFE_getByType(SkiaPianoRollGrid);

    expect(rerenderedGrid.props.onNotePress).toBe(firstProps.onNotePress);
    expect(rerenderedGrid.props.onNoteResize).toBe(firstProps.onNoteResize);
    expect(rerenderedGrid.props.onNoteMove).toBe(firstProps.onNoteMove);
    expect(rerenderedGrid.props.onGridTap).toBe(firstProps.onGridTap);
    expect(rerenderedGrid.props.onPitchLabelTap).toBe(
      firstProps.onPitchLabelTap
    );
    expect(rerenderedGrid.props.onToggleExpand).toBe(firstProps.onToggleExpand);
  });
});
