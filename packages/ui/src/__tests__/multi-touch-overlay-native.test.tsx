import { fireEvent, render } from '@testing-library/react-native';
import { MultiTouchOverlay } from '../components/MultiTouchOverlay/MultiTouchOverlay.android';

const touch = (identifier: number, locationX: number, locationY = 10) => ({
  identifier,
  locationX,
  locationY,
});

describe('MultiTouchOverlay native touch lifecycle', () => {
  it('keeps a shared pad held until its final pointer ends', () => {
    const onPadPress = jest.fn();
    const onPadRelease = jest.fn();
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
      nativeEvent: { layout: { width: 100, height: 100 } },
    });

    fireEvent(overlay, 'responderGrant', {
      nativeEvent: { touches: [touch(1, 10), touch(2, 20)] },
    });
    expect(onPadPress).toHaveBeenCalledTimes(1);
    expect(onPadPress).toHaveBeenCalledWith(0);

    fireEvent(overlay, 'responderEnd', {
      nativeEvent: { touches: [touch(2, 20)] },
    });
    expect(onPadRelease).not.toHaveBeenCalled();

    fireEvent(overlay, 'responderRelease', { nativeEvent: { touches: [] } });
    expect(onPadRelease).toHaveBeenCalledTimes(1);
    expect(onPadRelease).toHaveBeenCalledWith(0);
  });

  it('releases the old pad and presses a free pad while dragging', () => {
    const onPadPress = jest.fn();
    const onPadRelease = jest.fn();
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
      nativeEvent: { layout: { width: 100, height: 100 } },
    });
    fireEvent(overlay, 'responderGrant', {
      nativeEvent: { touches: [touch(1, 10)] },
    });
    fireEvent(overlay, 'responderMove', {
      nativeEvent: { touches: [touch(1, 90)] },
    });

    expect(onPadPress.mock.calls).toEqual([[0], [1]]);
    expect(onPadRelease.mock.calls).toEqual([[0]]);
  });

  it('does not retrigger a destination already held by another pointer', () => {
    const onPadPress = jest.fn();
    const onPadRelease = jest.fn();
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
      nativeEvent: { layout: { width: 100, height: 100 } },
    });
    fireEvent(overlay, 'responderGrant', {
      nativeEvent: { touches: [touch(1, 10), touch(2, 90)] },
    });
    fireEvent(overlay, 'responderMove', {
      nativeEvent: { touches: [touch(1, 90), touch(2, 90)] },
    });

    expect(onPadPress.mock.calls).toEqual([[0], [1]]);
    expect(onPadRelease.mock.calls).toEqual([[0]]);
  });

  it('releases held pads when the overlay unmounts', () => {
    const onPadRelease = jest.fn();
    const view = render(
      <MultiTouchOverlay
        rows={1}
        columns={2}
        onPadRelease={onPadRelease}
        testID="overlay"
      />
    );
    const overlay = view.getByTestId('overlay');
    fireEvent(overlay, 'layout', {
      nativeEvent: { layout: { width: 100, height: 100 } },
    });
    fireEvent(overlay, 'responderGrant', {
      nativeEvent: { touches: [touch(1, 10), touch(2, 90)] },
    });

    view.unmount();

    expect(onPadRelease.mock.calls).toEqual([[0], [1]]);
  });

  it('tracks additional fingers and releases all pads on termination', () => {
    const onPadPress = jest.fn();
    const onPadRelease = jest.fn();
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
      nativeEvent: { layout: { width: 100, height: 100 } },
    });
    fireEvent(overlay, 'responderGrant', {
      nativeEvent: { touches: [touch(1, 10)] },
    });
    fireEvent(overlay, 'responderStart', {
      nativeEvent: { touches: [touch(1, 10), touch(2, 90)] },
    });
    expect(onPadPress.mock.calls).toEqual([[0], [1]]);

    fireEvent(overlay, 'responderEnd', {
      nativeEvent: { touches: [touch(2, 90)] },
    });
    expect(onPadRelease).toHaveBeenLastCalledWith(0);

    fireEvent(overlay, 'responderTerminate', {
      nativeEvent: { touches: [touch(2, 90)] },
    });
    expect(onPadRelease).toHaveBeenLastCalledWith(1);
    expect(onPadRelease).toHaveBeenCalledTimes(2);
  });
});
