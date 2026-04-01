import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../theme';
import { AccountLoggedIn, type AccountLoggedInProps } from '../AccountLoggedIn';
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

const mockAchievements = {
  completedCircuitCount: 5,
  completedLessonsCount: 12,
  achievedTrophyCount: 3,
};

const defaultProps: AccountLoggedInProps = {
  profile: mockProfile,
  achievements: mockAchievements,
  didTapEditProfile: jest.fn(),
  didTapLogout: jest.fn(),
  didTapSettingsButton: jest.fn(),
};

describe('AccountLoggedIn', () => {
  it('matches snapshot (dark mode)', () => {
    const tree = renderWithTheme(<AccountLoggedIn {...defaultProps} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot (light mode)', () => {
    const tree = render(
      <ThemeProvider initialMode="light">
        <AccountLoggedIn {...defaultProps} />
      </ThemeProvider>
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('displays profile name', () => {
    const { getByText } = renderWithTheme(
      <AccountLoggedIn {...defaultProps} />
    );
    expect(getByText('Test User')).toBeTruthy();
  });

  it('displays profile email', () => {
    const { getByText } = renderWithTheme(
      <AccountLoggedIn {...defaultProps} />
    );
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('displays stats with correct values', () => {
    const { getByLabelText } = renderWithTheme(
      <AccountLoggedIn {...defaultProps} />
    );
    expect(getByLabelText('Circuits: 5')).toBeTruthy();
    expect(getByLabelText('Lessons: 12')).toBeTruthy();
    expect(getByLabelText('Trophies: 3')).toBeTruthy();
  });

  it('displays section labels', () => {
    const { getByText } = renderWithTheme(
      <AccountLoggedIn {...defaultProps} />
    );
    expect(getByText('ID')).toBeTruthy();
    expect(getByText('PROGRESS SUMMARY')).toBeTruthy();
  });

  it('displays Profile header', () => {
    const { getByText } = renderWithTheme(
      <AccountLoggedIn {...defaultProps} />
    );
    expect(getByText('Profile')).toBeTruthy();
  });

  it('renders without optional callbacks', () => {
    const { getByText } = renderWithTheme(
      <AccountLoggedIn profile={mockProfile} achievements={mockAchievements} />
    );
    expect(getByText('Test User')).toBeTruthy();
  });

  it('renders store action names following Swift conventions', () => {
    // Verify props use Swift-style action names (didTapXxx)
    const props: AccountLoggedInProps = {
      profile: mockProfile,
      achievements: mockAchievements,
      didTapEditProfile: () => {},
      didTapLogout: () => {},
      didTapSettingsButton: () => {},
    };
    expect(props.didTapEditProfile).toBeDefined();
    expect(props.didTapLogout).toBeDefined();
    expect(props.didTapSettingsButton).toBeDefined();
  });

  it('renders with zero achievements', () => {
    const { getByLabelText } = renderWithTheme(
      <AccountLoggedIn
        {...defaultProps}
        achievements={{
          completedCircuitCount: 0,
          completedLessonsCount: 0,
          achievedTrophyCount: 0,
        }}
      />
    );
    expect(getByLabelText('Circuits: 0')).toBeTruthy();
    expect(getByLabelText('Lessons: 0')).toBeTruthy();
    expect(getByLabelText('Trophies: 0')).toBeTruthy();
  });

  it('renders with large achievement counts', () => {
    const { getByLabelText } = renderWithTheme(
      <AccountLoggedIn
        {...defaultProps}
        achievements={{
          completedCircuitCount: 100,
          completedLessonsCount: 500,
          achievedTrophyCount: 50,
        }}
      />
    );
    expect(getByLabelText('Circuits: 100')).toBeTruthy();
    expect(getByLabelText('Lessons: 500')).toBeTruthy();
    expect(getByLabelText('Trophies: 50')).toBeTruthy();
  });
});
