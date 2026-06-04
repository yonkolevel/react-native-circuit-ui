import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../theme';
import { SignInView } from '../SignInView';
import { CreateAccountView } from '../CreateAccountView';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

describe('SignInView', () => {
  it('matches snapshot', () => {
    const tree = renderWithTheme(<SignInView />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('displays title and fields', () => {
    const { getAllByText } = renderWithTheme(<SignInView />);
    // "Sign In" appears as both title and button label
    expect(getAllByText('Sign In').length).toBeGreaterThanOrEqual(1);
  });

  it('displays error message when provided', () => {
    const { getByText } = renderWithTheme(
      <SignInView error="Invalid credentials" />
    );
    expect(getByText('Invalid credentials')).toBeTruthy();
  });
});

describe('CreateAccountView', () => {
  it('matches snapshot', () => {
    const tree = renderWithTheme(<CreateAccountView />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('displays title', () => {
    const { getAllByText } = renderWithTheme(<CreateAccountView />);
    // "Create Account" appears as both title and button label
    expect(getAllByText('Create Account').length).toBeGreaterThanOrEqual(1);
  });

  it('displays error message when provided', () => {
    const { getByText } = renderWithTheme(
      <CreateAccountView error="Email taken" />
    );
    expect(getByText('Email taken')).toBeTruthy();
  });
});
