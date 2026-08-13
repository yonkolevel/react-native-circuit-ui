import { createRef } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme';
import {
  NotePrecisionPanel,
  type NotePrecisionPanelHandle,
} from '../NotePrecisionPanel';

it('keeps the velocity timeline inside the shared piano-roll scroll range', () => {
  const ref = createRef<NotePrecisionPanelHandle>();
  const view = render(
    <ThemeProvider initialMode="dark">
      <NotePrecisionPanel
        ref={ref}
        notes={[]}
        pitchIndex={0}
        pitchLabel="Kick"
        pitchMidiNumber={36}
        activeLengthInBars={2}
        trackColor="#00ff9e"
        stepWidth={10}
      />
    </ThemeProvider>
  );
  const scroll = view
    .UNSAFE_getAllByType(ScrollView)
    .find((candidate) => candidate.props.horizontal)!;

  scroll.instance.scrollTo.mockClear();
  act(() => ref.current?.scrollToX(100, false));
  expect(scroll.instance.scrollTo).toHaveBeenCalledTimes(1);

  fireEvent(scroll, 'layout', {
    nativeEvent: { layout: { width: 100, height: 200 } },
  });
  expect(scroll.instance.scrollTo).toHaveBeenCalledTimes(2);
  expect(scroll.instance.scrollTo).toHaveBeenLastCalledWith({
    x: 100,
    animated: false,
  });

  act(() => ref.current?.scrollToX(-200, false));
  expect(scroll.instance.scrollTo).toHaveBeenLastCalledWith({
    x: 0,
    animated: false,
  });

  act(() => ref.current?.scrollToX(999, false));
  expect(scroll.instance.scrollTo).toHaveBeenLastCalledWith({
    x: 220,
    animated: false,
  });
  fireEvent(scroll, 'layout', {
    nativeEvent: { layout: { width: 300, height: 200 } },
  });
  expect(scroll.instance.scrollTo).toHaveBeenLastCalledWith({
    x: 20,
    animated: false,
  });

  expect(scroll.props.bounces).toBe(false);
  expect(StyleSheet.flatten(scroll.props.children.props.style).width).toBe(320);
});
