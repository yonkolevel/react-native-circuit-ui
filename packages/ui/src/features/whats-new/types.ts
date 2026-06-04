/**
 * WhatsNew types — full port of WhatsNewKit (SvenTiigi).
 *
 * Mirrors:
 * - WhatsNew.swift (root model)
 * - WhatsNew+Version.swift (semantic versioning)
 * - WhatsNew+Feature.swift + Feature+Image.swift (feature items)
 * - WhatsNew+PrimaryAction.swift (primary button config)
 * - WhatsNew+SecondaryAction.swift (secondary button config)
 * - WhatsNew+Layout.swift (customizable spacing/sizing)
 * - WhatsNew+HapticFeedback.swift (haptic feedback)
 * - WhatsNewVersionStore.swift (version persistence)
 */

// ─── Version ────────────────────────────────────────────────────────────────

/**
 * Semantic version — matches WhatsNew.Version in WhatsNewKit.
 * Comparable, parseable from string "major.minor.patch".
 */
export interface WhatsNewVersion {
  major: number;
  minor: number;
  patch: number;
}

// ─── Feature ────────────────────────────────────────────────────────────────

/**
 * Image source for a feature row.
 * Mirrors WhatsNew.Feature.Image — supports SF Symbol names,
 * asset names, or a custom React element.
 */
export type WhatsNewFeatureImage =
  | { type: 'systemName'; name: string; color?: string }
  | { type: 'asset'; name: string; color?: string }
  | { type: 'custom'; element: React.ReactNode };

/**
 * A single What's New feature row.
 * Mirrors WhatsNew.Feature in WhatsNewKit.
 */
export interface WhatsNewFeature {
  /** Image/icon for the feature */
  image: WhatsNewFeatureImage;
  /** Feature title */
  title: string;
  /** Feature subtitle/description */
  subtitle: string;
}

// ─── Haptic Feedback ────────────────────────────────────────────────────────

export type WhatsNewHapticFeedback =
  | { type: 'impact'; style?: 'light' | 'medium' | 'heavy' }
  | { type: 'selection' }
  | { type: 'notification'; style?: 'success' | 'warning' | 'error' };

// ─── Primary Action ─────────────────────────────────────────────────────────

/**
 * Primary action button config.
 * Mirrors WhatsNew.PrimaryAction in WhatsNewKit.
 */
export interface WhatsNewPrimaryAction {
  /** Button title. Default: "Continue" */
  title?: string;
  /** Background color. Default: accentColor */
  backgroundColor?: string;
  /** Foreground/text color. Default: "#000000" */
  foregroundColor?: string;
  /** Optional haptic feedback on press */
  hapticFeedback?: WhatsNewHapticFeedback;
  /** Optional callback on dismiss (in addition to closing the modal) */
  onDismiss?: () => void;
}

// ─── Secondary Action ───────────────────────────────────────────────────────

/**
 * Secondary action (text button below primary).
 * Mirrors WhatsNew.SecondaryAction in WhatsNewKit.
 */
export interface WhatsNewSecondaryAction {
  /** Button title */
  title: string;
  /** Foreground color. Default: accentColor */
  foregroundColor?: string;
  /** Optional haptic feedback on press */
  hapticFeedback?: WhatsNewHapticFeedback;
  /** Action to perform */
  action:
    | { type: 'dismiss' }
    | { type: 'openURL'; url: string }
    | { type: 'custom'; handler: () => void };
}

// ─── Layout ─────────────────────────────────────────────────────────────────

/**
 * Customizable layout/spacing — mirrors WhatsNew.Layout in WhatsNewKit.
 * All values in points. Undefined fields use defaults.
 */
