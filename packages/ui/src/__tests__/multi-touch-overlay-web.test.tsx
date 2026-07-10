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
  const pointer = (
    currentTarget: object,
    pointerId = 7,
    pointerType = 'mouse',
    clientX = 10,
    clientY = 10
  ) => ({
    currentTarget,
    nativeEvent: { pointerId, pointerType, clientX, clientY },
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

  it('keeps a pad held until its final pointer releases', () => {
    const onPadPress = jest.fn();
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
        onPadPress={onPadPress}
        onPadRelease={onPadRelease}
        testID="overlay"
      />
    );
    const overlay = getByTestId('overlay');
    fireEvent(overlay, 'layout', {
      nativeEvent: { layout: { width: 100, height: 100 } },
    });

    fireEvent(overlay, 'pointerDown', pointer(target, 1, 'touch'));
    fireEvent(overlay, 'pointerDown', pointer(target, 2, 'touch'));
    expect(onPadPress).toHaveBeenCalledTimes(1);

    fireEvent(overlay, 'pointerUp', pointer(target, 1, 'touch'));
    expect(onPadRelease).not.toHaveBeenCalled();
    fireEvent(overlay, 'pointerUp', pointer(target, 2, 'touch'));
    expect(onPadRelease).toHaveBeenCalledTimes(1);
  });

  it('moves touch pointers independently between cells', () => {
    const onPadPress = jest.fn();
    const onPadRelease = jest.fn();
    const target = {
      setPointerCapture: jest.fn(),
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        right: 200,
        bottom: 100,
      }),
    };
    const { getByTestId } = render(
      <MultiTouchOverlay
        rows={1}
        columns={2}
        onPadPress={onPadPress}
        onPadRelease={onPadRelease}
        testID="overlay"
      />
    );
    const overlay = getByTestId('overlay');
    fireEvent(overlay, 'layout', {
      nativeEvent: { layout: { width: 200, height: 100 } },
    });

    fireEvent(overlay, 'pointerDown', pointer(target, 1, 'touch', 10, 10));
    fireEvent(overlay, 'pointerDown', pointer(target, 2, 'touch', 20, 10));
    fireEvent(overlay, 'pointerMove', pointer(target, 1, 'touch', 150, 10));

    expect(onPadPress.mock.calls).toEqual([[0], [1]]);
    expect(onPadRelease).not.toHaveBeenCalled();
    fireEvent(overlay, 'pointerUp', pointer(target, 2, 'touch', 20, 10));
    expect(onPadRelease).toHaveBeenCalledWith(0);
    fireEvent(overlay, 'pointerUp', pointer(target, 1, 'touch', 150, 10));
    expect(onPadRelease).toHaveBeenCalledWith(1);
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
