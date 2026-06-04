/**
 * Tests for WhatsNewModal — legacy simple API.
 * Verifies backward compatibility with whatsNewStore's WhatsNewItem interface.
 */
import { render, fireEvent } from '@testing-library/react-native';
import { WhatsNewModal } from '../WhatsNewModal';
import type { WhatsNewItem } from '../../types';

const mockItems: WhatsNewItem[] = [
  {
    id: 'feature-1',
    imageName: 'musical.notes',
    title: 'New Sound Banks',
    description: 'Explore 5 new sound banks with premium samples.',
  },
  {
    id: 'feature-2',
    imageName: 'waveform',
    title: 'Improved Audio Engine',
    description: 'Lower latency and better performance.',
  },
  {
    id: 'feature-3',
    imageName: 'star.fill',
    title: 'Favourites',
    description: 'Save your favourite circuits for quick access.',
  },
];

describe('WhatsNewModal', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the default title "What\'s New"', () => {
    const { getByText } = render(
      <WhatsNewModal
        visible={true}
        items={mockItems}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText("What's New")).toBeTruthy();
  });

  it('renders a custom title when provided', () => {
    const { getByText } = render(
      <WhatsNewModal
        visible={true}
        items={mockItems}
        onDismiss={mockOnDismiss}
        title="Version 2.0"
      />
    );

    expect(getByText('Version 2.0')).toBeTruthy();
  });

  it('renders all feature item titles', () => {
    const { getByText } = render(
      <WhatsNewModal
        visible={true}
        items={mockItems}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('New Sound Banks')).toBeTruthy();
    expect(getByText('Improved Audio Engine')).toBeTruthy();
    expect(getByText('Favourites')).toBeTruthy();
  });

  it('renders all feature item descriptions (as subtitles)', () => {
    const { getByText } = render(
      <WhatsNewModal
        visible={true}
        items={mockItems}
        onDismiss={mockOnDismiss}
      />
    );

    expect(
      getByText('Explore 5 new sound banks with premium samples.')
    ).toBeTruthy();
    expect(getByText('Lower latency and better performance.')).toBeTruthy();
    expect(
      getByText('Save your favourite circuits for quick access.')
    ).toBeTruthy();
  });

  it('renders the default "Continue" action button', () => {
    const { getByText } = render(
      <WhatsNewModal
        visible={true}
        items={mockItems}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Continue')).toBeTruthy();
  });

  it('renders a custom action title when provided', () => {
    const { getByText } = render(
      <WhatsNewModal
        visible={true}
        items={mockItems}
        onDismiss={mockOnDismiss}
        actionTitle="Get Started"
      />
    );

    expect(getByText('Get Started')).toBeTruthy();
  });

  it('calls onDismiss when Continue button is pressed', () => {
    const { getByTestId } = render(
      <WhatsNewModal
        visible={true}
        items={mockItems}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.press(getByTestId('whats-new-primary-action'));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders nothing visible when visible is false', () => {
    const { queryByText } = render(
      <WhatsNewModal
        visible={false}
        items={mockItems}
        onDismiss={mockOnDismiss}
      />
    );

    // Modal with visible=false doesn't render children
    expect(queryByText("What's New")).toBeNull();
  });

  it('renders with a single item', () => {
    const singleItem: WhatsNewItem[] = [
      {
        id: 'solo',
        imageName: 'sparkles',
        title: 'One Feature',
        description: 'A single new feature.',
      },
    ];

    const { getByText } = render(
      <WhatsNewModal
        visible={true}
        items={singleItem}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('One Feature')).toBeTruthy();
    expect(getByText('A single new feature.')).toBeTruthy();
  });

  it('renders with empty items array', () => {
    const { getByText } = render(
      <WhatsNewModal visible={true} items={[]} onDismiss={mockOnDismiss} />
    );

    expect(getByText("What's New")).toBeTruthy();
    expect(getByText('Continue')).toBeTruthy();
  });

  it('renders icon placeholders for each item', () => {
    const { getAllByTestId } = render(
      <WhatsNewModal
        visible={true}
        items={mockItems}
        onDismiss={mockOnDismiss}
      />
    );

    const icons = getAllByTestId('whats-new-icon');
    expect(icons).toHaveLength(3);
  });
});
