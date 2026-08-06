import { act, fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { createDrumSamples, resetMockIds } from '../../../mocks';
import { DrumPadsView } from '../DrumPadsView.web';

beforeEach(() => {
  resetMockIds();
  Object.assign(globalThis, {
    window: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    document: {
      activeElement: null,
      hidden: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  });
});

describe('DrumPadsView web parity', () => {
  it('keeps low drum pads on the bottom row with accessibility activation', () => {
    const samples = createDrumSamples();
    jest.useFakeTimers();
    const onPadPress = jest.fn();
    const onPadRelease = jest.fn();
    const { getAllByRole, getByRole } = render(
      <ThemeProvider initialMode="dark">
        <DrumPadsView
          samples={samples}
          onPadPress={onPadPress}
          onPadRelease={onPadRelease}
        />
      </ThemeProvider>
    );

    expect(
      getAllByRole('button').map((pad) => pad.props.accessibilityLabel)
    ).toEqual(
      [
        ...samples.slice(12, 16),
        ...samples.slice(8, 12),
        ...samples.slice(4, 8),
        ...samples.slice(0, 4),
      ].map((sample) => sample.name)
    );
    fireEvent(
      getByRole('button', { name: samples[0]!.name }),
      'accessibilityAction',
      {
        nativeEvent: { actionName: 'activate' },
      }
    );
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
    expect(onPadPress).toHaveBeenCalledWith(0);
    expect(onPadRelease).toHaveBeenCalledWith(0);
  });

  it('holds a pad until every input owner releases it', () => {
    jest.useFakeTimers();
    const onPadPress = jest.fn();
    const onPadRelease = jest.fn();
    const { getAllByRole } = render(
      <ThemeProvider initialMode="dark">
        <DrumPadsView
          samples={createDrumSamples()}
          onPadPress={onPadPress}
          onPadRelease={onPadRelease}
        />
      </ThemeProvider>
    );
    const addEventListener = window.addEventListener as jest.Mock;
    const keyDown = addEventListener.mock.calls.find(
      ([name]) => name === 'keydown'
    )?.[1];
    const keyUp = addEventListener.mock.calls.find(
      ([name]) => name === 'keyup'
    )?.[1];

    act(() => keyDown({ key: 'q', preventDefault: jest.fn() }));
    fireEvent(getAllByRole('button')[0]!, 'accessibilityAction', {
      nativeEvent: { actionName: 'activate' },
    });
    act(() => jest.runOnlyPendingTimers());

    expect(onPadPress).toHaveBeenCalledTimes(1);
    expect(onPadRelease).not.toHaveBeenCalled();

    act(() => keyUp({ key: 'q', preventDefault: jest.fn() }));
    expect(onPadRelease).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