export interface WhatsNewLayout {
  /** Show scroll indicator. Default: false */
  showsScrollViewIndicators?: boolean;
  /** Bottom scroll inset to clear footer. Default: 150 */
  scrollViewBottomContentInset?: number;
  /** Spacing between title and feature list. Default: 60 */
  contentSpacing?: number;
  /** Top content padding. Default: 65 */
  contentPaddingTop?: number;
  /** Feature list row spacing. Default: 25 */
  featureListSpacing?: number;
  /** Feature list left padding. Default: 15 */
  featureListPaddingLeft?: number;
  /** Feature image/icon width. Default: 40 */
  featureImageWidth?: number;
  /** Horizontal spacing between icon and text. Default: 15 */
  featureHorizontalSpacing?: number;
  /** Vertical alignment of icon relative to text. Default: "center" */
  featureHorizontalAlignment?: 'top' | 'center';
  /** Spacing between title and subtitle. Default: 2 */
  featureVerticalSpacing?: number;
  /** Spacing between primary and secondary action. Default: 15 */
  footerActionSpacing?: number;
  /** Primary button corner radius. Default: 14 */
  footerPrimaryActionButtonCornerRadius?: number;
}

// ─── WhatsNew (root model) ──────────────────────────────────────────────────

/**
 * Root WhatsNew object — mirrors the WhatsNew struct in WhatsNewKit.
 * Represents a single version's "What's New" content.
 */
export interface WhatsNew {
  /** The version this What's New belongs to */
  version: WhatsNewVersion;
  /** Modal title. Default: "What's New" */
  title?: string;
  /** Feature items to display */
  features: WhatsNewFeature[];
  /** Primary action button config */
  primaryAction?: WhatsNewPrimaryAction;
  /** Optional secondary action (text link below primary) */
  secondaryAction?: WhatsNewSecondaryAction;
}

// ─── WhatsNew Collection ────────────────────────────────────────────────────

/** Array of WhatsNew objects for multiple versions */
export type WhatsNewCollection = WhatsNew[];

// ─── Version Store ──────────────────────────────────────────────────────────

/**
 * Persistence interface for tracking presented versions.
 * Mirrors WhatsNewVersionStore protocol in WhatsNewKit.
 */
export interface WhatsNewVersionStore {
  /** Save a version as presented */
  save(version: WhatsNewVersion): Promise<void>;
  /** Get all previously presented versions */
  getPresentedVersions(): Promise<WhatsNewVersion[]>;
  /** Check if a specific version has been presented */
  hasPresented(version: WhatsNewVersion): Promise<boolean>;
  /** Remove a specific presented version */
  remove?(version: WhatsNewVersion): Promise<void>;
  /** Remove all presented versions */
  removeAll?(): Promise<void>;
}

// ─── Component Props ────────────────────────────────────────────────────────

/**
 * Props for the WhatsNewView component.
 * Mirrors WhatsNewView.init() in WhatsNewKit.
 */
export interface WhatsNewViewProps {
  /** The WhatsNew content to display */
  whatsNew: WhatsNew;
  /** Optional version store for auto-persistence on dismiss */
  versionStore?: WhatsNewVersionStore;
  /** Layout customization */
  layout?: WhatsNewLayout;
  /** Called when the modal is dismissed */
  onDismiss?: () => void;
}

/**
 * Props for the WhatsNewSheet wrapper (auto-presentation).
 * Mirrors .whatsNewSheet() view modifier in WhatsNewKit.
 */
export interface WhatsNewSheetProps {
  /** WhatsNew to show (null = hidden). Set to null after dismiss. */
  whatsNew: WhatsNew | null;
  /** Optional version store for auto-persistence */
  versionStore?: WhatsNewVersionStore;
  /** Layout customization */
  layout?: WhatsNewLayout;
  /** Called when dismissed */
  onDismiss?: () => void;
  /** Children to render behind the sheet */
  children: React.ReactNode;
}

// ─── Legacy compat (simple props used by whatsNewStore) ─────────────────────

/**
 * Simplified item type matching whatsNewStore.WhatsNewItem.
 * @deprecated Use WhatsNewFeature with image: { type: 'systemName', name } instead.
 */
export interface WhatsNewItem {
  id: string;
  imageName: string;
  title: string;
  description: string;
}
