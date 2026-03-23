/**
 * MixerView — Matches iOS MixerView.swift exactly
 *
 * ScrollView { VStack(spacing: 8) { ForEach tracks → TrackStripView } }
 * .frame(maxWidth: 800), .padding(), .background(.mcBlack)
 */
import { memo } from 'react';
import Slider from '@react-native-community/slider';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import type { Track, MixerCallbacks } from '../../types';
import { INSTRUMENT_COLORS } from '../../types';

// ── Mute Button (32×32, orange when active) ─────────────────────────────────

const MuteButton = memo(function MuteButton({
  isMuted,
  onToggle,
}: {
  isMuted: boolean;
  onToggle?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.muteBtn,
        { backgroundColor: isMuted ? colors.mcOrange : colors.mcBlack3 },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Mute"
      accessibilityState={{ selected: isMuted }}
    >
      <Text
        variant="buttonLabelBold"
        color={isMuted ? colors.mcWhite : colors.mcWhite3}
      >
        M
      </Text>
    </Pressable>
  );
});

// ── Solo Button (32×32, green when active) ──────────────────────────────────

const SoloButton = memo(function SoloButton({
  isSoloed,
  onToggle,
}: {
  isSoloed: boolean;
  onToggle?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.soloBtn,
        { backgroundColor: isSoloed ? colors.mcGreen : colors.mcBlack3 },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Solo"
      accessibilityState={{ selected: isSoloed }}
    >
      <Text
        variant="buttonLabelBold"
        color={isSoloed ? colors.mcWhite : colors.mcWhite3}
      >
        S
      </Text>
    </Pressable>
  );
});

// ── Track Strip ─────────────────────────────────────────────────────────────

interface TrackStripProps {
  track: Track;
  isAudible: boolean;
  hasSoloedTracks: boolean;
  onVolumeChange?: (volume: number) => void;
  onPanChange?: (pan: number) => void;
  onMuteToggle?: () => void;
  onSoloToggle?: () => void;
}

const TrackStrip = memo(function TrackStrip({
  track,
  isAudible,
  hasSoloedTracks,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
}: TrackStripProps) {
  const { colors } = useTheme();
  const trackColor = INSTRUMENT_COLORS[track.type] || colors.mcWhite;
  const muteActive = !isAudible;
  const soloActive = track.isSoloed && hasSoloedTracks;

  return (
    <View style={[styles.strip, { backgroundColor: colors.mcBlack2 }]}>
      <View style={styles.stripHeader}>
        <View style={styles.trackLabel}>
          <View style={[styles.colorDot, { backgroundColor: trackColor }]} />
          <Text
            variant="small"
            color={colors.mcWhite2}
            numberOfLines={1}
            style={{ fontSize: 11, fontWeight: '500' }}
          >
            {track.type === 'drum'
              ? 'Drums'
              : track.type === 'melodic'
                ? 'Melodic'
                : track.type === 'bass'
                  ? 'Bass'
                  : track.title}
          </Text>
        </View>
        <View style={styles.mutesoloRow}>
          <MuteButton isMuted={muteActive} onToggle={onMuteToggle} />
          <SoloButton isSoloed={soloActive} onToggle={onSoloToggle} />
        </View>
      </View>

      <View style={styles.sliderSection}>
        <Text
          variant="small"
          color={colors.mcWhite2}
          style={{ fontSize: 11, fontWeight: '500' }}
        >
          Volume
        </Text>
        <View style={styles.sliderRow}>
          <Icon icon={Icons.speaker} size={14} color={colors.mcWhite3} />
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            value={track.volume}
            minimumTrackTintColor={isAudible ? trackColor : colors.mcBlack3}
            maximumTrackTintColor={colors.mcBlack3}
            thumbTintColor={colors.mcWhite}
            onSlidingComplete={(v: number) => onVolumeChange?.(v)}
          />
          <Text
            variant="buttonLabelSemiBold"
            color={colors.mcWhite}
            style={styles.sliderValue}
          >
            {Math.round(track.volume)}%
          </Text>
        </View>
      </View>

      <View style={styles.sliderSection}>
        <Text
          variant="small"
          color={colors.mcWhite2}
          style={{ fontSize: 11, fontWeight: '500' }}
        >
          Pan
        </Text>
        <View style={styles.sliderRow}>
          <Icon icon={Icons.panArrows} size={14} color={colors.mcWhite3} />
          <Slider
            style={styles.slider}
            minimumValue={-1}
            maximumValue={1}
            value={track.pan}
            minimumTrackTintColor={colors.mcWhite2}
            maximumTrackTintColor={colors.mcWhite2}
            thumbTintColor={colors.mcWhite}
            onSlidingComplete={(v: number) => onPanChange?.(v)}
          />
          <Text
            variant="buttonLabelSemiBold"
            color={colors.mcWhite2}
            style={styles.panLabel}
          >
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

export const MixerView = memo(function MixerView({
  tracks,
  callbacks,
}: MixerViewProps) {
  const { colors } = useTheme();
  const hasSoloedTracks = tracks.some((t) => t.isSoloed);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.mcBlack }]}
      contentContainerStyle={styles.scrollContent}
    >
      {tracks.map((track) => {
        const isAudible =
          !track.isMuted && (!hasSoloedTracks || track.isSoloed);
        return (
          <TrackStrip
            key={track.id}
            track={track}
            isAudible={isAudible}
            hasSoloedTracks={hasSoloedTracks}
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
  container: { flex: 1 },
  scrollContent: {
    padding: 16,
    gap: 8,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },

  strip: {
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  stripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  mutesoloRow: { flexDirection: 'row', gap: 8 },
  muteBtn: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soloBtn: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sliderSection: { gap: 4 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  slider: { flex: 1, height: 36 },
  sliderValue: { width: 36, textAlign: 'right' },

  panIndicator: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
  },
  panLabel: { width: 20, textAlign: 'right' },
});
