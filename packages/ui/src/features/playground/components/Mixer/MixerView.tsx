/**
 * MixerView — Matches iOS MixerView.swift exactly
 *
 * All state and actions from useSongContext() — zero callback props.
 *
 * ScrollView { VStack(spacing: 8) { ForEach tracks → TrackStripView } }
 */
import { memo, useCallback } from 'react';
import Slider from '@react-native-community/slider';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import {
  useSongContext,
  useSongActions,
  useTrackMixer,
} from '../../stores/playgroundStore';
import { INSTRUMENT_COLORS } from '../../types';
import { useShallow } from 'zustand/react/shallow';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── Mute Button (32×32, orange when active) ─────────────────────────────────

const MuteButton = memo(function MuteButton({
  isMuted,
  onToggle,
}: {
  isMuted: boolean;
  onToggle?: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withSpring(0.8, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    onToggle?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scale is a Reanimated SharedValue (stable ref)
  }, [onToggle]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      hitSlop={6}
      style={[
        styles.muteBtn,
        { backgroundColor: isMuted ? colors.mcOrange : colors.mcBlack3 },
        animStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Mute track"
      accessibilityState={{ selected: isMuted }}
    >
      <Text
        variant="buttonLabelBold"
        color={isMuted ? colors.mcWhite : colors.mcWhite3}
      >
        M
      </Text>
    </AnimatedPressable>
  );
});

// ── Solo Button (32×32, green when active, spring feedback) ─────────────────

const SoloButton = memo(function SoloButton({
  isSoloed,
  onToggle,
}: {
  isSoloed: boolean;
  onToggle?: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withSpring(0.8, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    onToggle?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scale is a Reanimated SharedValue (stable ref)
  }, [onToggle]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      hitSlop={6}
      style={[
        styles.soloBtn,
        { backgroundColor: isSoloed ? colors.mcGreen : colors.mcBlack3 },
        animStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Solo track"
      accessibilityState={{ selected: isSoloed }}
    >
      <Text
        variant="buttonLabelBold"
        color={isSoloed ? colors.mcWhite : colors.mcWhite3}
      >
        S
      </Text>
    </AnimatedPressable>
  );
});

// ── Track Strip ─────────────────────────────────────────────────────────────

interface TrackStripProps {
  trackId: number;
}

const TrackStrip = memo(function TrackStrip({ trackId }: TrackStripProps) {
  const { colors } = useTheme();

  // Fine-grained selectors — only this track's data
  const track = useSongContext(
    useShallow((s) => s.tracks.find((t) => t.id === trackId))
  );
  const mixer = useTrackMixer(trackId);
  const hasSoloedTracks = useSongContext((s) =>
    s.tracks.some((t) => t.isSoloed)
  );

  // Actions — stable refs, no subscription
  const { setTrackVolume, setTrackPan, toggleTrackMute, toggleTrackSolo } =
    useSongActions();

  if (!track || !mixer) return null;

  const trackColor = INSTRUMENT_COLORS[track.type] || colors.mcWhite;
  const isAudible = !mixer.isMuted && (!hasSoloedTracks || mixer.isSoloed);

  return (
    <View style={[styles.strip, { backgroundColor: colors.mcBlack2 }]}>
      <View style={styles.stripHeader}>
        <View style={styles.trackLabel}>
          <View style={[styles.colorDot, { backgroundColor: trackColor }]} />
          <Text variant="caption" color={colors.mcWhite2} numberOfLines={1}>
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
          <MuteButton
            isMuted={!isAudible}
            onToggle={() => toggleTrackMute(trackId)}
          />
          <SoloButton
            isSoloed={mixer.isSoloed && hasSoloedTracks}
            onToggle={() => toggleTrackSolo(trackId)}
          />
        </View>
      </View>

      <View style={styles.sliderSection}>
        <Text variant="caption" color={colors.mcWhite2}>
          Volume
        </Text>
        <View style={styles.sliderRow}>
          <Icon icon={Icons.speaker} size={14} color={colors.mcWhite3} />
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            value={mixer.volume}
            minimumTrackTintColor={isAudible ? trackColor : colors.mcBlack3}
            maximumTrackTintColor={colors.mcBlack3}
            thumbTintColor={colors.mcWhite}
            onSlidingComplete={(v: number) => setTrackVolume(trackId, v)}
          />
          <Text
            variant="buttonLabelSemiBold"
            color={colors.mcWhite}
            style={styles.sliderValue}
          >
            {Math.round(mixer.volume)}%
          </Text>
        </View>
      </View>

      <View style={styles.sliderSection}>
        <Text variant="caption" color={colors.mcWhite2}>
          Pan
        </Text>
        <View style={styles.sliderRow}>
          <Icon icon={Icons.panArrows} size={14} color={colors.mcWhite3} />
          <Slider
            style={styles.slider}
            minimumValue={-1}
            maximumValue={1}
            value={mixer.pan}
            minimumTrackTintColor={colors.mcWhite2}
            maximumTrackTintColor={colors.mcWhite2}
            thumbTintColor={colors.mcWhite}
            onSlidingComplete={(v: number) => setTrackPan(trackId, v)}
          />
          <Text
            variant="buttonLabelSemiBold"
            color={colors.mcWhite2}
            style={styles.panLabel}
          >
            {Math.abs(mixer.pan) < 0.1 ? 'C' : mixer.pan < 0 ? 'L' : 'R'}
          </Text>
        </View>
      </View>
    </View>
  );
});

// ── MixerView ───────────────────────────────────────────────────────────────

export interface MixerViewProps {}

export const MixerView = memo(function MixerView({}: MixerViewProps) {
  const { colors } = useTheme();
  const trackIds = useSongContext(useShallow((s) => s.tracks.map((t) => t.id)));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.mcBlack }]}
      contentContainerStyle={styles.scrollContent}
    >
      {trackIds.map((id) => (
        <TrackStrip key={id} trackId={id} />
      ))}
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
  slider: { flex: 1, height: 36 },
  sliderValue: { width: 36, textAlign: 'right' },
  panLabel: { width: 20, textAlign: 'right' },
});
