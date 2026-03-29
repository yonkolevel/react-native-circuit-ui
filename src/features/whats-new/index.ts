/**
 * react-native-whats-new-kit
 *
 * A full port of WhatsNewKit (SvenTiigi) for React Native.
 * Version-aware "What's New" modals with persistence, layout config,
 * haptic feedback, and auto-presentation.
 */

// ─── Components ─────────────────────────────────────────────────────────────
export { WhatsNewView } from './components/WhatsNewView';
export { WhatsNewSheet } from './components/WhatsNewSheet';
export { WhatsNewModal } from './components/WhatsNewModal';
export type { WhatsNewModalProps } from './components/WhatsNewModal';

// ─── Hooks ──────────────────────────────────────────────────────────────────
export { useWhatsNew } from './hooks/useWhatsNew';

// ─── Models ─────────────────────────────────────────────────────────────────
export {
  parseVersion,
  formatVersion,
  createVersion,
  compareVersions,
  versionsEqual,
  currentVersion,
} from './models/WhatsNewVersion';

export { DEFAULT_LAYOUT, resolveLayout } from './models/WhatsNewLayout';

export {
  sortByVersionDescending,
  findUnpresented,
  filterUnpresented,
} from './models/WhatsNewCollection';

// ─── Store ──────────────────────────────────────────────────────────────────
export {
  createAsyncStorageVersionStore,
  createInMemoryVersionStore,
} from './store/AsyncStorageVersionStore';
export type { AsyncStorageLike } from './store/AsyncStorageVersionStore';

// ─── Utils ──────────────────────────────────────────────────────────────────
export { fireHaptic } from './utils/haptics';

// ─── Types ──────────────────────────────────────────────────────────────────
export type {
  WhatsNew,
  WhatsNewVersion,
  WhatsNewFeature,
  WhatsNewFeatureImage,
  WhatsNewPrimaryAction,
  WhatsNewSecondaryAction,
  WhatsNewHapticFeedback,
  WhatsNewLayout,
  WhatsNewCollection,
  WhatsNewVersionStore,
  WhatsNewViewProps,
  WhatsNewSheetProps,
  WhatsNewItem,
} from './types';
