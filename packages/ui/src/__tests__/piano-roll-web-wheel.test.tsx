import { Profiler, useState } from 'react';
import { View } from 'react-native';
import {
  act,
  cleanupAsync,
  fireEvent,
  render,
} from '@testing-library/react-native';
import { ThemeProvider } from '../theme';
import { SkiaPianoRollGrid } from '../components/PianoRoll/SkiaPianoRollGrid.web';

// RN's class-based View mock doesn't expose DOM refs. Keep the real grid and
// its native wheel listener, supplying only the browser-node boundary here.
jest.mock('react-native/Libraries/Components/View/View', () => {
  const React = require('react');
  return React.forwardRef((props: object, ref: unknown) =>
    React.createElement('View', { ...props, ref })
  );
});

type NodeMock = {
  props: any;
  style: Record<string, string>;
  computedTransform?: string;
  listeners: Map<string, (event: any) => void>;
  addEventListener: (name: string, listener: (event: any) => void) => void;
  removeEventListener: (name: string, listener: (event: any) => void) => void;
  getBoundingClientRect: () => { left: number; top: number };
};

function setup(initialZoom = 1, lengthInBeats = 4) {
  const nodes: NodeMock[] = [];
  const onZoomChange = jest.fn();
  const onGridTap = jest.fn();
  const onRender = jest.fn();
  const onScroll = jest.fn();
  const onVisibleRange = jest.fn();
  let setZoom!: (zoom: number) => void;
  let refreshCallbacks!: () => void;
  function Host() {
    const [zoom, updateZoom] = useState(initialZoom);
    const [revision, setRevision] = useState(0);
    setZoom = updateZoom;
    refreshCallbacks = () => setRevision((value) => value + 1);
    return (
      <Profiler id="wheel-zoom-host" onRender={onRender}>
        <ThemeProvider initialMode="dark">
          <SkiaPianoRollGrid
            notes={[]}
            instrumentType="melodic"
            trackColor="#1AFFA8"
            lengthInBeats={lengthInBeats}
            zoomLevel={zoom}
            onZoomChange={(value) => {
              onZoomChange(value);
              updateZoom(value);
            }}
            onGridTap={onGridTap}
            onScrollXChange={(x) => onScroll(x, revision)}
            onVisibleBeatRangeChange={(start, end) =>
              onVisibleRange(start, end, revision)
            }
          />
        </ThemeProvider>
      </Profiler>
    );
  }
  const view = render(<Host />, {
    createNodeMock: (element) => {
      const listeners = new Map<string, (event: any) => void>();
      const node: NodeMock = {
        props: element.props,
        style: {},
        listeners,
        addEventListener: (name, handler) => {
          listeners.set(name, handler);
        },
        removeEventListener: (name, handler) => {
          if (listeners.get(name) === handler) listeners.delete(name);
        },
        getBoundingClientRect: () => ({ left: 0, top: 0 }),
      };
      nodes.push(node);
      return node;
    },
  });
  const container = nodes.find((node) => node.listeners.has('wheel'))!;
  expect(container).toBeDefined();
  const content = nodes.find((node) => node.props.style?.width > 0)!;
  expect(content).toBeDefined();
  function wheel(deltaY: number, extra: Partial<WheelEvent> = {}) {
    const event = {
      deltaY,
      deltaX: 0,
      deltaMode: 0,
      ctrlKey: true,
      metaKey: false,
      preventDefault: jest.fn(),
      ...extra,
    };
    act(() => container.listeners.get('wheel')!(event));
    return event;
  }
  function advance(ms: number) {
    act(() => jest.advanceTimersByTime(ms));
  }
  return {
    view,
    container,
    content,
    wheel,
    advance,
    onZoomChange,
    onGridTap,
    onRender,
    onScroll,
    onVisibleRange,
    row: nodes.find((node) => node.props.style?.flexDirection === 'row')!,
    refreshCallbacks: () => act(() => refreshCallbacks()),
    setZoom: (zoom: number) => act(() => setZoom(zoom)),
  };
}

