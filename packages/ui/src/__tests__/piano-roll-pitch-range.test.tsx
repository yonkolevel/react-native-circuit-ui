import { View } from 'react-native';
import { RoundedRect } from '@shopify/react-native-skia';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme';
import { SkiaPianoRollGrid as NativeGrid } from '../components/PianoRoll/SkiaPianoRollGrid';
import { SkiaPianoRollGrid as WebGrid } from '../components/PianoRoll/SkiaPianoRollGrid.web';
import { getMelodicPitchRange } from '../components/PianoRoll/pianoRollPitchRange';
import { ClipEditorView } from '../features/playground/components/ClipEditor/ClipEditorView';
import { createMockMelodyClip } from '../features/playground/mocks';

// Original four-bar Major Scale fixture: MIDI values, not UI octave labels.
const notes = [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60].map(
  (noteNumber, index) => ({
    noteNumber,
    velocity: 100,
    position: index < 8 ? index : index + 1,
    duration: index === 7 ? 2 : 1,
  })
);
const range = getMelodicPitchRange(24, notes);

it('fits the actual ClipEditor caller, including an empty guided Practice', () => {
  const clip = createMockMelodyClip({
    id: 41,
    lengthInBars: 4,
    activeLengthInBars: 4,
    notes,
  });
  const view = render(
    <ThemeProvider initialMode="dark">
      <ClipEditorView
        clip={clip}
        instrumentType="melodic"
        melodicMinPitch={24}
      />
    </ThemeProvider>
  );
  expect(view.getByText('C6')).toBeTruthy();
  expect(view.getByText('C7')).toBeTruthy();
  expect(view.UNSAFE_getByType(NativeGrid).props.melodicMinPitch).toBe(60);
  view.rerender(
    <ThemeProvider initialMode="dark">
      <ClipEditorView
        clip={{ ...clip, notes: [] }}
        instrumentType="melodic"
        melodicMinPitch={24}
        guidance={{ focusedNoteNumbers: [60], targets: [] }}
      />
    </ThemeProvider>
  );
  expect(view.getByText('C6')).toBeTruthy();
  expect(view.getByText('C7')).toBeTruthy();
});

it('hit-tests fitted web rows using the authored MIDI values', () => {
  const onGridTap = jest.fn();
  const onNotePress = jest.fn();
  const view = render(
    <ThemeProvider initialMode="dark">
      <WebGrid
        notes={notes}
        instrumentType="melodic"
        melodicMinPitch={range.minPitch}
        melodicPitchCount={range.pitchCount}
        lengthInBeats={16}
        trackColor="#2496FF"
        isExpanded
        onGridTap={onGridTap}
        onNotePress={onNotePress}
      />
    </ThemeProvider>
  );
  fireEvent(view.UNSAFE_getByType(WebGrid).findAllByType(View)[0]!, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 900, height: 777 } },
  });
  const overlay = view
    .UNSAFE_getAllByType(View)
    .find((node) => typeof node.props.onPointerDown === 'function')!;
  const target = { getBoundingClientRect: () => ({ left: 0, top: 0 }) };
  const tap = (y: number) => {
    const event = {
      currentTarget: target,
      nativeEvent: {
        pointerId: 1,
        button: 0,
        clientX: 105,
        clientY: y,
      },
    };
    fireEvent(overlay, 'pointerDown', event);
    fireEvent(overlay, 'pointerUp', event);
  };
  const first = view.getByLabelText(/^Delete note C6 at beat 0,/).props.style;
  tap(first.top + first.height / 2);
  expect(onNotePress).toHaveBeenCalledWith(0);
  tap((22 + 0.5) * (777 / 24)); // C#6, MIDI61, directly above the low C.
  expect(onGridTap).toHaveBeenCalledWith(61, 0.5);
});

