import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme';
import { SkiaPianoRollGrid } from '../SkiaPianoRollGrid.web';
import {
  createDrumSamples,
  createMockNote,
} from '../../../features/playground/mocks';

describe('web piano-roll guidance', () => {
  it('renders pointer-transparent drum row focus and target overlays', () => {
    const { getByTestId } = render(
      <ThemeProvider initialMode="dark">
        <SkiaPianoRollGrid
          notes={[]}
          samples={createDrumSamples()}
          instrumentType="drum"
          trackColor="#FF6C3A"
          lengthInBeats={4}
          guidance={{
            focusedNoteNumbers: [36],
            targets: [{ noteNumber: 38, position: 1 }],
          }}
        />
      </ThemeProvider>
    );

    expect(getByTestId('piano-roll-focus-midi-36').props).toMatchObject({
      pointerEvents: 'none',
      accessibilityLabel: 'Focused drum row Kick',
      accessibilityValue: { text: 'MIDI note 36' },
    });
    expect(getByTestId('piano-roll-target-0').props).toMatchObject({
      pointerEvents: 'none',
      accessibilityLabel: 'Target Snare at beat 1',
      accessibilityValue: { text: 'MIDI note 38' },
    });
  });

  it('exposes view/listen-only semantics and no keyboard mutation handlers when read only', () => {
    const onGridTap = jest.fn();
    const onNotePress = jest.fn();
    const onNoteMove = jest.fn();
    const onNoteResize = jest.fn();
    const samples = createDrumSamples();
    const view = render(
      <ThemeProvider initialMode="dark">
        <SkiaPianoRollGrid
          notes={[
            createMockNote({ noteNumber: samples[0]!.noteNumber, position: 0 }),
          ]}
          samples={samples}
          instrumentType="drum"
          trackColor="#FF6C3A"
          lengthInBeats={4}
          editable={false}
          guidance={{ focusedNoteNumbers: [samples[0]!.noteNumber] }}
          onGridTap={onGridTap}
          onNotePress={onNotePress}
          onNoteMove={onNoteMove}
          onNoteResize={onNoteResize}
        />
      </ThemeProvider>
    );

    const roll = view.getByLabelText('Piano roll, read only');
    const pitch = view.getByLabelText('View Kick notes');
    const note = view.getByLabelText(/View note C4 at beat 0/);
    const grid = view.getByLabelText(
      'Piano roll note grid, read only. View notes and guidance'
    );

    for (const element of [roll, pitch, note, grid]) {
      expect(element.props.accessibilityState).toEqual({ disabled: true });
    }
    expect(pitch.props.accessibilityHint).toBe('Listen during playback');
    expect(note.props.accessibilityHint).toBe('Listen during playback');
    expect(grid.props.accessibilityHint).toBe('Use Play to listen');
    expect(pitch.props.onPress).toBeUndefined();
    expect(note.props.onKeyDown).toBeUndefined();
    expect(grid.props.onKeyDown).toBeUndefined();

    fireEvent.press(pitch);
    fireEvent.press(note);
    fireEvent(grid, 'keyDown', { nativeEvent: { key: 'Enter' } });
    expect(onGridTap).not.toHaveBeenCalled();
    expect(onNotePress).not.toHaveBeenCalled();
    expect(onNoteMove).not.toHaveBeenCalled();
    expect(onNoteResize).not.toHaveBeenCalled();
    expect(view.getByTestId('piano-roll-focus-midi-36')).toBeTruthy();
  });
});
