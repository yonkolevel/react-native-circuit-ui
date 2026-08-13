import { act, fireEvent, render } from '@testing-library/react-native';
import { Skia } from '@shopify/react-native-skia';
import { useSharedValue } from 'react-native-reanimated';
import { VelocityContourLane } from '../VelocityContourLane';
import {
  yForVelocity,
  type VelocityContourPreview,
} from '../velocityContourAuthoring';
import type { ClipNote } from '../../../features/playground/types';

const notes: ClipNote[] = [
  { noteNumber: 36, position: 0, duration: 0.25, velocity: 80 },
  { noteNumber: 38, position: 0.5, duration: 0.25, velocity: 90 },
  { noteNumber: 36, position: 1, duration: 0.25, velocity: 100 },
];
const selectedIndexes = [0, 2] as const;

type Touch = { id: number; x: number; y: number };
type StateManager = {
  activate: jest.Mock;
  fail: jest.Mock;
  end: jest.Mock;
};
type GestureCallbacks = {
  onTouchesDown: (
    event: { changedTouches: Touch[] },
    stateManager: StateManager
  ) => void;
  onTouchesMove: (
    event: { allTouches: Touch[] },
    stateManager: StateManager
  ) => void;
  onUpdate: (event: { translationX: number; translationY: number }) => void;
  onTouchesUp: (
    event: { changedTouches: Touch[]; allTouches: Touch[] },
    stateManager: StateManager
  ) => void;
  onEnd: () => void;
  onFinalize: () => void;
};

let latestPreview: { value: VelocityContourPreview | null } | undefined;

function Harness({
  onApply,
  sourceNotes = notes,
  indexes = selectedIndexes,
  viewportWidth = 320,
}: {
  onApply: jest.Mock;
  sourceNotes?: readonly ClipNote[];
  indexes?: readonly number[];
  viewportWidth?: number;
}) {
  const preview = useSharedValue<VelocityContourPreview | null>(null);
  latestPreview = preview;
  const scrollOffsetX = useSharedValue(0);
  return (
    <VelocityContourLane
      notes={sourceNotes}
      noteIndexes={indexes}
      beatWidth={100}
      totalBeats={4}
      areaHeight={120}
      trackColor="#ff5c24"
      preview={preview}
      scrollOffsetX={scrollOffsetX}
      viewportWidth={viewportWidth}
      onApply={onApply}
    />
  );
}

function gestureCallbacks(): GestureCallbacks {
  const gestureHandler = jest.requireMock('react-native-gesture-handler') as {
    __getLastGesture: () => { __callbacks: GestureCallbacks };
  };
  return gestureHandler.__getLastGesture().__callbacks;
}

function stateManager(): StateManager {
  return { activate: jest.fn(), fail: jest.fn(), end: jest.fn() };
}

function touch(id: number, x: number, y: number): Touch {
  return { id, x, y };
}

function beginCurve(
  callbacks: GestureCallbacks,
  manager: StateManager,
  id = 1
): Touch {
  const primary = touch(id, 220, 90);
  act(() => callbacks.onTouchesDown({ changedTouches: [primary] }, manager));
  act(() => jest.advanceTimersByTime(120));
  return primary;
}

