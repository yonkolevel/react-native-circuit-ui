/**
 * MixerView — ScrollView of TrackStrips
 *
 * Matches SwiftUI MixerView:
 * - ScrollView { VStack(spacing:8) { ForEach tracks } }
 * - frame(maxWidth: 800), padding()
 *
 * Audibility logic (from Swift):
 * - muted → false
 * - hasSoloed && !soloed → false
 * - else → true
 */
import { memo, useCallback, useMemo } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import type { TrackState, MixerCallbacks } from '../../types';
import { TrackStrip } from './TrackStrip';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MixerViewProps {
  /** Array of track states */
  tracks: TrackState[];
  /** Mixer event callbacks */
  callbacks?: MixerCallbacks;
  /** Test ID for testing */
  testID?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isTrackAudible(track: TrackState, hasSoloed: boolean): boolean {
  if (track.isMuted) return false;
  if (hasSoloed && !track.isSoloed) return false;
  return true;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const MixerView: React.FC<MixerViewProps> = memo(
  function MixerView({ tracks, callbacks, testID = 'mixer-view' }) {
    const hasSoloed = useMemo(
      () => tracks.some((t) => t.isSoloed),
      [tracks]
    );

    const handleVolumeChange = useCallback(
      (trackId: number, volume: number) => {
        callbacks?.onVolumeChange?.(trackId, volume);
      },
      [callbacks]
    );

    const handlePanChange = useCallback(
      (trackId: number, pan: number) => {
        callbacks?.onPanChange?.(trackId, pan);
      },
      [callbacks]
    );

    const handleMuteToggle = useCallback(
      (trackId: number) => {
        callbacks?.onMuteToggle?.(trackId);
      },
      [callbacks]
    );

    const handleSoloToggle = useCallback(
      (trackId: number) => {
        callbacks?.onSoloToggle?.(trackId);
      },
      [callbacks]
    );

    return (
      <ScrollView
        testID={testID}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {tracks.map((track) => (
            <TrackStrip
              key={track.id}
              track={track}
              isAudible={isTrackAudible(track, hasSoloed)}
              onVolumeChange={handleVolumeChange}
              onPanChange={handlePanChange}
              onMuteToggle={handleMuteToggle}
              onSoloToggle={handleSoloToggle}
              testID={`track-strip-${track.id}`}
            />
          ))}
        </View>
      </ScrollView>
    );
  }
);

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  inner: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    gap: 8,
  },
});

export default MixerView;
