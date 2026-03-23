/**
 * SongMixerTabBar — 2-tab navigation bar for Song and Mixer
 *
 * Matches SwiftUI SongMixerTabBar exactly:
 *
 * Layout:
 *   HStack(spacing: 0) { tabButton("Song", .song), tabButton("Mixer", .mixer) }
 *   .padding(.horizontal, 40)
 *   .padding(.vertical, 12)
 *   .padding(.bottom, 30)
 *   .background(Color(hex: "#0A0A0A"))
 *   .overlay(alignment: .top) { Rectangle #222 h=1 }
 *
 * Selected tab:  bg #FF5C24 (orange), text .mcBlack (black), h=40, cornerRadius 6
 * Unselected tab: bg clear, text #666666
 * Font: system(size: 14, weight: .semibold), uppercased
 *
 * Note: The SwiftUI version has only Song and Mixer tabs (NOT Settings).
 * Settings is accessed via the gear button in SongToolbarView.
 */
import { memo, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';
import type { SongDestination } from '../../types';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Tab height from Swift: .frame(height: 40) */
const TAB_HEIGHT = 40;

// ─── Tab Definition ─────────────────────────────────────────────────────────

type TabKey = 'song' | 'mixer';

interface TabDef {
  key: TabKey;
  label: string;
  destination: SongDestination;
}

const TABS: readonly TabDef[] = [
  { key: 'song', label: 'SONG', destination: 'song' },
  { key: 'mixer', label: 'MIXER', destination: 'mixer' },
] as const;

// ─── Props ──────────────────────────────────────────────────────────────────

export interface SongMixerTabBarProps {
  /** Current active view — used to highlight the active tab */
  currentView: SongDestination;
  /** Called when a tab is pressed */
  onTabPress?: (destination: SongDestination) => void;
  /** Container style override */
  style?: StyleProp<ViewStyle>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Resolves the active tab key from a SongDestination.
 * Object destinations (pianoRoll, audioClipEditor) fall back to 'song'.
 * Settings also falls back to 'song' since it's not a tab.
 */
function resolveActiveTab(currentView: SongDestination): TabKey {
  if (typeof currentView === 'string') {
    if (currentView === 'song' || currentView === 'mixer') {
      return currentView;
    }
    // 'settings' falls back to 'song'
    return 'song';
  }
  // Object destinations — default to song tab
  return 'song';
}

// ─── Component ──────────────────────────────────────────────────────────────

export const SongMixerTabBar: React.FC<SongMixerTabBarProps> = memo(
  function SongMixerTabBar({ currentView, onTabPress, style }) {
    const { colors, borderRadius } = useTheme();
    const activeTab = resolveActiveTab(currentView);

    return (
      <View
        style={[styles.container, { backgroundColor: colors.mcBlack }, style]}
        accessibilityRole="tablist"
        accessibilityLabel="View tabs"
        testID="song-mixer-tab-bar"
      >
        <View
          style={[styles.topBorder, { backgroundColor: colors.mcBlack3 }]}
        />

        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TabButton
              key={tab.key}
              tab={tab}
              isActive={activeTab === tab.key}
              borderRadius={borderRadius.md}
              onPress={onTabPress}
            />
          ))}
        </View>
      </View>
    );
  }
);

// ─── Tab Button ─────────────────────────────────────────────────────────────

interface TabButtonProps {
  tab: TabDef;
  isActive: boolean;
  borderRadius: number;
  onPress?: (destination: SongDestination) => void;
}

const TabButton: React.FC<TabButtonProps> = memo(function TabButton({
  tab,
  isActive,
  borderRadius: radius,
  onPress,
}) {
  const { colors } = useTheme();
  const handlePress = useCallback(() => {
    onPress?.(tab.destination);
  }, [onPress, tab.destination]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => [
        styles.tab,
        {
          backgroundColor: isActive ? colors.mcOrange : 'transparent',
          borderRadius: radius,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      testID={`tab-${tab.key}`}
    >
      <Text
        variant="label"
        color={isActive ? colors.mcBlack : colors.mcWhite3}
        style={{ fontSize: 14 }}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
});

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 40, // matches Swift .padding(.horizontal, 40)
    paddingTop: 12, // matches Swift .padding(.vertical, 12)
    paddingBottom: 30, // matches Swift .padding(.bottom, 30) + .padding(.vertical, 12)
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  tabRow: {
    flexDirection: 'row',
    // spacing: 0 in Swift — no gap
  },
  tab: {
    flex: 1,
    height: TAB_HEIGHT, // matches Swift .frame(height: 40)
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SongMixerTabBar;
