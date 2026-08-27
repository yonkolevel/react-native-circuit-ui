import { createContext, useContext, useMemo, type ReactNode } from 'react';

export type EditorCapability =
  | 'transport'
  | 'recording'
  | 'tempo'
  | 'loop'
  | 'metronome'
  | 'arrangement'
  | 'notes'
  | 'precision'
  | 'velocity'
  | 'quantize'
  | 'liveRecording'
  | 'mixer'
  | 'sections'
  | 'clips'
  | 'tracks'
  | 'sound'
  | 'undoRedo'
  | 'export';

export interface EditorPolicy {
  /** Locks every musical mutation. Playback remains separately controllable. */
  readOnly?: boolean;
  /** Hides editor transport chrome when an external control owns playback. */
  hideTransport?: boolean;
  /** Omitted capabilities are allowed, preserving the standalone editor. */
  capabilities?: Readonly<Partial<Record<EditorCapability, boolean>>>;
}

export interface PianoRollTarget {
  noteNumber: number;
  position: number;
  duration?: number;
}

export interface PianoRollGuidance {
  /** Exact authored MIDI note numbers. Drum values map through sample note numbers. */
  focusedNoteNumbers?: readonly number[];
  targets?: readonly PianoRollTarget[];
  focusColor?: string;
  targetColor?: string;
}

export const DEFAULT_EDITOR_POLICY: Readonly<EditorPolicy> = Object.freeze({});

const READ_ONLY_CAPABILITIES = new Set<EditorCapability>(['transport']);

export function mergeEditorPolicies(
  inherited: EditorPolicy | undefined,
  override: EditorPolicy | undefined
): EditorPolicy {
  if (!override) return inherited ?? DEFAULT_EDITOR_POLICY;
  if (!inherited || inherited === DEFAULT_EDITOR_POLICY) return override;

  const capabilities = {
    ...inherited.capabilities,
    ...override.capabilities,
  };
  for (const [capability, allowed] of Object.entries(
    inherited.capabilities ?? {}
  )) {
    if (allowed === false) capabilities[capability as EditorCapability] = false;
  }
  return {
    readOnly: inherited.readOnly === true || override.readOnly === true,
    hideTransport:
      inherited.hideTransport === true || override.hideTransport === true,
    capabilities,
  };
}

export function isEditorCapabilityAllowed(
  policy: EditorPolicy | undefined,
  capability: EditorCapability
): boolean {
  if (policy?.capabilities?.[capability] === false) return false;
  if (policy?.readOnly && !READ_ONLY_CAPABILITIES.has(capability)) return false;
  return true;
}

const EditorPolicyContext = createContext<EditorPolicy>(DEFAULT_EDITOR_POLICY);

export function EditorPolicyProvider({
  policy,
  children,
}: {
  policy?: EditorPolicy;
  children: ReactNode;
}) {
  return (
    <EditorPolicyContext.Provider value={policy ?? DEFAULT_EDITOR_POLICY}>
      {children}
    </EditorPolicyContext.Provider>
  );
}

export function useEditorPolicy(): EditorPolicy {
  return useContext(EditorPolicyContext);
}

export function useResolvedEditorPolicy(override?: EditorPolicy): EditorPolicy {
  const inherited = useEditorPolicy();
  return useMemo(
    () => mergeEditorPolicies(inherited, override),
    [inherited, override]
  );
}

export function useEditorCapability(capability: EditorCapability): boolean {
  return isEditorCapabilityAllowed(useEditorPolicy(), capability);
}
