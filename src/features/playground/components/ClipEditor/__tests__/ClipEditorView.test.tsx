import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { ClipEditorView } from '../ClipEditorView';
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
        playheadPosition={2.5}
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
        callbacks={{ onRedo }}
      />
    );
    fireEvent.press(getByLabelText('Redo'));
    expect(onRedo).toHaveBeenCalled();
  });
});
