/**
 * Tests for CelebrationView — playground onboarding celebration modal.
 * MDC-271: Modal with confetti, title, subtitle, and dismiss button.
 */
import { render, fireEvent } from '@testing-library/react-native';
import { CelebrationView } from '../CelebrationView';

describe('CelebrationView', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders default title "You did it! 🎉"', () => {
    const { getByText } = render(
      <CelebrationView visible={true} onDismiss={mockOnDismiss} />
    );
    expect(getByText('You did it! 🎉')).toBeTruthy();
  });

  it('renders custom title', () => {
    const { getByText } = render(
      <CelebrationView
        visible={true}
        title="Amazing!"
        onDismiss={mockOnDismiss}
      />
    );
    expect(getByText('Amazing!')).toBeTruthy();
  });

  it('renders default subtitle', () => {
    const { getByText } = render(
      <CelebrationView visible={true} onDismiss={mockOnDismiss} />
    );
    expect(getByText("You've completed the playground tutorial")).toBeTruthy();
  });

  it('renders custom subtitle', () => {
    const { getByText } = render(
      <CelebrationView
        visible={true}
        subtitle="Well done champ"
        onDismiss={mockOnDismiss}
      />
    );
    expect(getByText('Well done champ')).toBeTruthy();
  });

  it('renders default "Get Started" button', () => {
    const { getByText } = render(
      <CelebrationView visible={true} onDismiss={mockOnDismiss} />
    );
    expect(getByText('Get Started')).toBeTruthy();
  });

  it('renders custom button title', () => {
    const { getByText } = render(
      <CelebrationView
        visible={true}
        buttonTitle="Let's Go"
        onDismiss={mockOnDismiss}
      />
    );
    expect(getByText("Let's Go")).toBeTruthy();
  });

  it('calls onDismiss when button is pressed', () => {
    const { getByTestId } = render(
      <CelebrationView visible={true} onDismiss={mockOnDismiss} />
    );
    fireEvent.press(getByTestId('celebration-dismiss-button'));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders confetti container', () => {
    const { getByTestId } = render(
      <CelebrationView visible={true} onDismiss={mockOnDismiss} />
    );
    expect(getByTestId('confetti-container')).toBeTruthy();
  });

  it('renders large emoji', () => {
    const { getByText } = render(
      <CelebrationView visible={true} onDismiss={mockOnDismiss} />
    );
    expect(getByText('🎉')).toBeTruthy();
  });
});
