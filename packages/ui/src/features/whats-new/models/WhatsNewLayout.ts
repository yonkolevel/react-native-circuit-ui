/**
 * Default layout values — mirrors WhatsNew.Layout.default in WhatsNewKit.
 */
import type { WhatsNewLayout } from '../types';

/** Default layout matching WhatsNewKit's Layout.init() defaults */
export const DEFAULT_LAYOUT: Required<WhatsNewLayout> = {
  showsScrollViewIndicators: false,
  scrollViewBottomContentInset: 150,
  contentSpacing: 60,
  contentPaddingTop: 65,
  featureListSpacing: 25,
  featureListPaddingLeft: 15,
  featureImageWidth: 40,
  featureHorizontalSpacing: 15,
  featureHorizontalAlignment: 'center',
  featureVerticalSpacing: 2,
  footerActionSpacing: 15,
  footerPrimaryActionButtonCornerRadius: 14,
};

/**
 * Resolve a partial layout config into a complete one using defaults.
 */
export function resolveLayout(
  partial?: WhatsNewLayout
): Required<WhatsNewLayout> {
  if (!partial) return DEFAULT_LAYOUT;
  return { ...DEFAULT_LAYOUT, ...partial };
}