describe('VelocityContourLane', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    latestPreview = undefined;
  });

  it('renders with the package minimum Skia path API', () => {
    const pathBuilder = (Skia as any).PathBuilder;
    const pathMake = jest.spyOn((Skia as any).Path, 'Make');
    (Skia as any).PathBuilder = undefined;
    try {
      expect(() => render(<Harness onApply={jest.fn()} />)).not.toThrow();
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
      render(<Harness onApply={jest.fn()} />);
      expect(builderMake).toHaveBeenCalled();
      expect(pathMake).not.toHaveBeenCalled();
    } finally {
      pathMake.mockRestore();
      builderMake.mockRestore();
    }
  });

  it('commits a preset once with global indexes and the full note snapshot', () => {
    const onApply = jest.fn();
    const view = render(<Harness onApply={onApply} />);

    fireEvent.press(view.getByText('ramp'));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(
      {
        startBeat: 0,
        endBeat: 1,
        variant: { type: 'curve', from: 64, to: 112, bend: 0 },
      },
      'absolute',
      [0, 2],
      notes
    );
  });

  it('routes handle hits immediately and preserves precision hysteresis', () => {
    const onApply = jest.fn();
    const view = render(<Harness onApply={onApply} />);
    const callbacks = gestureCallbacks();
    const manager = stateManager();
    const handle = touch(1, 14, yForVelocity(80, 120));

    act(() => callbacks.onTouchesDown({ changedTouches: [handle] }, manager));
    expect(manager.activate).toHaveBeenCalledTimes(1);
    act(() => jest.advanceTimersByTime(120));
    expect(manager.activate).toHaveBeenCalledTimes(1);

    act(() => callbacks.onUpdate({ translationX: 104, translationY: -8 }));
    expect(latestPreview?.value?.hudLabel).toBe('1:8');
    act(() => callbacks.onUpdate({ translationX: 97, translationY: -8 }));
    expect(latestPreview?.value?.hudLabel).toBe('1:8');
    act(() => callbacks.onUpdate({ translationX: 96, translationY: -8 }));
    expect(latestPreview?.value?.hudLabel).toBe('1:4');
    act(() => callbacks.onUpdate({ translationX: 36, translationY: -8 }));
    expect(latestPreview?.value?.hudLabel).toBe('1:1');

    act(() => callbacks.onEnd());
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0]?.[2]).toEqual([0]);

    const tapManager = stateManager();
    act(() =>
      callbacks.onTouchesDown({ changedTouches: [handle] }, tapManager)
    );
    act(() => callbacks.onEnd());
    expect(view.getByTestId('velocity-contour-nudge-plus-1')).toBeTruthy();
  });

  it('enforces the 120ms/6pt touch arbitration boundaries', () => {
    const onApply = jest.fn();
    render(<Harness onApply={onApply} />);
    const callbacks = gestureCallbacks();
    const manager = stateManager();
    const primary = touch(1, 220, 90);

    act(() => callbacks.onTouchesDown({ changedTouches: [primary] }, manager));
    act(() => jest.advanceTimersByTime(119));
    expect(manager.activate).not.toHaveBeenCalled();
    act(() =>
      callbacks.onTouchesMove({ allTouches: [touch(1, 226, 90)] }, manager)
    );
    act(() => jest.advanceTimersByTime(1));
    expect(manager.activate).toHaveBeenCalledTimes(1);
    act(() =>
      callbacks.onTouchesUp(
        { changedTouches: [primary], allTouches: [primary] },
        manager
      )
    );
    expect(onApply).toHaveBeenCalledTimes(1);

    const failedManager = stateManager();
    const failed = touch(2, 220, 90);
    act(() =>
      callbacks.onTouchesDown({ changedTouches: [failed] }, failedManager)
    );
    act(() =>
      callbacks.onTouchesMove(
        { allTouches: [touch(2, 226.01, 90)] },
        failedManager
      )
    );
    act(() => jest.advanceTimersByTime(120));
    expect(failedManager.fail).toHaveBeenCalledTimes(1);
    expect(failedManager.activate).not.toHaveBeenCalled();
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('preserves and renders every peak and valley in a one-finger touch stroke', () => {
    const paths: Array<{
      moveTo: jest.Mock;
      lineTo: jest.Mock;
      detach: jest.Mock;
    }> = [];
    const builderMake = jest
      .spyOn((Skia as any).PathBuilder, 'Make')
      .mockImplementation(() => {
        const path = {
          moveTo: jest.fn(),
          lineTo: jest.fn(),
          detach: jest.fn(),
        };
        path.detach.mockReturnValue(path);
        paths.push(path);
        return path;
      });
    try {
      const onApply = jest.fn();
      const view = render(<Harness onApply={onApply} />);
      const callbacks = gestureCallbacks();
      const manager = stateManager();
      const primary = touch(1, 20, 80);

      act(() =>
        callbacks.onTouchesDown({ changedTouches: [primary] }, manager)
      );
      act(() => jest.advanceTimersByTime(120));
      for (const point of [
        touch(1, 40, 20),
        touch(1, 60, 80),
        touch(1, 80, 20),
        touch(1, 100, 80),
      ]) {
        act(() => callbacks.onTouchesMove({ allTouches: [point] }, manager));
      }

      expect(latestPreview?.value?.contour.variant.type).toBe('polyline');
      view.rerender(<Harness onApply={onApply} viewportWidth={321} />);
      const path = paths[paths.length - 1]!;
      expect(path.moveTo.mock.calls.map(([x]) => x)).toEqual([20]);
      expect(path.lineTo.mock.calls.map(([x]) => x)).toEqual([40, 60, 80, 100]);

      act(() =>
        callbacks.onTouchesUp(
          {
            changedTouches: [touch(1, 100, 80)],
            allTouches: [touch(1, 100, 80)],
          },
          manager
        )
      );

      expect(onApply).toHaveBeenCalledTimes(1);
      const contour = onApply.mock.calls[0]?.[0];
      expect(contour.variant.type).toBe('polyline');
      expect(
        contour.variant.points.map(
          (point: { velocity: number }) => point.velocity
        )
      ).toEqual([0, 106, 0, 106, 0]);
    } finally {
      builderMake.mockRestore();
    }
  });

  it('switches an active freehand stroke to a second-finger curve', () => {
    const onApply = jest.fn();
    render(<Harness onApply={onApply} />);
    const callbacks = gestureCallbacks();
    const manager = stateManager();
    const primary = touch(1, 20, 80);

    act(() => callbacks.onTouchesDown({ changedTouches: [primary] }, manager));
    act(() => jest.advanceTimersByTime(120));
    act(() =>
      callbacks.onTouchesMove({ allTouches: [touch(1, 60, 20)] }, manager)
    );
    expect(latestPreview?.value?.contour.variant.type).toBe('polyline');

    const secondary = touch(2, 70, 50);
    act(() =>
      callbacks.onTouchesDown({ changedTouches: [secondary] }, manager)
    );
    expect(latestPreview?.value?.contour.variant.type).toBe('curve');
    act(() =>
      callbacks.onTouchesMove(
        { allTouches: [touch(1, 100, 80), secondary] },
        manager
      )
    );
    act(() =>
      callbacks.onTouchesUp(
        {
          changedTouches: [secondary],
          allTouches: [touch(1, 100, 80), secondary],
        },
        manager
      )
    );
    act(() =>
      callbacks.onTouchesUp(
        {
          changedTouches: [touch(1, 100, 80)],
          allTouches: [touch(1, 100, 80)],
        },
        manager
      )
    );

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0]?.[0].variant.type).toBe('curve');
  });

  it('commits once for secondary-first, primary-first, and simultaneous lifts', () => {
    const onApply = jest.fn();
    render(<Harness onApply={onApply} />);
    const callbacks = gestureCallbacks();
    const manager = stateManager();

    const first = beginCurve(callbacks, manager, 1);
    const secondary = touch(2, 240, 50);
    act(() =>
      callbacks.onTouchesDown({ changedTouches: [secondary] }, manager)
    );
    act(() =>
      callbacks.onTouchesUp(
        { changedTouches: [secondary], allTouches: [first, secondary] },
        manager
      )
    );
    expect(onApply).not.toHaveBeenCalled();
    act(() =>
      callbacks.onTouchesUp(
        { changedTouches: [first], allTouches: [first] },
        manager
      )
    );
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0]?.[0].variant.type).toBe('curve');

    const second = beginCurve(callbacks, manager, 3);
    const secondBend = touch(4, 240, 50);
    act(() =>
      callbacks.onTouchesDown({ changedTouches: [secondBend] }, manager)
    );
    act(() =>
      callbacks.onTouchesUp(
        { changedTouches: [second], allTouches: [second, secondBend] },
        manager
      )
    );
    act(() =>
      callbacks.onTouchesUp(
        { changedTouches: [secondBend], allTouches: [secondBend] },
        manager
      )
    );
    expect(onApply).toHaveBeenCalledTimes(2);

    const third = beginCurve(callbacks, manager, 5);
    const thirdBend = touch(6, 240, 50);
    act(() =>
      callbacks.onTouchesDown({ changedTouches: [thirdBend] }, manager)
    );
    act(() =>
      callbacks.onTouchesUp(
        {
          changedTouches: [third, thirdBend],
          allTouches: [third, thirdBend],
        },
        manager
      )
    );
    act(() => callbacks.onFinalize());
    expect(onApply).toHaveBeenCalledTimes(3);
    expect(manager.end).toHaveBeenCalledTimes(3);
  });

  it('cancels pending, drawing, handle, and changed-identity gestures', () => {
    const onApply = jest.fn();
    const view = render(<Harness onApply={onApply} />);
    let callbacks = gestureCallbacks();
    const manager = stateManager();

    act(() =>
      callbacks.onTouchesDown({ changedTouches: [touch(1, 220, 90)] }, manager)
    );
    act(() => callbacks.onFinalize());
    act(() => jest.advanceTimersByTime(120));

    const primary = beginCurve(callbacks, manager, 2);
    act(() => callbacks.onFinalize());
    act(() =>
      callbacks.onTouchesUp(
        { changedTouches: [primary], allTouches: [primary] },
        manager
      )
    );

    const handle = touch(3, 14, yForVelocity(80, 120));
    act(() => callbacks.onTouchesDown({ changedTouches: [handle] }, manager));
    act(() => callbacks.onUpdate({ translationX: 0, translationY: -8 }));
    act(() => callbacks.onFinalize());
    act(() => callbacks.onEnd());

    const identityTouch = touch(4, 220, 90);
    act(() =>
      callbacks.onTouchesDown({ changedTouches: [identityTouch] }, manager)
    );
    view.rerender(
      <Harness
        onApply={onApply}
        sourceNotes={[...notes, { ...notes[0]!, position: 2 }]}
      />
    );
    callbacks = gestureCallbacks();
    act(() => jest.advanceTimersByTime(120));
    act(() =>
      callbacks.onTouchesUp(
        { changedTouches: [identityTouch], allTouches: [identityTouch] },
        manager
      )
    );

    expect(onApply).not.toHaveBeenCalled();
  });

  it('commits the down-time note snapshot rather than later object mutation', () => {
    const source = notes.map((note) => ({ ...note }));
    const onApply = jest.fn();
    render(<Harness onApply={onApply} sourceNotes={source} />);
    const callbacks = gestureCallbacks();
    const manager = stateManager();
    const primary = beginCurve(callbacks, manager);

    source[0]!.velocity = 1;
    act(() =>
      callbacks.onTouchesUp(
        { changedTouches: [primary], allTouches: [primary] },
        manager
      )
    );

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0]?.[3][0].velocity).toBe(80);
  });

  it('exposes selected-row velocity nudge as an adjustable action', () => {
    const onApply = jest.fn();
    const view = render(<Harness onApply={onApply} />);

    fireEvent(
      view.getByTestId('velocity-contour-adjustable'),
      'accessibilityAction',
      { nativeEvent: { actionName: 'increment' } }
    );

    expect(onApply).toHaveBeenCalledWith(
      {
        startBeat: 0,
        endBeat: 1,
        variant: { type: 'curve', from: 65, to: 65, bend: 0 },
      },
      'additive',
      [0, 2],
      notes
    );
  });
});
