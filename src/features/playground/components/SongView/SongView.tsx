/**
 * SongView — Main DAW container
 *
 * Matches Swift SongView which is the root view for a playground's song.
 * Uses `song.currentView` (SongDestination) to decide which child to render.
 *
 * View routing (from Swift SongView mainContent):
 *   'song'              → VStack { ScrollView { tracks + sections }, SongMixerTabBar }
 *   'mixer'             → VStack { MixerView, SongMixerTabBar }
 *   'settings'          → SongSettingsView (no tab bar)
 *   { kind: 'pianoRoll' }      → ClipEditorView (no tab bar, no toolbar)
 *   { kind: 'audioClipEditor' } → AudioClipEditorPlaceholderView (no tab bar, no toolbar)
 *
 * Layout for song/mixer views:
 *   ┌─────────────────────────┐
 *   │     SongToolbar         │ ← play/pause, loop, metronome, settings gear
 *   ├─────────────────────────┤
 *   │                         │
 *   │    Content Area         │ ← Switches based on currentView
 *   │                         │
 *   ├─────────────────────────┤
 *   │   SongMixerTabBar       │ ← Song | Mixer (2 tabs)
 *   └─────────────────────────┘
 *
 * For editor views (pianoRoll, audioClipEditor): no toolbar, no tab bar.
 * For settings: has toolbar but no tab bar (navigated via gear button).
 */
import { memo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';
import { makeSpacing } from '../../../../theme/spacing';
import { SongToolbar } from './SongToolbar';
import { SongMixerTabBar } from './SongMixerTabBar';
import type { SongState, SongCallbacks, SongDestination } from '../../types';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface SongViewProps {
  /** Full song state */
  song: SongState;
  /** Callback handlers for all song interactions */
  callbacks?: SongCallbacks;
  /** Container style override */
  style?: StyleProp<ViewStyle>;
}

// ─── Content Renderer ───────────────────────────────────────────────────────

/**
 * Renders the appropriate content based on `currentView`.
 * Each view is a placeholder until the actual components are built.
 */
function renderContent(
  currentView: SongDestination,
  colors: { secondaryText: string }
): React.ReactNode {
  // String destinations
  if (typeof currentView === 'string') {
    switch (currentView) {
      case 'song':
        return (
          <View style={styles.placeholder} testID="content-song">
            <Text variant="body" color={colors.secondaryText}>
              Song Arrangement
            </Text>
          </View>
        );
      case 'mixer':
        return (
          <View style={styles.placeholder} testID="content-mixer">
            <Text variant="body" color={colors.secondaryText}>
              Mixer
            </Text>
          </View>
        );
      case 'settings':
        return (
          <View style={styles.placeholder} testID="content-settings">
            <Text variant="body" color={colors.secondaryText}>
              Settings
            </Text>
          </View>
        );
    }
  }

  // Object destinations (discriminated union)
  switch (currentView.kind) {
    case 'pianoRoll':
      return (
        <View style={styles.placeholder} testID="content-piano-roll">
          <Text variant="body" color={colors.secondaryText}>
            Piano Roll — Clip {currentView.config.clipId}
          </Text>
        </View>
      );
    case 'audioClipEditor':
      return (
        <View style={styles.placeholder} testID="content-audio-editor">
          <Text variant="body" color={colors.secondaryText}>
            Audio Editor — Clip {currentView.config.clipId}
          </Text>
        </View>
      );
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export const SongView: React.FC<SongViewProps> = memo(function SongView({
  song,
  callbacks,
  style,
}) {
  const { colors } = useTheme();

  const handleTabPress = useCallback(
    (destination: SongDestination) => {
      callbacks?.onNavigate?.(destination);
    },
    [callbacks]
  );

  // Tab bar visible only for song and mixer views (matches Swift)
  const showTabBar =
    typeof song.currentView === 'string' &&
    (song.currentView === 'song' || song.currentView === 'mixer');

  // Toolbar visible for song, mixer, and settings (not for editor views)
  const showToolbar = typeof song.currentView === 'string';

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }, style]}
      testID="song-view"
    >
      {/* Toolbar — hidden during editor views */}
      {showToolbar && <SongToolbar song={song} callbacks={callbacks} />}

      {/* Content Area */}
      <View style={styles.content}>
        {renderContent(song.currentView, colors)}
      </View>

      {/* Tab Bar — shown only for song and mixer views */}
      {showTabBar && (
        <SongMixerTabBar
          currentView={song.currentView}
          onTabPress={handleTabPress}
        />
      )}
    </View>
  );
});

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: makeSpacing(4), // 16
  },
});

export default SongView;
