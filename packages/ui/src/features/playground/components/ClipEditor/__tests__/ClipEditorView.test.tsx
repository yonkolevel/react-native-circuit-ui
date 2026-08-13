import React from 'react';
import { AccessibilityInfo, Alert, ScrollView } from 'react-native';
import { act, render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { SkiaPianoRollGrid } from '../../../../../components/PianoRoll';
import { NotePrecisionPanel } from '../../../../../components/NotePrecisionPanel';
import {
  ClipEditorView,
  ClipLengthBar,
  rangeForBarDrag,
} from '../ClipEditorView';
const mockPanelScrollToX = jest.fn();
jest.mock('../../../../../components/NotePrecisionPanel', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  const NotePrecisionPanel = ReactModule.forwardRef(
    (props: object, ref: unknown) => {
      ReactModule.useImperativeHandle(ref, () => ({
        scrollToX: mockPanelScrollToX,
      }));
      return ReactModule.createElement(View, {
        ...props,
        testID: 'mock-note-precision-panel',
      });
    }
  );
  return { NotePrecisionPanel };
});

import {
  createMockDrumClip,
  createMockMelodyClip,
  createDrumSamples,
  resetMockIds,
} from '../../../mocks';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

beforeEach(() => {
  resetMockIds();
  mockPanelScrollToX.mockClear();
});

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

