/**
 * SongToolbar — Transport controls bar
 *
 * All state and actions from useSongContext() — zero callback props.
 *
 * Layout (from Swift):
 *   HStack { back, Spacer, HStack(spacing:8) { play/pause, loop, metronome }, Spacer, settings }
 */
import { memo, useCallback, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import { makeSpacing } from '../../../../theme/spacing';
import { useSongContext, useSongActions } from '../../stores/playgroundStore';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Props ──────────────────────────────────────────────────────────────────

export interface SongToolbarTestIDs {
  container?: string;
  playButton?: string;
  loopButton?: string;
  metronomeButton?: string;
  backButton?: string;
  settingsButton?: string;
  bpmButton?: string;
}

export interface SongToolbarProps {
  /** Called when the back button is pressed (navigation is outside store scope) */
  onBack?: () => void;
  /** Container style override */
  style?: StyleProp<ViewStyle>;
  /** Override testID for sub-elements */
  testIDs?: SongToolbarTestIDs;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const SongToolbar: React.FC<SongToolbarProps> = memo(
  function SongToolbar({ onBack, style, testIDs }) {
    const { colors } = useTheme();

    // State — fine-grained selectors, re-render only when these change
    const isPlaying = useSongContext((s) => s.isPlaying);
    const isLoopEnabled = useSongContext((s) => s.isLoopEnabled);
    const isMetronomeEnabled = useSongContext((s) => s.isMetronomeEnabled);
    const tempo = useSongContext((s) => s.tempo);

    // Actions — stable refs, no subscription (getState)
    const { setPlaying, toggleLoop, toggleMetronome, setCurrentTab, setTempo } =
      useSongActions();

    // BPM editor modal
    const [showBpmEditor, setShowBpmEditor] = useState(false);

    // ─── Press-scale animation (matches iOS button feedback) ────────
    const playScale = useSharedValue(1);
    const loopScale = useSharedValue(1);
    const metroScale = useSharedValue(1);

    const bounce = (sv: { value: number }) => {
      sv.value = withSequence(
        withSpring(0.85, { damping: 15, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    };

    const playStyle = useAnimatedStyle(() => ({
      transform: [{ scale: playScale.value }],
    }));
    const loopStyle = useAnimatedStyle(() => ({
      transform: [{ scale: loopScale.value }],
    }));
    const metroStyle = useAnimatedStyle(() => ({
      transform: [{ scale: metroScale.value }],
    }));

    // ─── Handlers ───────────────────────────────────────────────────

    const handlePlayPause = useCallback(() => {
      bounce(playScale);
      setPlaying(!isPlaying);
    }, [isPlaying, setPlaying, playScale]);

    const handleToggleLoop = useCallback(() => {
      bounce(loopScale);
      toggleLoop();
    }, [toggleLoop, loopScale]);

    const handleToggleMetronome = useCallback(() => {
      bounce(metroScale);
      toggleMetronome();
    }, [toggleMetronome, metroScale]);

    const handleSettings = useCallback(() => {
      setCurrentTab('settings');
    }, [setCurrentTab]);

    // ─── Colors ─────────────────────────────────────────────────────

    const loopColor = isLoopEnabled ? colors.mcGreen : colors.mcWhite;

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.mcBlack, borderBottomColor: 'transparent' },
          style,
        ]}
        accessibilityRole="toolbar"
        accessibilityLabel="Song toolbar"
        testID={testIDs?.container ?? 'song-toolbar'}
      >
        {/* Back button */}
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityHint="Return to previous screen"
          style={[styles.backButton, { backgroundColor: colors.mcBlack3 }]}
          testID={testIDs?.backButton}
        >
          <Icon icon={Icons.back} size={22} color={colors.mcWhite} />
        </Pressable>

        <View style={styles.spacer} />

        {/* Transport Controls — centered */}
        <View style={styles.transportGroup}>
          {/* Play / Pause — bounce on tap */}
          <AnimatedPressable
            onPress={handlePlayPause}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            accessibilityHint="Toggle playback"
            accessibilityState={{ selected: isPlaying }}
            style={[styles.transportButton, playStyle]}
            testID={testIDs?.playButton ?? 'transport-play-pause'}
          >
            {isPlaying ? (
              <Icon icon={Icons.pause} size={22} color={colors.mcWhite} />
            ) : (
              <Icon icon={Icons.play} size={22} color={colors.mcWhite} />
            )}
          </AnimatedPressable>

          {/* Loop — bounce on tap */}
          <AnimatedPressable
            onPress={handleToggleLoop}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Loop"
            accessibilityHint="Toggle loop"
            accessibilityState={{ selected: isLoopEnabled }}
            style={[styles.transportButton, loopStyle]}
            testID={testIDs?.loopButton ?? 'transport-loop'}
          >
            <Icon icon={Icons.loop} size={22} color={loopColor} />
          </AnimatedPressable>

          {/* Metronome — bounce on tap */}
          <AnimatedPressable
            onPress={handleToggleMetronome}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Metronome"
            accessibilityHint="Toggle metronome"
            accessibilityState={{ selected: isMetronomeEnabled }}
            style={[styles.transportButton, metroStyle]}
            testID={testIDs?.metronomeButton ?? 'transport-metronome'}
          >
            <Icon
              icon={isMetronomeEnabled ? Icons.metronomeOn : Icons.metronomeOff}
              size={22}
              color={colors.mcWhite}
            />
          </AnimatedPressable>
        </View>

        {/* BPM display — tappable */}
        <Pressable
          onPress={() => setShowBpmEditor(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${Math.round(tempo)} BPM`}
          accessibilityHint="Adjust tempo"
          style={styles.bpmButton}
          testID={testIDs?.bpmButton ?? 'transport-bpm'}
        >
          <Text style={[styles.bpmText, { color: colors.mcWhite }]}>
            {Math.round(tempo)}
          </Text>
        </Pressable>

        {/* Right spacer + Settings gear */}
        <View style={styles.spacer}>
          <Pressable
            onPress={handleSettings}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            accessibilityHint="Open song settings"
            style={({ pressed }) => [
              styles.settingsButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            testID={testIDs?.settingsButton ?? 'transport-settings'}
          >
            <Icon icon={Icons.settings} size={22} color={colors.mcWhite} />
          </Pressable>
        </View>

        {/* BPM Editor Modal */}
        {showBpmEditor && (
          <Modal
            transparent
            animationType="fade"
            onRequestClose={() => setShowBpmEditor(false)}
          >
            <Pressable
              style={styles.bpmModalOverlay}
              onPress={() => setShowBpmEditor(false)}
            >
              <Pressable
                style={[
                  styles.bpmModalContent,
                  { backgroundColor: colors.mcBlack3 },
                ]}
                onPress={() => {}}
              >
                <Text style={[styles.bpmModalTitle, { color: colors.mcWhite }]}>
                  Tempo
                </Text>
                <Text
                  style={[styles.bpmModalValue, { color: colors.mcOrange }]}
                >
                  {Math.round(tempo)} BPM
                </Text>
                <View style={styles.bpmModalButtons}>
                  <TouchableOpacity
                    onPress={() => setTempo(Math.max(40, tempo - 5))}
                    style={styles.bpmAdjust}
                    accessibilityLabel="Decrease tempo"
                  >
                    <Text
                      style={[styles.bpmAdjustText, { color: colors.mcWhite }]}
                    >
                      − 5
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTempo(Math.max(40, tempo - 1))}
                    style={styles.bpmAdjust}
                    accessibilityLabel="Decrease tempo by 1"
                  >
                    <Text
                      style={[styles.bpmAdjustText, { color: colors.mcWhite }]}
                    >
                      − 1
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTempo(Math.min(300, tempo + 1))}
                    style={styles.bpmAdjust}
                    accessibilityLabel="Increase tempo by 1"
                  >
                    <Text
                      style={[styles.bpmAdjustText, { color: colors.mcWhite }]}
                    >
                      + 1
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTempo(Math.min(300, tempo + 5))}
                    style={styles.bpmAdjust}
                    accessibilityLabel="Increase tempo"
                  >
                    <Text
                      style={[styles.bpmAdjustText, { color: colors.mcWhite }]}
                    >
                      + 5
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => setShowBpmEditor(false)}
                  style={styles.bpmDone}
                  accessibilityLabel="Close tempo editor"
                >
                  <Text
                    style={{
                      color: colors.mcOrange,
                      fontWeight: '600',
                      fontSize: 16,
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>
        )}
      </View>
    );
  }
);

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: makeSpacing(3),
    paddingVertical: makeSpacing(2),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  spacer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  transportGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: makeSpacing(2),
  },
  transportButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: makeSpacing(1),
  },
  settingsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: makeSpacing(1),
  },
  // BPM
  bpmButton: {
    paddingHorizontal: makeSpacing(2),
    paddingVertical: makeSpacing(1),
    marginLeft: makeSpacing(2),
  },
  bpmText: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  // BPM Modal
  bpmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bpmModalContent: {
    borderRadius: 12,
    padding: 24,
    minWidth: 260,
    alignItems: 'center',
    gap: 16,
  },
  bpmModalTitle: { fontSize: 16, fontWeight: '600' },
  bpmModalValue: {
    fontSize: 40,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  bpmModalButtons: { flexDirection: 'row', gap: 12 },
  bpmAdjust: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bpmAdjustText: { fontSize: 14, fontWeight: '600' },
  bpmDone: { paddingVertical: 8, paddingHorizontal: 24 },
});

export default SongToolbar;
