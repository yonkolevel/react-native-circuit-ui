import React from 'react';
import { render } from '@testing-library/react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Rect, RoundedRect } from '@shopify/react-native-skia';
import { ThemeProvider } from '../../../theme';
import { SkiaPianoRollGrid } from '../SkiaPianoRollGrid';
import type { SkiaPianoRollGridProps } from '../SkiaPianoRollGrid';
import {
  createMockNote,
  createDrumSamples,
} from '../../../features/playground/mocks';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

describe('SkiaPianoRollGrid gestures', () => {
  afterEach(() => jest.restoreAllMocks());

  const baseProps: SkiaPianoRollGridProps = {
    notes: [createMockNote({ noteNumber: 36, position: 0, duration: 0.25 })],
    samples: createDrumSamples(),
    instrumentType: 'drum',
    trackColor: '#FF6C3A',
    lengthInBeats: 16,
  };

  // Regression test for a real bug: the tap/pan/pinch gestures used to be
  // built directly in the render body instead of behind useMemo. RNGH v2's
  // builder API requires memoization — without it, a new gesture object is
  // created on every render and the GestureDetector tears down and
  // re-attaches its recognizers, which is what let the horizontal
  // ScrollView intermittently steal a note drag mid-gesture.
  it('keeps the same composed gesture across a re-render with no gesture-relevant prop change', () => {
    const { UNSAFE_getByType, rerender } = renderWithTheme(
      <SkiaPianoRollGrid {...baseProps} showNoteLabels={false} />
    );
    const firstGesture = UNSAFE_getByType(GestureDetector).props.gesture;

    rerender(
      <ThemeProvider initialMode="dark">
        <SkiaPianoRollGrid {...baseProps} showNoteLabels />
      </ThemeProvider>
    );
    const secondGesture = UNSAFE_getByType(GestureDetector).props.gesture;

    expect(secondGesture).toBe(firstGesture);
  });

  it('gives a single tap priority over the delayed drag recognizer', () => {
    const tapSpy = jest.spyOn(Gesture, 'Tap');
    const panSpy = jest.spyOn(Gesture, 'Pan');
    const exclusiveSpy = jest.spyOn(Gesture, 'Exclusive');

    renderWithTheme(
      <SkiaPianoRollGrid {...baseProps} editable onGridTap={jest.fn()} />
    );

    expect(exclusiveSpy).toHaveBeenCalledTimes(1);
    expect(exclusiveSpy.mock.calls[0]?.[0]).toBe(tapSpy.mock.results[0]?.value);
    expect(exclusiveSpy.mock.calls[0]?.[1]).toBe(panSpy.mock.results[0]?.value);
  });

  it('dims unfocused rows and draws targets as empty note slots', () => {
    const { UNSAFE_getAllByType, getByTestId } = renderWithTheme(
      <SkiaPianoRollGrid
        {...baseProps}
        guidance={{
          focusedNoteNumbers: [36],
          targets: [{ noteNumber: 38, position: 1 }],
          targetColor: '#654321',
        }}
      />
    );

    // Focus is subtractive: the rows the step is not about recede behind a
    // scrim, instead of a band being painted over the row it is about.
    const scrims = UNSAFE_getAllByType(Rect).filter(
      (node) => node.props.color === '#000000'
    );
    expect(scrims.length).toBeGreaterThan(0);
    expect(scrims.every((node) => node.props.opacity === 0.55)).toBe(true);

    // The slot is an empty version of the note: same colour, filled and stroked.
    const slots = UNSAFE_getAllByType(RoundedRect).filter(
      (node) => node.props.color === '#654321'
    );
    expect(slots.some((node) => node.props.style === 'stroke')).toBe(true);
    expect(slots.some((node) => node.props.style !== 'stroke')).toBe(true);

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

  it('animates fallback note bodies for consumers without velocity preview props', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(
      <SkiaPianoRollGrid {...baseProps} />
    );
    const noteBody = UNSAFE_getAllByType(RoundedRect).find(
      (node) => node.props.style === undefined && node.props.opacity != null
    );

    expect(noteBody?.props.opacity).toEqual({ value: 1 });
  });

  it('drops a target slot and its semantic overlay once the learner has filled that cell', () => {
    const { UNSAFE_getAllByType, queryByTestId } = renderWithTheme(
      <SkiaPianoRollGrid
        {...baseProps}
        notes={[{ noteNumber: 38, position: 1, duration: 0.25, velocity: 100 }]}
        guidance={{
          targets: [{ noteNumber: 38, position: 1 }],
          targetColor: '#654321',
        }}
      />
    );

    expect(
      UNSAFE_getAllByType(RoundedRect).some(
        (node) => node.props.color === '#654321'
      )
    ).toBe(false);
    expect(queryByTestId('piano-roll-target-0')).toBeNull();
  });

  it('rebuilds the gesture when zoom changes the underlying step/beat width', () => {
    const { UNSAFE_getByType, rerender } = renderWithTheme(
      <SkiaPianoRollGrid {...baseProps} zoomLevel={1} />
    );
    const firstGesture = UNSAFE_getByType(GestureDetector).props.gesture;

    rerender(
      <ThemeProvider initialMode="dark">
        <SkiaPianoRollGrid {...baseProps} zoomLevel={2} />
      </ThemeProvider>
    );
    const secondGesture = UNSAFE_getByType(GestureDetector).props.gesture;

    expect(secondGesture).not.toBe(firstGesture);
  });
});