// First eight trusted pixel deltas from the owner's physical pinch (#121).
// Old behavior reached 300% in 72ms despite only -22.35px total movement.
const capturedPinch = [
  -1.488801121711731, -2.468665838241577, -4.101728439331055,
  -3.6187245845794678, -2.283900022506714, -2.4239957332611084,
  -3.350525379180908, -2.6129627227783203,
];

describe('web piano-roll wheel zoom', () => {
  const globals = [
    'document',
    'addEventListener',
    'removeEventListener',
    'getComputedStyle',
    'DOMMatrixReadOnly',
    'matchMedia',
  ] as const;
  const originals = globals.map(
    (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const
  );
  const windowListeners = new Map<string, () => void>();
  const documentListeners = new Map<string, () => void>();
  let reducedMotion = false;
  beforeEach(() => {
    jest.useFakeTimers();
    reducedMotion = false;
    windowListeners.clear();
    documentListeners.clear();
    Object.assign(globalThis, {
      document: {
        hidden: false,
        addEventListener: (name: string, handler: () => void) =>
          documentListeners.set(name, handler),
        removeEventListener: (name: string) => documentListeners.delete(name),
      },
      addEventListener: (name: string, handler: () => void) =>
        windowListeners.set(name, handler),
      removeEventListener: (name: string) => windowListeners.delete(name),
      matchMedia: () => ({ matches: reducedMotion }),
      getComputedStyle: (node: NodeMock) => ({
        transform: node.computedTransform ?? node.style.transform,
      }),
      DOMMatrixReadOnly: class {
        a: number;
        e: number;
        constructor(transform: string) {
          const matrix = transform
            .match(/^matrix\((.+)\)$/)?.[1]
            ?.split(',')
            .map(Number);
          this.a =
            matrix?.[0] ??
            Number(transform.match(/scaleX\(([^)]+)\)/)?.[1] ?? 1);
          this.e =
            matrix?.[4] ??
            Number(transform.match(/translateX\(([^p]+)px\)/)?.[1] ?? 0);
        }
      },
    });
  });
  afterEach(async () => {
    await cleanupAsync();
    jest.useRealTimers();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });

  it('scales the actual captured pinch proportionally and commits once after settling', () => {
    const s = setup();
    const initialCommits = s.onRender.mock.calls.length;
    for (const delta of capturedPinch) {
      s.wheel(delta);
      s.advance(8);
    }
    expect(s.onZoomChange).not.toHaveBeenCalled();
    expect(s.onRender).toHaveBeenCalledTimes(initialCommits);
    expect(s.content.style.transform).toContain('scaleX(');
    expect(s.content.style.transition).toContain('cubic-bezier');
    s.advance(200);
    expect(s.onZoomChange).toHaveBeenCalledTimes(1);
    expect(s.onRender).toHaveBeenCalledTimes(initialCommits + 1);
    const zoom = s.onZoomChange.mock.calls[0]![0];
    expect(zoom).toBeCloseTo(
      Math.exp(-capturedPinch.reduce((a, b) => a + b, 0) / 100)
    );
    expect(zoom).toBeGreaterThan(1);
    expect(zoom).toBeLessThan(1.3);
  });

  it('does not zoom for zero, non-finite, or horizontal-only modified input', () => {
    const s = setup(2);
    for (const delta of [0, Number.NaN, Number.POSITIVE_INFINITY])
      s.wheel(delta);
    s.wheel(0, { deltaX: 20 });
    s.advance(500);
    expect(s.onZoomChange).not.toHaveBeenCalled();
  });

  it('makes equivalent total pixel movement independent of event count', () => {
    const one = setup();
    one.wheel(-20);
    one.advance(200);
    const many = setup();
    for (let i = 0; i < 20; i++) {
      many.wheel(-1);
      many.advance(8);
    }
    many.advance(200);
    expect(many.onZoomChange).toHaveBeenCalledTimes(1);
    expect(many.onZoomChange.mock.calls[0]![0]).toBeCloseTo(
      one.onZoomChange.mock.calls[0]![0],
      10
    );
  });

  it('reverses and clamps at the existing 100–300% limits without queued overshoot', () => {
    const s = setup();
    s.wheel(-10000);
    s.advance(200);
    expect(s.onZoomChange).toHaveBeenLastCalledWith(3);
    s.wheel(1);
    s.advance(200);
    expect(s.onZoomChange.mock.calls.at(-1)![0]).toBeLessThan(3);
    s.wheel(10000);
    s.advance(200);
    expect(s.onZoomChange).toHaveBeenLastCalledWith(1);
  });

  it('keeps ordinary wheel panning separate from zoom', () => {
    const s = setup(2);
    s.wheel(20, { ctrlKey: false, deltaX: 60 });
    expect(s.content.style.transform).toContain('translateX(-60px)');
    s.advance(200);
    expect(s.onZoomChange).not.toHaveBeenCalled();
  });

  it('does not let a pending settle overwrite an explicit zoom control', () => {
    const s = setup();
    s.wheel(-20);
    s.setZoom(2.5);
    s.advance(500);
    expect(s.onZoomChange).not.toHaveBeenCalled();
    expect(s.view.getByText('250%')).toBeTruthy();
  });

  it('keeps an unfinished pinch through callback-only rerenders and notifies current callbacks', () => {
    const s = setup();
    s.wheel(-20);
    s.advance(20);
    s.refreshCallbacks();
    s.advance(200);
    expect(s.onZoomChange).toHaveBeenCalledTimes(1);
    expect(s.onZoomChange.mock.calls[0]![0]).toBeCloseTo(Math.exp(0.2));
    expect(s.onScroll.mock.calls.at(-1)![1]).toBe(1);
    expect(s.onVisibleRange.mock.calls.at(-1)![2]).toBe(1);
  });

  it('preserves pan inertia in both axes when a flick interrupts pinch, in the committed pixel scale', () => {
    const s = setup(1, 16);
    const container = s.view
      .UNSAFE_getAllByType(View)
      .find((v) => v.props.onLayout)!;
    fireEvent(container, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 750, height: 400 } },
    });
    s.wheel(-40);
    s.content.computedTransform = 'matrix(1.1, 0, 0, 1, 0, 0)';
    const overlay = s.view
      .UNSAFE_getAllByType(View)
      .find((v) => v.props.onPointerDown)!;
    const pointer = (x: number, y: number) => ({
      nativeEvent: { clientX: x, clientY: y, button: 0, pointerId: 1 },
      currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    });
    fireEvent(overlay, 'pointerDown', pointer(300, 200));
    s.advance(16);
    fireEvent(overlay, 'pointerMove', pointer(250, 150));
    fireEvent(overlay, 'pointerUp', pointer(250, 150));
    expect(s.onZoomChange).toHaveBeenLastCalledWith(1.1);
    const panX = () => -new DOMMatrixReadOnly(s.content.style.transform).e;
    const panY = () =>
      -Number(s.row.style.transform!.match(/translateY\(([^p]+)px\)/)![1]);
    const before = { x: panX(), y: panY() };
    s.advance(32);
    expect(panX()).toBeGreaterThan(before.x);
    expect(panY()).toBeGreaterThan(before.y);
    expect(panX() - before.x).toBeCloseTo(panY() - before.y, 6);
    expect(s.onGridTap).not.toHaveBeenCalled();
  });

  it('removes the listener and pending commit on unmount', () => {
    const s = setup();
    s.wheel(-20);
    s.view.unmount();
    s.advance(500);
    expect(s.onZoomChange).not.toHaveBeenCalled();
    expect(s.container.listeners.has('wheel')).toBe(false);
  });

  it('normalizes line/page deltas and preserves Meta-modified zoom', () => {
    const pixels = setup(1.5);
    pixels.wheel(-16);
    pixels.advance(200);
    const lines = setup(1.5);
    lines.wheel(-1, { deltaMode: 1, ctrlKey: false, metaKey: true });
    lines.advance(200);
    expect(lines.onZoomChange.mock.calls[0]![0]).toBeCloseTo(
      pixels.onZoomChange.mock.calls[0]![0]
    );
    const pages = setup(1.5);
    const container = pages.view
      .UNSAFE_getAllByType(View)
      .find((v) => v.props.onLayout)!;
    fireEvent(container, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 750, height: 400 } },
    });
    pages.wheel(-0.04, { deltaMode: 2 });
    pages.advance(200);
    expect(pages.onZoomChange.mock.calls[0]![0]).toBeCloseTo(
      pixels.onZoomChange.mock.calls[0]![0]
    );
  });

  it('disables settling motion without making reduced-motion zoom event-frequency dependent', () => {
    reducedMotion = true;
    const s = setup();
    s.wheel(-20);
    expect(s.content.style.transition).toBe('none');
    expect(s.onZoomChange).not.toHaveBeenCalled();
    s.advance(200);
    expect(s.onZoomChange).toHaveBeenCalledTimes(1);
    expect(s.onZoomChange.mock.calls[0]![0]).toBeCloseTo(Math.exp(0.2));
  });

  it('preserves the leftmost beat and reclamps the far end when zooming out', () => {
    const s = setup(2, 16);
    s.wheel(0, { ctrlKey: false, deltaX: 1000 });
    s.wheel(-20);
    s.advance(200);
    const zoom = s.onZoomChange.mock.calls[0]![0];
    expect(s.content.style.transform).toBe(
      `translateX(${(-1000 * zoom) / 2}px)`
    );
    s.wheel(0, { ctrlKey: false, deltaX: 100000 });
    s.wheel(10000);
    s.advance(200);
    expect(s.onZoomChange).toHaveBeenLastCalledWith(1);
    expect(s.content.style.transform).toBe('translateX(-2070px)');
  });

  it('freezes the visible mid-settle scale for the first edit, then commits it on release', () => {
    const s = setup();
    s.wheel(-40);
    // Browser compositor is still between the committed and target zooms.
    s.content.computedTransform = 'matrix(1.1, 0, 0, 1, 0, 0)';
    const overlay = s.view
      .UNSAFE_getAllByType(View)
      .find((v) => v.props.onPointerDown)!;
    const x = (690 * 1.1 * 15.5) / 16;
    const event = {
      nativeEvent: { clientX: x, clientY: 100, button: 0, pointerId: 1 },
      currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    };
    fireEvent(overlay, 'pointerDown', event);
    s.advance(500);
    expect(s.onZoomChange).not.toHaveBeenCalled();
    expect(s.content.style.transition).toBe('none');
    fireEvent(overlay, 'pointerUp', event);
    expect(s.onGridTap).toHaveBeenCalledWith(69, 3.75);
    expect(s.onZoomChange).toHaveBeenCalledTimes(1);
    expect(s.onZoomChange).toHaveBeenCalledWith(1.1);
  });

  it.each(['blur', 'hidden'])(
    'cancels the pending settle on %s',
    (interruption) => {
      const s = setup();
      s.wheel(-20);
      act(() => {
        if (interruption === 'blur') windowListeners.get('blur')!();
        else {
          Object.assign(document, { hidden: true });
          documentListeners.get('visibilitychange')!();
        }
      });
      s.advance(500);
      expect(s.onZoomChange).not.toHaveBeenCalled();
      expect(s.content.style.transform).toBe('translateX(0px)');
    }
  );

  it('hit-tests the final sixteenth after zooming and panning to the finite end', () => {
    const s = setup();
    s.wheel(-40);
    s.advance(200);
    s.wheel(0, { ctrlKey: false, deltaX: 100000 });
    const overlay = s.view
      .UNSAFE_getAllByType(View)
      .find((v) => v.props.onPointerDown)!;
    const zoom = s.onZoomChange.mock.calls.at(-1)![0];
    // Native Jest window width is 750; pitch rail is 60. Local overlay
    // coordinates include the pan because its bounding rect is translated.
    const x = (690 * zoom * 15.5) / 16;
    const event = {
      nativeEvent: { clientX: x, clientY: 100, button: 0, pointerId: 1 },
      currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    };
    fireEvent(overlay, 'pointerDown', event);
    fireEvent(overlay, 'pointerUp', event);
    expect(s.onGridTap).toHaveBeenCalledWith(69, 3.75);
  });
});
