import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ThemeProvider, palette } from '../../../../../theme';
import { ClipEditorView, ClipLengthBar } from '../ClipEditorView';
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

describe('ClipLengthBar', () => {
  it('renders the selected loop region orange and unselected bars disabled', () => {
    const { getByLabelText } = renderWithTheme(
      <ClipLengthBar
        lengthInBars={4}
        activeLengthInBars={4}
        loopRange={{ start: 2, end: 3 }}
      />
    );

    const bar1Style = StyleSheet.flatten(getByLabelText('Loop bar 1').props.style);
    const bar2Style = StyleSheet.flatten(getByLabelText('Bar 2, looping').props.style);
    const bar3Style = StyleSheet.flatten(getByLabelText('Bar 3, looping').props.style);
    const bar4Style = StyleSheet.flatten(getByLabelText('Loop bar 4').props.style);

    expect(bar1Style.backgroundColor).toBe(palette.mcBlack3);
    expect(bar2Style.backgroundColor).toBe(palette.mcOrange);
    expect(bar3Style.backgroundColor).toBe(palette.mcOrange);
    expect(bar4Style.backgroundColor).toBe(palette.mcBlack3);
  });

  it('shows leading and trailing loop handle affordances', () => {
    const { getByLabelText } = renderWithTheme(
      <ClipLengthBar
        lengthInBars={4}
        activeLengthInBars={4}
        loopRange={{ start: 2, end: 3 }}
      />
    );

    expect(getByLabelText('Loop region start handle')).toBeTruthy();
    expect(getByLabelText('Loop region end handle')).toBeTruthy();
  });
});

describe('ClipEditorView interactions', () => {
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
});
