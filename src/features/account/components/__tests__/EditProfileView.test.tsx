import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../theme';
import { EditProfileView, type EditProfileViewProps } from '../EditProfileView';
import type { UserProfile } from '../../types';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

const mockProfile: UserProfile = {
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
  pictureUrl: 'https://example.com/avatar.jpg',
};

const defaultProps: EditProfileViewProps = {
  visible: true,
  profile: mockProfile,
  authProvider: 'email',
  didDismiss: jest.fn(),
};

describe('EditProfileView', () => {
  it('matches snapshot (dark mode, visible)', () => {
    const tree = renderWithTheme(<EditProfileView {...defaultProps} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot (light mode, visible)', () => {
    const tree = render(
      <ThemeProvider initialMode="light">
        <EditProfileView {...defaultProps} />
      </ThemeProvider>
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot (hidden)', () => {
    const tree = renderWithTheme(
      <EditProfileView {...defaultProps} visible={false} />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('displays profile name in header', () => {
    const { getByText } = renderWithTheme(<EditProfileView {...defaultProps} />);
    expect(getByText('Test User')).toBeTruthy();
  });

  it('displays profile email in header', () => {
    const { getByText } = renderWithTheme(<EditProfileView {...defaultProps} />);
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('displays Change Email section for non-Apple auth', () => {
    const { getByText } = renderWithTheme(
      <EditProfileView {...defaultProps} authProvider="email" />
    );
    expect(getByText('Change Email')).toBeTruthy();
  });

  it('hides Change Email section for Apple auth', () => {
    const { queryByText } = renderWithTheme(
      <EditProfileView {...defaultProps} authProvider="apple" />
    );
    expect(queryByText('Change Email')).toBeNull();
  });

  it('displays Change Password section for non-Apple auth', () => {
    const { getByText } = renderWithTheme(
      <EditProfileView {...defaultProps} authProvider="email" />
    );
    expect(getByText('Change Password')).toBeTruthy();
  });

  it('hides Change Password section for Apple auth', () => {
    const { queryByText } = renderWithTheme(
      <EditProfileView {...defaultProps} authProvider="apple" />
    );
    expect(queryByText('Change Password')).toBeNull();
  });

  it('displays Delete Account button', () => {
    const { getByText } = renderWithTheme(<EditProfileView {...defaultProps} />);
    expect(getByText('Delete Account')).toBeTruthy();
  });

  it('displays error message when provided', () => {
    const { getByText } = renderWithTheme(
      <EditProfileView {...defaultProps} error="Something went wrong" />
    );
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('displays success message when provided', () => {
    const { getByText } = renderWithTheme(
      <EditProfileView {...defaultProps} successMessage="Email updated successfully" />
    );
    expect(getByText('Email updated successfully')).toBeTruthy();
  });

  it('uses store action naming convention (didXxx)', () => {
    const props: EditProfileViewProps = {
      visible: true,
      profile: mockProfile,
      didDismiss: () => {},
      didChangeEmail: async () => true,
      didChangePassword: async () => true,
      didDeleteAccount: async () => true,
    };
    expect(props.didDismiss).toBeDefined();
    expect(props.didChangeEmail).toBeDefined();
    expect(props.didChangePassword).toBeDefined();
    expect(props.didDeleteAccount).toBeDefined();
  });

  it('renders input fields for email change', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <EditProfileView {...defaultProps} authProvider="email" />
    );
    expect(getByPlaceholderText('E.g. johnsmith@mail.com')).toBeTruthy();
    expect(getByPlaceholderText('Your Password')).toBeTruthy();
  });

  it('renders input fields for password change', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <EditProfileView {...defaultProps} authProvider="email" />
    );
    expect(getByPlaceholderText('Your old password')).toBeTruthy();
    expect(getByPlaceholderText('Your new desired password')).toBeTruthy();
  });
});