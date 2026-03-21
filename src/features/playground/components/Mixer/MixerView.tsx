/**
 * MixerView — Matches iOS MixerView.swift exactly
 *
 * ScrollView { VStack(spacing: 8) { ForEach tracks → TrackStripView } }
 * .frame(maxWidth: 800), .padding(), .background(.mcBlack)
 */
import { memo } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import type { Track, MixerCallbacks } from '../../types';
import { INSTRUMENT_COLORS } from '../../types';

// ── Mute Button (32×32, orange when active) ─────────────────────────────────

const MuteButton = memo(function MuteButton({ isMuted, onToggle }: { isMuted: boolean; onToggle?: () => void }) {
  return (
    <Pressable onPress={onToggle} style={[styles.muteBtn, { backgroundColor: isMuted ? '#FF5C24' : '#333333' }]}
      accessibilityRole="button" accessibilityLabel="Mute" accessibilityState={{ selected: isMuted }}>
      <Text variant="buttonLabelBold" color={isMuted ? '#FFFFFF' : '#666666'}>M</Text>
    </Pressable>
  );
});

// ── Solo Button (32×32, green when active) ──────────────────────────────────

const SoloButton = memo(function SoloButton({ isSoloed, onToggle }: { isSoloed: boolean; onToggle?: () => void }) {
  return (
    <Pressable onPress={onToggle} style={[styles.soloBtn, { backgroundColor: isSoloed ? '#00FF9E' : '#333333' }]}
      accessibilityRole="button" accessibilityLabel="Solo" accessibilityState={{ selected: isSoloed }}>
      <Text variant="buttonLabelBold" color={isSoloed ? '#FFFFFF' : '#666666'}>S</Text>
    </Pressable>
  );
});

// ── Track Strip ─────────────────────────────────────────────────────────────

interface TrackStripProps {
  track: Track;
  isAudible: boolean;
  onVolumeChange?: (volume: number) => void;
  onPanChange?: (pan: number) => void;
  onMuteToggle?: () => void;
  onSoloToggle?: () => void;
}

const TrackStrip = memo(function TrackStrip({
  track, isAudible, onVolumeChange: _onVolumeChange, onPanChange: _onPanChange, onMuteToggle, onSoloToggle,
}: TrackStripProps) {
  const trackColor = INSTRUMENT_COLORS[track.type] || '#FFFFFF';

  return (
    <View style={styles.strip}>
      {/* Header: label + M/S buttons */}
      <View style={styles.stripHeader}>
        <View style={styles.trackLabel}>
          <View style={[styles.colorDot, { backgroundColor: trackColor }]} />
          <Text variant="small" color="#888888" numberOfLines={1}>
            {track.title}
          </Text>
        </View>
        <View style={styles.mutesoloRow}>
          <MuteButton isMuted={track.isMuted} onToggle={onMuteToggle} />
          <SoloButton isSoloed={track.isSoloed} onToggle={onSoloToggle} />
        </View>
      </View>

      {/* Volume */}
      <View style={styles.sliderSection}>
        <Text variant="extraSmall" color="#888888">Volume</Text>
        <View style={styles.sliderRow}>
          <Icon icon={Icons.speaker} size={14} color="#666666" />
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, {
              width: `${track.volume}%`,
              backgroundColor: isAudible ? trackColor : '#333333',
            }]} />
          </View>
          <Text variant="buttonLabelSemiBold" color="#FFFFFF" style={styles.sliderValue}>
            {Math.round(track.volume)}%
          </Text>
        </View>
      </View>

      {/* Pan */}
      <View style={styles.sliderSection}>
        <Text variant="extraSmall" color="#888888">Pan</Text>
        <View style={styles.sliderRow}>
          <Text variant="extraSmall" color="#666666">↔</Text>
          <View style={styles.sliderTrack}>
            <View style={[styles.panIndicator, {
              left: `${((track.pan + 1) / 2) * 100}%`,
            }]} />
          </View>
          <Text variant="buttonLabelSemiBold" color="#888888" style={styles.panLabel}>
            {Math.abs(track.pan) < 0.1 ? 'C' : track.pan < 0 ? 'L' : 'R'}
          </Text>
        </View>
      </View>
    </View>
  );
});

// ── MixerView ───────────────────────────────────────────────────────────────

export interface MixerViewProps {
  tracks: Track[];
  callbacks?: MixerCallbacks;
}

export const MixerView = memo(function MixerView({ tracks, callbacks }: MixerViewProps) {
  const hasSoloedTracks = tracks.some(t => t.isSoloed);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {tracks.map(track => {
        const isAudible = !track.isMuted && (!hasSoloedTracks || track.isSoloed);
        return (
          <TrackStrip
            key={track.id}
            track={track}
            isAudible={isAudible}
            onVolumeChange={(v) => callbacks?.onVolumeChange?.(track.id, v)}
            onPanChange={(p) => callbacks?.onPanChange?.(track.id, p)}
            onMuteToggle={() => callbacks?.onMuteToggle?.(track.id)}
            onSoloToggle={() => callbacks?.onSoloToggle?.(track.id)}
          />
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 16, gap: 8, maxWidth: 800, alignSelf: 'center', width: '100%' },

  strip: {
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    gap: 12,
  },
  stripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  mutesoloRow: { flexDirection: 'row', gap: 8 },
  muteBtn: { width: 32, height: 32, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  soloBtn: { width: 32, height: 32, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },

  sliderSection: { gap: 4 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderTrack: { flex: 1, height: 4, backgroundColor: '#333333', borderRadius: 2, position: 'relative' },
  sliderFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 2 },
  sliderValue: { width: 36, textAlign: 'right' },

  panIndicator: { position: 'absolute', top: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#888888', marginLeft: -6 },
  panLabel: { width: 20, textAlign: 'right' },
});
