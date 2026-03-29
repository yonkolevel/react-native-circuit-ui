import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../theme';
import { EditProfileHeaderView } from '../EditProfileHeaderView';
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

describe('EditProfileHeaderView', () => {
  it('matches snapshot (dark mode)', () => {
    const tree = renderWithTheme(<EditProfileHeaderView profile={mockProfile} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot (light mode)', () => {
    const tree = render(
      <ThemeProvider initialMode="light">
        <EditProfileHeaderView profile={mockProfile} />
      </ThemeProvider>
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('displays profile name', () => {
    const { getByText } = renderWithTheme(<EditProfileHeaderView profile={mockProfile} />);
    expect(getByText('Test User')).toBeTruthy();
  });

  it('displays profile email', () => {
    const { getByText } = renderWithTheme(<EditProfileHeaderView profile={mockProfile} />);
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('works without pictureUrl', () => {
    const profileWithoutPic: UserProfile = { ...mockProfile, pictureUrl: undefined };
    const { getByText } = renderWithTheme(<EditProfileHeaderView profile={profileWithoutPic} />);
    expect(getByText('Test User')).toBeTruthy();
  });

  it('has correct accessibility attributes', () => {
    const { getByTestId } = renderWithTheme(
      <EditProfileHeaderView profile={mockProfile} testID="edit-profile-header" />
    );
    expect(getByTestId('edit-profile-header')).toBeTruthy();
  });
});