describe('Drum sampler action', () => {
  it('labels every interactive clip setting', () => {
    const clip = createMockDrumClip({ id: 5, trackID: 1, sectionID: 1 });
    const { getAllByLabelText, getByLabelText, getByRole } = renderWithTheme(
      <ClipEditorView
        clip={clip}
        instrumentType="drum"
        samples={createDrumSamples()}
        onSampleKit={jest.fn()}
      />
    );

    fireEvent.press(getByLabelText('Settings'));

    expect(getByRole('switch', { name: 'Metronome' })).toBeTruthy();
    expect(
      getAllByLabelText('Tempo').some(
        (element) => element.props.accessibilityRole === 'adjustable'
      )
    ).toBe(true);
    expect(getByRole('switch', { name: 'Show labels on notes' })).toBeTruthy();
    expect(
      getByRole('switch', { name: 'Snap note edits to grid' })
    ).toBeTruthy();
    expect(getByRole('switch', { name: 'Lock drum note length' })).toBeTruthy();
    expect(getByRole('button', { name: 'Done' })).toBeTruthy();
  });

  it('launches sampling from drum clip settings', () => {
    const onSampleKit = jest.fn();
    const clip = createMockDrumClip({ id: 5, trackID: 1, sectionID: 1 });
    const { getByLabelText } = renderWithTheme(
      <ClipEditorView
        clip={clip}
        instrumentType="drum"
        samples={createDrumSamples()}
        onSampleKit={onSampleKit}
      />
    );

    fireEvent.press(getByLabelText('Settings'));
    fireEvent.press(getByLabelText('Sample a kit'));

    expect(onSampleKit).toHaveBeenCalledTimes(1);
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

  it('opens the precision panel at the current interior grid offset', () => {
    const clip = createMockDrumClip({ id: 5, trackID: 1, sectionID: 1 });
    const view = renderWithTheme(
      <ClipEditorView
        clip={clip}
        instrumentType="drum"
        samples={createDrumSamples()}
      />
    );
    const grid = view.UNSAFE_getByType(SkiaPianoRollGrid);

    act(() => grid.props.onScrollXChange(120));
    expect(mockPanelScrollToX).not.toHaveBeenCalled();
    act(() => grid.props.onPitchLabelTap(0));

    expect(mockPanelScrollToX).toHaveBeenLastCalledWith(120, false);
  });

  it('mirrors a grid scroll back to zero after the panel acknowledges the prior offset', () => {
    const clip = createMockDrumClip({ id: 5, trackID: 1, sectionID: 1 });
    const view = renderWithTheme(
      <ClipEditorView
        clip={clip}
        instrumentType="drum"
        samples={createDrumSamples()}
      />
    );

    act(() =>
      view.UNSAFE_getByType(SkiaPianoRollGrid).props.onPitchLabelTap(0)
    );
    const grid = view.UNSAFE_getByType(SkiaPianoRollGrid);
    const panel = view.UNSAFE_getByType(NotePrecisionPanel);

    act(() => grid.props.onScrollXChange(120));
    expect(mockPanelScrollToX).toHaveBeenLastCalledWith(120, false);
    act(() => panel.props.onScrollXChange(120));
    act(() => grid.props.onScrollXChange(0));

    expect(mockPanelScrollToX).toHaveBeenLastCalledWith(0, false);
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

  it('invalidates contour Undo when a newer clip edit keeps the notes unchanged', () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
    const onUndo = jest.fn();
    const initialClip = createMockDrumClip({ id: 9, trackID: 1, sectionID: 1 });
    let latestNotes = initialClip.notes;
    let replaceClip!: React.Dispatch<React.SetStateAction<typeof initialClip>>;
    let replaceUndoSnapshot!: React.Dispatch<
      React.SetStateAction<typeof initialClip.notes | null>
    >;
    function Harness() {
      const [clip, setClip] = React.useState(initialClip);
      const [undoSnapshotNotes, setUndoSnapshotNotes] = React.useState<
        typeof initialClip.notes | null
      >(null);
      latestNotes = clip.notes;
      replaceClip = setClip;
      replaceUndoSnapshot = setUndoSnapshotNotes;
      return (
        <ClipEditorView
          clip={clip}
          instrumentType="drum"
          samples={createDrumSamples()}
          undoSnapshotNotes={undoSnapshotNotes}
          callbacks={{
            onVelocityContourApply: (
              _contour,
              _mode,
              indexes,
              expectedNotes
            ) => {
              setUndoSnapshotNotes(expectedNotes.map((note) => ({ ...note })));
              setClip((current) => ({
                ...current,
                notes: current.notes.map((note, index) =>
                  indexes.includes(index)
                    ? { ...note, velocity: index === indexes[0] ? 40 : 100 }
                    : note
                ),
              }));
              return true;
            },
            onUndo,
          }}
        />
      );
    }
    const view = renderWithTheme(<Harness />);

    act(() =>
      view.UNSAFE_getByType(SkiaPianoRollGrid).props.onPitchLabelTap(0)
    );
    act(() => {
      const panel = view.UNSAFE_getByType(NotePrecisionPanel);
      expect(
        panel.props.onVelocityContourApply(
          {
            startBeat: 0,
            endBeat: 2,
            variant: { type: 'curve', from: 40, to: 100, bend: 0 },
          },
          'absolute',
          [0, 1],
          initialClip.notes
        )
      ).toBe(true);
    });
    expect(view.getByText('2 notes · 40→100')).toBeTruthy();
    expect(announce).toHaveBeenCalledWith('2 notes · 40→100');

    act(() => {
      replaceUndoSnapshot(latestNotes);
      replaceClip((current) => ({
        ...current,
        activeBarStart: current.activeBarStart + 1,
      }));
    });

    expect(view.queryByLabelText('Undo velocity contour')).toBeNull();
    expect(onUndo).not.toHaveBeenCalled();
    announce.mockRestore();
  });

  it('does not show a contour summary when apply rejects', () => {
    const clip = createMockDrumClip({ id: 10, trackID: 1, sectionID: 1 });
    const view = renderWithTheme(
      <ClipEditorView
        clip={clip}
        instrumentType="drum"
        samples={createDrumSamples()}
        callbacks={{ onVelocityContourApply: () => false }}
      />
    );

    act(() =>
      view.UNSAFE_getByType(SkiaPianoRollGrid).props.onPitchLabelTap(0)
    );
    act(() => {
      view.UNSAFE_getByType(NotePrecisionPanel).props.onVelocityContourApply(
        {
          startBeat: 0,
          endBeat: 2,
          variant: { type: 'curve', from: 40, to: 100, bend: 0 },
        },
        'absolute',
        [0, 1],
        clip.notes
      );
    });

    expect(view.queryByLabelText('Undo velocity contour')).toBeNull();
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
