import React from 'react';
import { render } from '@testing-library/react-native';
import { Skia } from '@shopify/react-native-skia';
import { GestureDetector } from 'react-native-gesture-handler';
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
  const baseProps: SkiaPianoRollGridProps = {
    notes: [createMockNote({ noteNumber: 36, position: 0, duration: 0.25 })],
    samples: createDrumSamples(),
    instrumentType: 'drum',
    trackColor: '#FF6C3A',
    lengthInBeats: 16,
  };

  it('renders with the package minimum Skia path API', () => {
    const pathBuilder = (Skia as any).PathBuilder;
    const pathMake = jest.spyOn((Skia as any).Path, 'Make');
    (Skia as any).PathBuilder = undefined;
    try {
      expect(() =>
        renderWithTheme(<SkiaPianoRollGrid {...baseProps} />)
      ).not.toThrow();
      expect(pathMake).toHaveBeenCalled();
    } finally {
      (Skia as any).PathBuilder = pathBuilder;
      pathMake.mockRestore();
    }
  });

  it('prefers PathBuilder when the runtime provides it', () => {
    const pathMake = jest.spyOn((Skia as any).Path, 'Make');
    const builderMake = jest.spyOn((Skia as any).PathBuilder, 'Make');
    try {
      renderWithTheme(<SkiaPianoRollGrid {...baseProps} />);
      expect(builderMake).toHaveBeenCalled();
      expect(pathMake).not.toHaveBeenCalled();
    } finally {
      pathMake.mockRestore();
      builderMake.mockRestore();
    }
  });

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
