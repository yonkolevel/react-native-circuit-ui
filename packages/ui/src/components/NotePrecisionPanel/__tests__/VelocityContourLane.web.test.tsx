import { fireEvent, render } from '@testing-library/react-native';
import { useSharedValue } from 'react-native-reanimated';
import { VelocityContourLane } from '../VelocityContourLane.web';
import type { VelocityContourPreview } from '../velocityContourAuthoring';

const notes = [
  { noteNumber: 36, position: 0, duration: 0.25, velocity: 80 },
  { noteNumber: 36, position: 1, duration: 0.25, velocity: 100 },
];

function Harness({
  onApply,
  laneNotes = notes,
  noteIndexes = [0, 1],
}: {
  onApply: jest.Mock;
  laneNotes?: typeof notes;
  noteIndexes?: readonly number[];
}) {
  const preview = useSharedValue<VelocityContourPreview | null>(null);
  const scrollOffsetX = useSharedValue(0);
  return (
    <VelocityContourLane
      notes={laneNotes}
      noteIndexes={noteIndexes}
      beatWidth={100}
      totalBeats={4}
      areaHeight={120}
      trackColor="#ff5c24"
      preview={preview}
      scrollOffsetX={scrollOffsetX}
      viewportWidth={320}
      onApply={onApply}
    />
  );
}

const target = {
  getBoundingClientRect: () => ({ left: 0, top: 0 }),
  setPointerCapture: jest.fn(),
  focus: jest.fn(),
};

function pointer(
  x: number,
  y: number,
  overrides: Record<string, unknown> = {}
) {
  return {
    nativeEvent: {
      button: 0,
      clientX: x,
      clientY: y,
      pointerId: 7,
      pointerType: 'mouse',
      shiftKey: false,
      altKey: false,
      metaKey: false,
      ctrlKey: false,
      ...overrides,
    },
    currentTarget: target,
    preventDefault: jest.fn(),
  };
}

describe('VelocityContourLane web pointer authoring', () => {
  beforeEach(() => jest.clearAllMocks());

  it('captures and commits one simplified freehand contour', () => {
    const onApply = jest.fn();
    const view = render(<Harness onApply={onApply} />);
    const lane = view.getByTestId('velocity-contour-lane');

    fireEvent(lane, 'pointerDown', pointer(40, 70));
    fireEvent(lane, 'pointerMove', pointer(65, 45));
    fireEvent(lane, 'pointerUp', pointer(90, 20));

    expect(target.setPointerCapture).toHaveBeenCalledWith(7);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0]?.[0].variant.type).toBe('polyline');
    expect(onApply.mock.calls[0]?.slice(1)).toEqual([
      'absolute',
      [0, 1],
      notes,
    ]);
  });

  it('latches Shift curve and Meta additive mode at pointer-down', () => {
    const onApply = jest.fn();
    const view = render(<Harness onApply={onApply} />);
    const lane = view.getByTestId('velocity-contour-lane');

    fireEvent(
      lane,
      'pointerDown',
      pointer(40, 70, { shiftKey: true, metaKey: true })
    );
    fireEvent(lane, 'pointerMove', pointer(65, 45));
    fireEvent(lane, 'pointerUp', pointer(90, 20));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0]?.[0].variant.type).toBe('curve');
    expect(onApply.mock.calls[0]?.[1]).toBe('additive');
  });

  it.each(['keyDown', 'pointerCancel', 'lostPointerCapture'])(
    'discards preview on %s',
    (termination) => {
      const onApply = jest.fn();
      const view = render(<Harness onApply={onApply} />);
      const lane = view.getByTestId('velocity-contour-lane');

      fireEvent(lane, 'pointerDown', pointer(40, 70));
      fireEvent(lane, 'pointerMove', pointer(65, 45));
      fireEvent(
        lane,
        termination,
        termination === 'keyDown'
          ? { nativeEvent: { key: 'Escape' }, preventDefault: jest.fn() }
          : pointer(65, 45)
      );
      fireEvent(lane, 'pointerUp', pointer(90, 20));

      expect(onApply).not.toHaveBeenCalled();
    }
  );

  it('cancels instead of committing against rerendered notes mid-gesture', () => {
    const onApply = jest.fn(() => true);
    const view = render(<Harness onApply={onApply} />);
    const lane = view.getByTestId('velocity-contour-lane');

    fireEvent(lane, 'pointerDown', pointer(40, 70));
    fireEvent(lane, 'pointerMove', pointer(65, 45));
    view.rerender(
      <Harness
        onApply={onApply}
        laneNotes={[
          { ...notes[0]!, velocity: 10 },
          { ...notes[1]!, velocity: 20 },
        ]}
        noteIndexes={[1]}
      />
    );
    fireEvent(
      view.getByTestId('velocity-contour-lane'),
      'pointerUp',
      pointer(90, 20)
    );

    expect(onApply).not.toHaveBeenCalled();
  });
});
