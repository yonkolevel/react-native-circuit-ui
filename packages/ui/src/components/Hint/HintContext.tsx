/**
 * HintContext — supplies guided-tour hint state to WithHint wrappers.
 *
 * Mirrors the iOS `@EnvironmentObject HintsManager` used by WithHintView.swift:
 * components declare a hint anchor via <WithHint hintID="…">, and this context
 * tells them which anchor is currently active and what tip to show.
 *
 * The consuming app (midicircuit-rn) provides the value, wired to its
 * HintsManager store. With no provider present (iOS native tour, tests) the
 * default value renders no hints — a safe no-op.
 */
import { createContext, useContext } from 'react';

export interface HintContextValue {
  /** IDs of hint anchors that should currently show the bubble. */
  activeHintIDs: ReadonlySet<string>;
  /** Tip text for the active hint, shown in the tooltip. */
  tip: string | null;
}

const EMPTY_IDS: ReadonlySet<string> = new Set();

const defaultValue: HintContextValue = {
  activeHintIDs: EMPTY_IDS,
  tip: null,
};

export const HintContext = createContext<HintContextValue>(defaultValue);

export const useHintContext = (): HintContextValue => useContext(HintContext);

export const HintProvider = HintContext.Provider;

/** Stable hint anchor IDs, matched 1:1 with the app's A11y identifiers. */
export const HintIDs = {
  playButton: 'playButton',
  firstClipView: 'firstClipView',
  pianoRoll: 'pianoRoll',
} as const;
