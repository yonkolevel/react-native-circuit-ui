import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../theme';
import { WelcomeView } from '../WelcomeView';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

describe('WelcomeView snapshots', () => {
  it('matches snapshot', () => {
    const tree = renderWithTheme(<WelcomeView />);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

describe('WelcomeView interactions', () => {
  it('displays app name and tagline', () => {
    const { getByText } = renderWithTheme(<WelcomeView />);
    expect(getByText('midicircuit')).toBeTruthy();
    expect(getByText('Learn Create Share')).toBeTruthy();
  });

  it('calls onGetStarted when Get Started is pressed', () => {
    const onGetStarted = jest.fn();
    const { getByText } = renderWithTheme(
      <WelcomeView onGetStarted={onGetStarted} />
    );
    fireEvent.press(getByText('Get Started'));
    expect(onGetStarted).toHaveBeenCalled();
  });

  it('calls onSignIn when Sign In is pressed', () => {
    const onSignIn = jest.fn();
    const { getByText } = renderWithTheme(<WelcomeView onSignIn={onSignIn} />);
    fireEvent.press(getByText('Sign In'));
    expect(onSignIn).toHaveBeenCalled();
  });

  it('renders both buttons', () => {
    const { getByText } = renderWithTheme(<WelcomeView />);
    expect(getByText('Get Started')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });
});
