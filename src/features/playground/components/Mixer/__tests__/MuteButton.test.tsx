/**
 * MuteButton Tests
 *
 * Verifies:
 * - Renders "M" text
 * - Active state: orange background (#FF5C24)
 * - Inactive state: #333 background
 * - Fires onPress callback
 * - Correct accessibility attributes
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { MuteButton } from '../MuteButton';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

describe('MuteButton', () => {
  it('renders without crashing', () => {
    const { getByTestId } = renderWithTheme(
      <MuteButton isMuted={false} />
    );
    expect(getByTestId('mute-button')).toBeTruthy();
  });

  it('displays "M" text', () => {
    const { getByText } = renderWithTheme(
      <MuteButton isMuted={false} />
    );
    expect(getByText('M')).toBeTruthy();
  });

  it('has orange background when muted', () => {
    const { getByTestId } = renderWithTheme(
      <MuteButton isMuted={true} />
    );
    const button = getByTestId('mute-button');
    const flatStyle = Array.isArray(button.props.style)
      ? Object.assign({}, ...button.props.style)
      : button.props.style;
    expect(flatStyle.backgroundColor).toBe('#FF5C24');
  });

  it('has dark background when not muted', () => {
    const { getByTestId } = renderWithTheme(
      <MuteButton isMuted={false} />
    );
    const button = getByTestId('mute-button');
    const flatStyle = Array.isArray(button.props.style)
      ? Object.assign({}, ...button.props.style)
      : button.props.style;
    expect(flatStyle.backgroundColor).toBe('#333333');
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <MuteButton isMuted={false} onPress={onPress} />
    );
    fireEvent.press(getByTestId('mute-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility role and label', () => {
    const { getByTestId } = renderWithTheme(
      <MuteButton isMuted={false} />
    );
    const button = getByTestId('mute-button');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Mute');
  });

  it('has selected accessibility state when muted', () => {
    const { getByTestId } = renderWithTheme(
      <MuteButton isMuted={true} />
    );
    expect(getByTestId('mute-button').props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('has unselected accessibility state when not muted', () => {
    const { getByTestId } = renderWithTheme(
      <MuteButton isMuted={false} />
    );
    expect(getByTestId('mute-button').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('is 32×32 in size', () => {
    const { getByTestId } = renderWithTheme(
      <MuteButton isMuted={false} />
    );
    const button = getByTestId('mute-button');
    const flatStyle = Array.isArray(button.props.style)
      ? Object.assign({}, ...button.props.style)
      : button.props.style;
    expect(flatStyle.width).toBe(32);
    expect(flatStyle.height).toBe(32);
  });

  it('accepts custom testID', () => {
    const { getByTestId } = renderWithTheme(
      <MuteButton isMuted={false} testID="custom-mute" />
    );
    expect(getByTestId('custom-mute')).toBeTruthy();
  });
});
