/**
 * Mixer — Compound component exports
 *
 * Usage:
 * ```tsx
 * <Mixer.View tracks={tracks} callbacks={callbacks} />
 * <Mixer.TrackStrip track={track} isAudible={true} />
 * <Mixer.MuteButton isMuted={false} onPress={toggle} />
 * <Mixer.SoloButton isSoloed={true} onPress={toggle} />
 * <Mixer.TrackLabel color="#1AFFA8" name="Drums" />
 * <Mixer.VolumeFader value={90} trackColor="#1AFFA8" isAudible />
 * <Mixer.PanControl value={0} />
 * ```
 */
export { MuteButton } from './MuteButton';
export type { MuteButtonProps } from './MuteButton';

export { SoloButton } from './SoloButton';
export type { SoloButtonProps } from './SoloButton';

export { TrackLabel } from './TrackLabel';
export type { TrackLabelProps } from './TrackLabel';

export { VolumeFader } from './VolumeFader';
export type { VolumeFaderProps } from './VolumeFader';

export { PanControl } from './PanControl';
export type { PanControlProps } from './PanControl';

export { TrackStrip } from './TrackStrip';
export type { TrackStripProps } from './TrackStrip';

export { MixerView } from './MixerView';
export type { MixerViewProps } from './MixerView';

// ─── Compound namespace ─────────────────────────────────────────────────────

import { MuteButton } from './MuteButton';
import { SoloButton } from './SoloButton';
import { TrackLabel } from './TrackLabel';
import { VolumeFader } from './VolumeFader';
import { PanControl } from './PanControl';
import { TrackStrip } from './TrackStrip';
import { MixerView } from './MixerView';

export const Mixer = {
  View: MixerView,
  TrackStrip,
  MuteButton,
  SoloButton,
  TrackLabel,
  VolumeFader,
  PanControl,
} as const;
