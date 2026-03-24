/**
 * SongToolbar — Transport controls bar
 *
 * All state and actions from useSongContext() — zero callback props.
 *
 * Layout (from Swift):
 *   HStack { back, Spacer, HStack(spacing:8) { play/pause, loop, metronome }, Spacer, settings }
 */
import { memo, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import { makeSpacing } from '../../../../theme/spacing';
import { useSongContext, useSongActions } from '../../stores/playgroundStore';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Props ──────────────────────────────────────────────────────────────────

export interface SongToolbarProps {
  /** Called when the back button is pressed (navigation is outside store scope) */
  onBack?: () => void;
  /** Container style override */
  style?: StyleProp<ViewStyle>;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const SongToolbar: React.FC<SongToolbarProps> = memo(
  function SongToolbar({ onBack, style }) {
    const { colors } = useTheme();

    // State — fine-grained selectors, re-render only when these change
    const isPlaying = useSongContext(s => s.isPlaying);
    const isLoopEnabled = useSongContext(s => s.isLoopEnabled);
    const isMetronomeEnabled = useSongContext(s => s.isMetronomeEnabled);

    // Actions — stable refs, no subscription (getState)
    const { setPlaying, toggleLoop, toggleMetronome, setCurrentTab } = useSongActions();

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
    }, [isPlaying, setPlaying]);

    const handleToggleLoop = useCallback(() => {
      bounce(loopScale);
      toggleLoop();
    }, [toggleLoop]);

    const handleToggleMetronome = useCallback(() => {
      bounce(metroScale);
      toggleMetronome();
    }, [toggleMetronome]);

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
        testID="song-toolbar"
      >
        {/* Back button */}
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={[styles.backButton, { backgroundColor: colors.mcBlack3 }]}
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
            accessibilityState={{ selected: isPlaying }}
            style={[styles.transportButton, playStyle]}
            testID="transport-play-pause"
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
            accessibilityState={{ selected: isLoopEnabled }}
            style={[styles.transportButton, loopStyle]}
            testID="transport-loop"
          >
            <Icon icon={Icons.loop} size={22} color={loopColor} />
          </AnimatedPressable>

          {/* Metronome — bounce on tap */}
          <AnimatedPressable
            onPress={handleToggleMetronome}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Metronome"
            accessibilityState={{ selected: isMetronomeEnabled }}
            style={[styles.transportButton, metroStyle]}
            testID="transport-metronome"
          >
            <Icon
              icon={isMetronomeEnabled ? Icons.metronomeOn : Icons.metronomeOff}
              size={22}
              color={colors.mcWhite}
            />
          </AnimatedPressable>
        </View>

        {/* Right spacer + Settings gear */}
        <View style={styles.spacer}>
          <Pressable
            onPress={handleSettings}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            style={({ pressed }) => [
              styles.settingsButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            testID="transport-settings"
          >
            <Icon icon={Icons.settings} size={22} color={colors.mcWhite} />
          </Pressable>
        </View>
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
});

export default SongToolbar;
