import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme';
import { MissionRail } from '../MissionRail';

const onExpandedChange = jest.fn();
const primaryAction = {
  label: 'Check',
  onPress: jest.fn(),
  a11yId: 'mission-rail-primary',
};

const renderRail = (
  props: Partial<React.ComponentProps<typeof MissionRail>> = {}
) =>
  render(
    <ThemeProvider initialMode="dark">
      <MissionRail
        mode="Practice"
        title="Build the beat"
        instructions="Add the missing kick."
        expanded={false}
        onExpandedChange={onExpandedChange}
        primaryAction={primaryAction}
        {...props}
      />
    </ThemeProvider>
  );

describe('MissionRail', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(['Learn', 'Practice', 'Recall', 'Creative'] as const)(
    'exposes neutral %s vocabulary',
    (mode) => {
      const { getByText, queryByText } = renderRail({ mode });
      expect(getByText(mode)).toBeTruthy();
      expect(queryByText(/gold|silver|bronze/i)).toBeNull();
    }
  );

  it('keeps one primary action and exposes controlled compact disclosure', () => {
    const { getByTestId } = renderRail({
      progress: { current: 3, total: 8, label: '3 of 8 notes' },
    });

    expect(
      getByTestId('mission-rail-progress').props.accessibilityValue.now
    ).toBe(37.5);
    expect(getByTestId('mission-rail-details').props).toMatchObject({
      accessibilityLabel: 'Practice mission: Build the beat',
      accessibilityState: { expanded: false },
    });
    expect(getByTestId('mission-rail-primary')).toBeTruthy();

    fireEvent.press(getByTestId('mission-rail-details'));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    fireEvent.press(getByTestId('mission-rail-primary'));
    expect(primaryAction.onPress).toHaveBeenCalledTimes(1);
  });

  it('announces failed feedback while the deck stays compact', () => {
    const { getByTestId } = renderRail({
      feedback: {
        message: 'Add the highlighted note.',
        tone: 'failure',
        announce: true,
      },
    });
    expect(getByTestId('mission-rail-feedback').props).toMatchObject({
      accessibilityRole: 'alert',
      accessibilityLiveRegion: 'assertive',
      accessibilityLabel: 'Add the highlighted note.',
    });
  });

  it('keeps help, Place One, and Exit subordinate in expanded details', () => {
    const secondaryAction = {
      label: 'Help',
      onPress: jest.fn(),
      a11yId: 'mission-help',
    };
    const contextAction = {
      label: 'Place One',
      onPress: jest.fn(),
      a11yId: 'mission-place-one',
    };
    const onExit = jest.fn();
    const { getByTestId, getByLabelText } = renderRail({
      expanded: true,
      feedback: {
        message: 'Put the first kick on beat one.',
        tone: 'failure',
        announce: true,
      },
      helpMessage: 'Add one highlighted kick. You can undo this hint.',
      secondaryAction,
      contextAction,
      onExit,
    });

    expect(getByTestId('mission-rail-feedback').props.accessibilityRole).toBe(
      'alert'
    );
    expect(
      getByTestId('mission-rail-feedback').props.accessibilityLiveRegion
    ).toBe('assertive');
    expect(
      getByLabelText('Practice mission').props.accessibilityState.expanded
    ).toBe(true);

    fireEvent.press(getByTestId('mission-help'));
    fireEvent.press(getByTestId('mission-place-one'));
    fireEvent.press(getByTestId('mission-rail-exit'));
    expect(secondaryAction.onPress).toHaveBeenCalledTimes(1);
    expect(contextAction.onPress).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('keeps neutral guidance out of alert semantics', () => {
    const { getByTestId } = renderRail({
      expanded: true,
      feedback: { message: 'Two notes placed.', tone: 'neutral' },
    });
    expect(
      getByTestId('mission-rail-feedback').props.accessibilityRole
    ).toBeUndefined();
    expect(
      getByTestId('mission-rail-feedback').props.accessibilityLiveRegion
    ).toBe('none');
  });
});
