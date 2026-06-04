/**
 * Tests for WhatsNewView — full WhatsNewKit-style component.
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WhatsNewView } from '../WhatsNewView';
import { createInMemoryVersionStore } from '../../store/AsyncStorageVersionStore';
import type { WhatsNew, WhatsNewLayout } from '../../types';

const makeWhatsNew = (overrides?: Partial<WhatsNew>): WhatsNew => ({
  version: { major: 2, minor: 0, patch: 0 },
  features: [
    {
      image: { type: 'systemName', name: 'musical.notes' },
      title: 'New Sounds',
      subtitle: 'Fresh sound banks available.',
    },
    {
      image: { type: 'systemName', name: 'bolt.fill' },
      title: 'Faster Engine',
      subtitle: 'Improved performance.',
    },
  ],
  ...overrides,
});

describe('WhatsNewView', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Basic Rendering ─────────────────────────────────────────────────────

  it('renders default title "What\'s New"', () => {
    const { getByText } = render(
      <WhatsNewView whatsNew={makeWhatsNew()} onDismiss={mockOnDismiss} />
    );
    expect(getByText("What's New")).toBeTruthy();
  });

  it('renders custom title', () => {
    const { getByText } = render(
      <WhatsNewView
        whatsNew={makeWhatsNew({ title: 'Version 2.0' })}
        onDismiss={mockOnDismiss}
      />
    );
    expect(getByText('Version 2.0')).toBeTruthy();
  });

  it('renders feature titles and subtitles', () => {
    const { getByText } = render(
      <WhatsNewView whatsNew={makeWhatsNew()} onDismiss={mockOnDismiss} />
    );
    expect(getByText('New Sounds')).toBeTruthy();
    expect(getByText('Fresh sound banks available.')).toBeTruthy();
    expect(getByText('Faster Engine')).toBeTruthy();
    expect(getByText('Improved performance.')).toBeTruthy();
  });

  it('renders icon for each feature', () => {
    const { getAllByTestId } = render(
      <WhatsNewView whatsNew={makeWhatsNew()} onDismiss={mockOnDismiss} />
    );
    expect(getAllByTestId('whats-new-icon')).toHaveLength(2);
  });

  // ── Primary Action ────────────────────────────────────────────────────────

  it('renders default "Continue" button', () => {
    const { getByText } = render(
      <WhatsNewView whatsNew={makeWhatsNew()} onDismiss={mockOnDismiss} />
    );
    expect(getByText('Continue')).toBeTruthy();
  });

  it('renders custom primary action title', () => {
    const { getByText } = render(
      <WhatsNewView
        whatsNew={makeWhatsNew({ primaryAction: { title: 'Got it!' } })}
        onDismiss={mockOnDismiss}
      />
    );
    expect(getByText('Got it!')).toBeTruthy();
  });

  it('calls onDismiss when primary action is pressed', () => {
    const { getByTestId } = render(
      <WhatsNewView whatsNew={makeWhatsNew()} onDismiss={mockOnDismiss} />
    );
    fireEvent.press(getByTestId('whats-new-primary-action'));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls primaryAction.onDismiss callback', () => {
    const customDismiss = jest.fn();
    const { getByTestId } = render(
      <WhatsNewView
        whatsNew={makeWhatsNew({
          primaryAction: { onDismiss: customDismiss },
        })}
        onDismiss={mockOnDismiss}
      />
    );
    fireEvent.press(getByTestId('whats-new-primary-action'));
    expect(customDismiss).toHaveBeenCalledTimes(1);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  // ── Secondary Action ──────────────────────────────────────────────────────

  it('renders secondary action when provided', () => {
    const { getByText } = render(
      <WhatsNewView
        whatsNew={makeWhatsNew({
          secondaryAction: {
            title: 'Learn More',
            action: { type: 'dismiss' },
          },
        })}
        onDismiss={mockOnDismiss}
      />
    );
    expect(getByText('Learn More')).toBeTruthy();
  });

  it('does not render secondary action when not provided', () => {
    const { queryByText } = render(
      <WhatsNewView whatsNew={makeWhatsNew()} onDismiss={mockOnDismiss} />
    );
    expect(queryByText('Learn More')).toBeNull();
  });

  it('fires custom secondary action handler', () => {
    const customHandler = jest.fn();
    const { getByText } = render(
      <WhatsNewView
        whatsNew={makeWhatsNew({
          secondaryAction: {
            title: 'Details',
            action: { type: 'custom', handler: customHandler },
          },
        })}
        onDismiss={mockOnDismiss}
      />
    );
    fireEvent.press(getByText('Details'));
    expect(customHandler).toHaveBeenCalledTimes(1);
  });

  // ── Version Store Persistence ─────────────────────────────────────────────

  it('persists version to store on primary action press', async () => {
    const store = createInMemoryVersionStore();
    const version = { major: 2, minor: 0, patch: 0 };

    const { getByTestId } = render(
      <WhatsNewView
        whatsNew={makeWhatsNew({ version })}
        versionStore={store}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.press(getByTestId('whats-new-primary-action'));

    await waitFor(async () => {
      expect(await store.hasPresented(version)).toBe(true);
    });
  });

  it('does not persist when no versionStore provided', () => {
    const { getByTestId } = render(
      <WhatsNewView whatsNew={makeWhatsNew()} onDismiss={mockOnDismiss} />
    );
    // Should not throw
    fireEvent.press(getByTestId('whats-new-primary-action'));
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  // ── Feature Image Types ───────────────────────────────────────────────────

  it('renders systemName image with fallback icon', () => {
    const { getAllByTestId } = render(
      <WhatsNewView whatsNew={makeWhatsNew()} onDismiss={mockOnDismiss} />
    );
    // Both features use systemName
    expect(getAllByTestId('whats-new-icon')).toHaveLength(2);
  });

  it('renders custom element image', () => {
    const CustomIcon = () => null;
    const whatsNew = makeWhatsNew({
      features: [
        {
          image: { type: 'custom', element: <CustomIcon /> },
          title: 'Custom',
          subtitle: 'With custom icon',
        },
      ],
    });
    const { getByTestId } = render(
      <WhatsNewView whatsNew={whatsNew} onDismiss={mockOnDismiss} />
    );
    expect(getByTestId('whats-new-icon')).toBeTruthy();
  });

  // ── Layout ────────────────────────────────────────────────────────────────

  it('renders with custom layout without crashing', () => {
    const customLayout: WhatsNewLayout = {
      contentSpacing: 80,
      featureListSpacing: 30,
      featureHorizontalAlignment: 'top',
      footerPrimaryActionButtonCornerRadius: 20,
    };
    const { getByText } = render(
      <WhatsNewView
        whatsNew={makeWhatsNew()}
        layout={customLayout}
        onDismiss={mockOnDismiss}
      />
    );
    expect(getByText("What's New")).toBeTruthy();
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it('has testID on root view', () => {
    const { getByTestId } = render(
      <WhatsNewView whatsNew={makeWhatsNew()} onDismiss={mockOnDismiss} />
    );
    expect(getByTestId('whats-new-view')).toBeTruthy();
  });
});
