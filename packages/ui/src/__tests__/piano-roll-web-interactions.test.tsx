import { View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme';
import { SkiaPianoRollGrid } from '../components/PianoRoll/SkiaPianoRollGrid.web';

const note = {
  noteNumber: 60,
  velocity: 100,
  position: 1,
  duration: 1,
};

function renderGrid(callbacks: {
  onNotePress?: (index: number) => void;
  onNoteMove?: (index: number, position: number, noteNumber: number) => void;
  onNoteResize?: (index: number, duration: number) => void;
  onGridTap?: (noteNumber: number, position: number) => void;
}) {
  return render(
    <ThemeProvider initialMode="dark">
      <SkiaPianoRollGrid
        notes={[note]}
        instrumentType="melodic"
        trackColor="#1AFFA8"
        lengthInBeats={4}
        snapToGrid
        {...callbacks}
      />
    </ThemeProvider>
  );
}

const target = {
  setPointerCapture: jest.fn(),
  releasePointerCapture: jest.fn(),
  hasPointerCapture: () => true,
  getBoundingClientRect: () => ({ left: 0, top: 0 }),
};

const pointer = (
  x: number,
  y: number,
  pointerType = 'mouse',
  pointerId = 1
) => ({
  currentTarget: target,
  preventDefault: jest.fn(),
  nativeEvent: {
    pointerId,
    pointerType,
    button: 0,
    clientX: x,
    clientY: y,
  },
});

function pointerOverlay(view: ReturnType<typeof render>) {
  const overlay = view
    .UNSAFE_getAllByType(View)
    .find((node) => typeof node.props.onPointerDown === 'function');
  expect(overlay).toBeDefined();
  return overlay!;
}

describe('SkiaPianoRollGrid web pointer interactions', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.useRealTimers());

  it('moves a note instead of deleting it after a mouse drag', () => {
    // Move vs. resize is decided by drag direction, not touch position (see
    // resolveNoteDragType): a leftward/vertical-dominant drag is always a
    // move, regardless of where on the note it started.
    const onNoteMove = jest.fn();
    const onNotePress = jest.fn();
    const view = renderGrid({ onNoteMove, onNotePress });
    const overlay = pointerOverlay(view);

    fireEvent(overlay, 'pointerDown', pointer(190, 380));
    fireEvent(overlay, 'pointerMove', pointer(140, 346));
    fireEvent(overlay, 'pointerUp', pointer(140, 346));

    expect(onNoteMove).toHaveBeenCalledWith(0, 0.75, 61);
    expect(onNotePress).not.toHaveBeenCalled();
  });

  it('adds a note at the clicked empty grid position', () => {
    const onGridTap = jest.fn();
    const view = renderGrid({ onGridTap });
    const overlay = pointerOverlay(view);

    fireEvent(overlay, 'pointerDown', pointer(100, 100));
    fireEvent(overlay, 'pointerUp', pointer(100, 100));

    expect(onGridTap).toHaveBeenCalledWith(69, 0.5);
  });

  it('treats a drag starting on empty grid as panning, not a tap-to-add', () => {
    // The overlay has a static touch-action: pan-y, so the browser never
    // scrolls horizontally on its own — a drag over empty space has to be
    // recognized as "pan the view," not misfire onGridTap once released.
    const onGridTap = jest.fn();
    const view = renderGrid({ onGridTap });
    const overlay = pointerOverlay(view);

    fireEvent(overlay, 'pointerDown', pointer(100, 100, 'touch'));
    fireEvent(overlay, 'pointerMove', pointer(160, 100, 'touch'));
    fireEvent(overlay, 'pointerUp', pointer(160, 100, 'touch'));

    expect(onGridTap).not.toHaveBeenCalled();
  });

  it('still adds a note on a quick touch tap over empty grid (no pan)', () => {
    const onGridTap = jest.fn();
    const view = renderGrid({ onGridTap });
    const overlay = pointerOverlay(view);

    fireEvent(overlay, 'pointerDown', pointer(100, 100, 'touch'));
    fireEvent(overlay, 'pointerUp', pointer(100, 100, 'touch'));

    expect(onGridTap).toHaveBeenCalledWith(69, 0.5);
  });

  it('moves a note on touch drag immediately, with no hold required', () => {
    // A touch that starts on a note is unambiguous — it's manipulating the
    // note, not scrolling — so it must behave exactly like mouse: drag
    // starts as soon as the pointer clears the drag threshold, no hold-timer
    // delay. (A hold-timer here previously let the browser's native scroll
    // win the gesture race before our drag ever got a chance to start.)
    const onNoteMove = jest.fn();
    const onNotePress = jest.fn();
    const view = renderGrid({ onNoteMove, onNotePress });
    const overlay = pointerOverlay(view);

    fireEvent(overlay, 'pointerDown', pointer(190, 380, 'touch'));
    fireEvent(overlay, 'pointerMove', pointer(140, 346, 'touch'));
    fireEvent(overlay, 'pointerUp', pointer(140, 346, 'touch'));

    expect(onNoteMove).toHaveBeenCalledWith(0, 0.75, 61);
    expect(onNotePress).not.toHaveBeenCalled();
  });

  it('deletes a note on a quick touch tap with no movement', () => {
    const onNoteMove = jest.fn();
    const onNotePress = jest.fn();
    const view = renderGrid({ onNoteMove, onNotePress });
    const overlay = pointerOverlay(view);

    fireEvent(overlay, 'pointerDown', pointer(190, 380, 'touch'));
    fireEvent(overlay, 'pointerUp', pointer(190, 380, 'touch'));

    expect(onNotePress).toHaveBeenCalledWith(0);
    expect(onNoteMove).not.toHaveBeenCalled();
  });

  it('supports quick touch taps and a pointercancel does not leave a stale interaction', () => {
    jest.useFakeTimers();
    const onGridTap = jest.fn();
    const onNotePress = jest.fn();
    const view = renderGrid({ onGridTap, onNotePress });
    const overlay = pointerOverlay(view);

    fireEvent(overlay, 'pointerDown', pointer(190, 380, 'touch'));
    fireEvent(overlay, 'pointerUp', pointer(190, 380, 'touch'));
    expect(onNotePress).toHaveBeenCalledWith(0);

    fireEvent(overlay, 'pointerDown', pointer(100, 100, 'touch'));
    fireEvent(overlay, 'pointerUp', pointer(100, 100, 'touch'));
    expect(onGridTap).toHaveBeenCalledWith(69, 0.5);

    fireEvent(overlay, 'pointerDown', pointer(190, 380, 'touch'));
    fireEvent(overlay, 'pointerCancel', pointer(190, 380, 'touch'));
    jest.advanceTimersByTime(300);
    expect(onNotePress).toHaveBeenCalledTimes(1);
  });

  it('clears a held drag when the browser loses focus', () => {
    jest.useFakeTimers();
    let blur: (() => void) | undefined;
    Object.assign(window, {
      addEventListener: jest.fn((name: string, handler: () => void) => {
        if (name === 'blur') blur = handler;
      }),
      removeEventListener: jest.fn(),
    });
    (global as any).document = {
      hidden: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    const onNoteMove = jest.fn();
    const view = renderGrid({ onNoteMove });
    const overlay = pointerOverlay(view);

    fireEvent(overlay, 'pointerDown', pointer(190, 380, 'touch'));
    jest.advanceTimersByTime(250);
    fireEvent(overlay, 'pointerMove', pointer(240, 346, 'touch'));
    act(() => blur?.());
    fireEvent(overlay, 'pointerUp', pointer(240, 346, 'touch'));

    expect(onNoteMove).not.toHaveBeenCalled();
  });

  it('ignores stale termination from a second pointer', () => {
    jest.useFakeTimers();
    const onNoteMove = jest.fn();
    const view = renderGrid({ onNoteMove });
    const overlay = pointerOverlay(view);

    fireEvent(overlay, 'pointerDown', pointer(190, 380, 'touch', 1));
    fireEvent(overlay, 'pointerDown', pointer(100, 100, 'touch', 2));
    fireEvent(overlay, 'lostPointerCapture', pointer(100, 100, 'touch', 2));
    jest.advanceTimersByTime(250);
    fireEvent(overlay, 'pointerMove', pointer(140, 346, 'touch', 1));
    fireEvent(overlay, 'pointerUp', pointer(140, 346, 'touch', 1));

    expect(onNoteMove).toHaveBeenCalledWith(0, 0.75, 61);
  });

  it('exposes semantic add, move, pitch, and resize actions', () => {
    const onGridTap = jest.fn();
    const onNoteMove = jest.fn();
    const onNoteResize = jest.fn();
    const view = renderGrid({ onGridTap, onNoteMove, onNoteResize });

    const grid = view.getByRole('button', {
      name: /Piano roll note grid/,
    });
    fireEvent(grid, 'keyDown', { nativeEvent: { key: 'ArrowRight' } });
    fireEvent(grid, 'keyDown', { nativeEvent: { key: 'ArrowUp' } });
    fireEvent(grid, 'keyDown', { nativeEvent: { key: 'Enter' } });
    expect(onGridTap).toHaveBeenCalledWith(49, 0.25);

    const noteButton = view.getByLabelText(/Delete note/);
    fireEvent(noteButton, 'keyDown', {
      nativeEvent: { key: 'ArrowRight' },
    });
    fireEvent(noteButton, 'keyDown', {
      nativeEvent: { key: 'ArrowUp' },
    });
    fireEvent(noteButton, 'keyDown', {
      nativeEvent: { key: 'ArrowRight', shiftKey: true },
    });
    expect(onNoteMove).toHaveBeenNthCalledWith(1, 0, 1.25, 60);
    expect(onNoteMove).toHaveBeenNthCalledWith(2, 0, 1, 61);
    expect(onNoteResize).toHaveBeenCalledWith(0, 1.25);
  });

  it('resizes from the note edge and deletes on an undragged click', () => {
    const onNoteResize = jest.fn();
    const onNotePress = jest.fn();
    const view = renderGrid({ onNoteResize, onNotePress });
    const overlay = pointerOverlay(view);

    fireEvent(overlay, 'pointerDown', pointer(335, 380));
    fireEvent(overlay, 'pointerMove', pointer(380, 380));
    fireEvent(overlay, 'pointerUp', pointer(380, 380));
    expect(onNoteResize).toHaveBeenCalledWith(0, 1.25);

    fireEvent(overlay, 'pointerDown', pointer(190, 380));
    fireEvent(overlay, 'pointerUp', pointer(190, 380));
    expect(onNotePress).toHaveBeenCalledWith(0);
  });
});
