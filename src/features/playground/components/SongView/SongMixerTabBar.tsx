/**
 * SongMixerTabBar — 2-tab navigation bar for Song and Mixer
 *
 * All state and actions from useSongContext() — zero callback props.
 *
 * Layout: HStack(spacing: 0) { tabButton("Song"), tabButton("Mixer") }
 * Selected: bg mcOrange, text mcBlack. Unselected: bg clear, text #666.
 */
import { memo, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';
import { useSongContext, useSongActions } from '../../stores/playgroundStore';
import type { SongTab } from '../../types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Constants ──────────────────────────────────────────────────────────────

const TAB_HEIGHT = 40;

type TabKey = Extract<SongTab, 'song' | 'mixer'>;

interface TabDef {
  key: TabKey;
  label: string;
}

const TABS: readonly TabDef[] = [
  { key: 'song', label: 'SONG' },
  { key: 'mixer', label: 'MIXER' },
] as const;

// ─── Props ──────────────────────────────────────────────────────────────────

export interface SongMixerTabBarProps {
  style?: StyleProp<ViewStyle>;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const SongMixerTabBar: React.FC<SongMixerTabBarProps> = memo(
  function SongMixerTabBar({ style }) {
    const { colors, borderRadius } = useTheme();
    const currentTab = useSongContext((s) => s.currentTab);
    const { setCurrentTab } = useSongActions();

    const activeTab: TabKey = currentTab === 'mixer' ? 'mixer' : 'song';

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
              onPress={setCurrentTab}
            />
          ))}
        </View>
      </View>
    );
  }
);

// ─── Tab Button with spring press feedback ──────────────────────────────────

interface TabButtonProps {
  tab: TabDef;
  isActive: boolean;
  borderRadius: number;
  onPress: (tab: SongTab) => void;
}

const TabButton: React.FC<TabButtonProps> = memo(function TabButton({
  tab,
  isActive,
  borderRadius: radius,
  onPress,
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    // Quick spring bounce on tap — subtle, like iOS UIImpactFeedbackGenerator
    scale.value = withSequence(
      withSpring(0.92, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    onPress(tab.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scale is a Reanimated SharedValue (stable ref)
  }, [onPress, tab.key]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
      style={[
        styles.tab,
        {
          backgroundColor: isActive ? colors.mcOrange : 'transparent',
          borderRadius: radius,
        },
        animStyle,
      ]}
      testID={`tab-${tab.key}`}
    >
      <Text
        variant="label"
        color={isActive ? colors.mcBlack : colors.mcWhite3}
        style={styles.tabText}
      >
        {tab.label}
      </Text>
    </AnimatedPressable>
  );
});

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 40,
    paddingTop: 12,
    paddingBottom: 30,
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
  },
  tab: {
    flex: 1,
    height: TAB_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
  },
});

export default SongMixerTabBar;
