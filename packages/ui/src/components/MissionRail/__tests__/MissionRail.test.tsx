import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme';
import { MissionRail } from '../MissionRail';

const renderRail = (
  props: Partial<React.ComponentProps<typeof MissionRail>> = {}
) =>
  render(
    <ThemeProvider initialMode="dark">
      <MissionRail
        mode="Practice"
        title="Build the beat"
        instructions="Add the missing kick."
        {...props}
      />
    </ThemeProvider>
  );

describe('MissionRail', () => {
  it.each(['Learn', 'Practice', 'Recall', 'Creative'] as const)(
    'exposes neutral %s vocabulary',
    (mode) => {
      const { getByLabelText, queryByText } = renderRail({ mode });
      expect(getByLabelText(`${mode} mission`)).toBeTruthy();
      expect(queryByText(/gold|silver|bronze/i)).toBeNull();
    }
  );

  it('exposes progress, actionable failed feedback, and explicit actions', () => {
    const onHelp = jest.fn();
    const onCheck = jest.fn();
    const onContinue = jest.fn();
    const { getByTestId, getByLabelText } = renderRail({
      progress: { current: 3, total: 8, label: '3 of 8 notes' },
      feedback: ['Missing one snare', 'Remove one out-of-scale note'],
      onHelp,
      onCheck,
      onContinue,
      continueDisabled: true,
    });

    expect(
      getByTestId('mission-rail-progress').props.accessibilityValue.now
    ).toBe(37.5);
    expect(getByTestId('mission-rail-feedback').props.accessibilityRole).toBe(
      'alert'
    );
    fireEvent.press(getByTestId('mission-rail-help'));
    fireEvent.press(getByTestId('mission-rail-check'));
    fireEvent.press(getByTestId('mission-rail-continue'));
    expect(onHelp).toHaveBeenCalledTimes(1);
    expect(onCheck).toHaveBeenCalledTimes(1);
    expect(onContinue).not.toHaveBeenCalled();
    expect(getByLabelText('Continue').props.accessibilityState.disabled).toBe(
      true
    );
  });

  it('announces read-only and disabled states', () => {
    const { getByLabelText } = renderRail({ readOnly: true, disabled: true });
    expect(
      getByLabelText('Practice mission, read only').props.accessibilityState
        .disabled
    ).toBe(true);
  });
});