it.each([
  {
    name: 'shrinks',
    initialCount: 37,
    up: 36,
    min: 60,
    count: 24,
    pitch: 83,
    label: 'B7',
  },
  {
    name: 'shifts its lower bound',
    initialCount: 24,
    up: 12,
    min: 48,
    count: 25,
    pitch: 72,
    label: 'C7',
  },
])('keeps the web keyboard cursor honest when the range $name', (scenario) => {
  const onGridTap = jest.fn();
  const grid = (min: number, count: number) => (
    <ThemeProvider initialMode="dark">
      <WebGrid
        notes={[]}
        instrumentType="melodic"
        melodicMinPitch={min}
        melodicPitchCount={count}
        lengthInBeats={4}
        trackColor="#2496FF"
        onGridTap={onGridTap}
      />
    </ThemeProvider>
  );
  const view = render(grid(60, scenario.initialCount));
  const overlay = () => view.getByLabelText(/^Piano roll note grid,/);
  fireEvent(overlay(), 'focus');
  for (let i = 0; i < scenario.up; i++) {
    fireEvent(overlay(), 'keyDown', { nativeEvent: { key: 'ArrowUp' } });
  }
  view.rerender(grid(scenario.min, scenario.count));
  fireEvent(overlay(), 'keyDown', { nativeEvent: { key: 'Enter' } });
  expect(onGridTap).toHaveBeenLastCalledWith(scenario.pitch, 0);
  expect(overlay().props.accessibilityLabel).toContain(
    `${scenario.label} at beat 0`
  );
  const cursor = overlay()
    .findAllByType(View)
    .find((node) => node.props.style?.borderWidth === 2)!;
  expect(cursor.props.style.top).toBeGreaterThanOrEqual(0);
  expect(
    cursor.props.style.top + cursor.props.style.height
  ).toBeLessThanOrEqual(scenario.count * cursor.props.style.height);
});

for (const [platform, Grid] of [
  ['native', NativeGrid],
  ['web', WebGrid],
] as const) {
  describe(`${platform} explicit melodic view bounds`, () => {
    it('renders every scale pitch inside the fitted grid without changing notes', () => {
      const original = JSON.parse(JSON.stringify(notes));
      const view = render(
        <ThemeProvider initialMode="dark">
          <Grid
            notes={notes}
            instrumentType="melodic"
            melodicMinPitch={range.minPitch}
            melodicPitchCount={range.pitchCount}
            lengthInBeats={16}
            trackColor="#2496FF"
            isExpanded
            editable={false}
          />
        </ThemeProvider>
      );
      fireEvent(view.UNSAFE_getByType(Grid).findAllByType(View)[0]!, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 900, height: 777 } },
      });
      expect(view.getByText('C6')).toBeTruthy();
      expect(view.getByText('C7')).toBeTruthy();
      const rects =
        platform === 'web'
          ? view
              .getAllByLabelText(/^View note /)
              .map((node) => node.props.style)
          : view
              .UNSAFE_getAllByType(RoundedRect)
              .filter(
                (node) =>
                  node.props.style === 'stroke' &&
                  node.props.strokeWidth === 0.5
              )
              .map((node) => ({
                top: node.props.y,
                height: node.props.height,
              }));
      expect(rects).toHaveLength(15);
      for (const rect of rects) {
        expect(rect.top).toBeGreaterThanOrEqual(0);
        expect(rect.top + rect.height).toBeLessThanOrEqual(777);
      }
      expect(notes).toEqual(original);
    });

    it('supports wider material without silently retaining only 24 rows', () => {
      const view = render(
        <ThemeProvider initialMode="dark">
          <Grid
            notes={[]}
            instrumentType="melodic"
            melodicMinPitch={0}
            melodicPitchCount={128}
            lengthInBeats={4}
            trackColor="#2496FF"
          />
        </ThemeProvider>
      );
      expect(view.getByText('C1')).toBeTruthy();
      expect(view.getByText('G11')).toBeTruthy();
    });
  });
}
