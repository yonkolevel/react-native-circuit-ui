/**
 * SongToolbar — Transport controls bar
 *
 * Matches Swift SongToolbarView which provides:
 * - Play/Pause toggle (centered)
 * - Loop toggle (green when enabled)
 * - Metronome toggle (filled when enabled)
 * - Settings gear (right-aligned)
 *
 * Layout (from Swift):
 *   HStack { Spacer, HStack(spacing:8) { play/pause, loop, metronome }, Spacer, settings }
 *
 * SF Symbol → Lucide mapping:
 *   play.fill / pause.fill   → Play / Pause
 *   arrow.rectanglepath      → Repeat
 *   metronome / metronome.fill → Timer / TimerOff (closest match)
 *   gearshape.fill           → Settings
 */
import { memo, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import { makeSpacing } from '../../../../theme/spacing';
import type { SongViewState, SongCallbacks } from '../../types';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface SongToolbarProps {
  /** Song state — reads isPlaying, isLoopEnabled, isMetronomeEnabled */
  song: SongViewState;
  /** Callback handlers for transport actions */
  callbacks?: SongCallbacks;
  /** Container style override */
  style?: StyleProp<ViewStyle>;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const SongToolbar: React.FC<SongToolbarProps> = memo(
  function SongToolbar({ song, callbacks, style }) {
    const { colors } = useTheme();

    // ─── Handlers ───────────────────────────────────────────────────

    const handlePlayPause = useCallback(() => {
      if (song.isPlaying) {
        callbacks?.onPause?.();
      } else {
        callbacks?.onPlay?.();
      }
    }, [song.isPlaying, callbacks]);

    const handleToggleLoop = useCallback(() => {
      callbacks?.onToggleLoop?.();
    }, [callbacks]);

    const handleToggleMetronome = useCallback(() => {
      callbacks?.onToggleMetronome?.();
    }, [callbacks]);

    const handleSettings = useCallback(() => {
      callbacks?.onNavigate?.('settings');
    }, [callbacks]);

    // ─── Colors ─────────────────────────────────────────────────────

    // iOS: loop = mcGreen when enabled, mcWhite when disabled
    const loopColor = song.isLoopEnabled ? colors.mcGreen : colors.mcWhite;

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
        {/* Back button — matches iOS chevron.left at x=28 */}
        <Pressable
          onPress={callbacks?.onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backButton}
        >
          <Icon icon={Icons.back} size={20} color={colors.mcWhite} />
        </Pressable>

        <View style={styles.spacer} />

        {/* Transport Controls — centered */}
        <View style={styles.transportGroup}>
          {/* Play / Pause */}
          <Pressable
            onPress={handlePlayPause}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={song.isPlaying ? 'Pause' : 'Play'}
            accessibilityState={{ selected: song.isPlaying }}
            style={({ pressed }) => [
              styles.transportButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            testID="transport-play-pause"
          >
            {song.isPlaying ? (
              <Icon icon={Icons.pause} size={20} color={colors.mcWhite} />
            ) : (
              <Icon icon={Icons.play} size={20} color={colors.mcWhite} />
            )}
          </Pressable>

          {/* Loop */}
          <Pressable
            onPress={handleToggleLoop}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Loop"
            accessibilityState={{ selected: song.isLoopEnabled }}
            style={({ pressed }) => [
              styles.transportButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            testID="transport-loop"
          >
            <Icon icon={Icons.loop} size={18} color={loopColor} />
          </Pressable>

          {/* Metronome */}
          <Pressable
            onPress={handleToggleMetronome}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Metronome"
            accessibilityState={{ selected: song.isMetronomeEnabled }}
            style={({ pressed }) => [
              styles.transportButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            testID="transport-metronome"
          >
            <Icon
              icon={
                song.isMetronomeEnabled ? Icons.metronomeOn : Icons.metronomeOff
              }
              size={18}
              color={colors.mcWhite}
            />
          </Pressable>
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
            <Icon icon={Icons.settings} size={20} color={colors.mcWhite} />
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
    paddingHorizontal: makeSpacing(3), // 12
    paddingVertical: makeSpacing(2), // 8
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2C2C2E',
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
    gap: makeSpacing(2), // 8 — matches Swift spacing: 8
  },
  transportButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: makeSpacing(1), // 4
  },
  settingsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: makeSpacing(1), // 4
  },
});

export default SongToolbar;
