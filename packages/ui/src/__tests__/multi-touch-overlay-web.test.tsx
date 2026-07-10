import { act, fireEvent, render } from '@testing-library/react-native';
import {
  MultiTouchOverlay,
  shouldDragPointer,
} from '../components/MultiTouchOverlay/MultiTouchOverlay.web';

describe('shouldDragPointer', () => {
  it('keeps mouse input click-only on web', () => {
    expect(shouldDragPointer({ pointerType: 'mouse' })).toBe(false);
  });

  it('preserves drag-to-play for touch and pen input', () => {
    expect(shouldDragPointer({ pointerType: 'touch' })).toBe(true);
    expect(shouldDragPointer({ pointerType: 'pen' })).toBe(true);
  });
});

describe('MultiTouchOverlay pointer lifecycle', () => {
  const pointer = (currentTarget: object, pointerId = 7) => ({
    currentTarget,
    nativeEvent: {
      pointerId,
      pointerType: 'mouse',
      clientX: 10,
      clientY: 10,
    },
  });

  it('captures the pointer on the overlay element and releases on capture loss', () => {
    const onPadPress = jest.fn();
    const onPadRelease = jest.fn();
    const target = {
      setPointerCapture: jest.fn(),
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
    };
    const { getByTestId } = render(
      <MultiTouchOverlay
        rows={1}
        columns={1}
        onPadPress={onPadPress}
        onPadRelease={onPadRelease}
        testID="overlay"
      />
    );
    const overlay = getByTestId('overlay');
    fireEvent(overlay, 'layout', {
      nativeEvent: { layout: { width: 100, height: 100 } },
    });

    fireEvent(overlay, 'pointerDown', pointer(target));
    expect(target.setPointerCapture).toHaveBeenCalledWith(7);
    expect(onPadPress).toHaveBeenCalledWith(0);

    fireEvent(overlay, 'lostPointerCapture', pointer(target));
    expect(onPadRelease).toHaveBeenCalledWith(0);
  });

  it('releases a mouse pad when the pointer leaves the overlay', () => {
    const onPadRelease = jest.fn();
    const target = {
      setPointerCapture: jest.fn(),
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
      }),
    };
    const { getByTestId } = render(
      <MultiTouchOverlay
        rows={1}
        columns={1}
        onPadRelease={onPadRelease}
        testID="overlay"
      />
    );
    const overlay = getByTestId('overlay');
    fireEvent(overlay, 'layout', {
      nativeEvent: { layout: { width: 100, height: 100 } },
    });
    fireEvent(overlay, 'pointerDown', pointer(target));
    fireEvent(overlay, 'pointerLeave', {
      ...pointer(target),
      nativeEvent: { ...pointer(target).nativeEvent, clientY: -1 },
    });

    expect(onPadRelease).toHaveBeenCalledWith(0);
  });

  it('releases held pads when the browser loses focus', () => {
    const onPadRelease = jest.fn();
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
    const target = {
      setPointerCapture: jest.fn(),
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
    };
    const { getByTestId } = render(
      <MultiTouchOverlay
        rows={1}
        columns={1}
        onPadRelease={onPadRelease}
        testID="overlay"
      />
    );
    const overlay = getByTestId('overlay');
    fireEvent(overlay, 'layout', {
      nativeEvent: { layout: { width: 100, height: 100 } },
    });
    fireEvent(overlay, 'pointerDown', pointer(target));

    act(() => blur?.());
    expect(onPadRelease).toHaveBeenCalledWith(0);
  });
});
