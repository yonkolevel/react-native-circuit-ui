import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';

/**
 * Level/Difficulty types
 */
export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface LevelIconProps {
  /**
   * Difficulty level
   * @default 'beginner'
   */
  level?: Level;
  /**
   * Color for active elements
   */
  tintColor: string;
  /**
   * Color for inactive elements
   * @default theme.colors.mcBlack4 (light) or theme.colors.mcWhite4 (dark)
   */
  backgroundColor?: string;
  /**
   * Custom style for the container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * LevelIcon component for displaying difficulty level
 */
export const LevelIcon: React.FC<LevelIconProps> = ({
  level = 'beginner',
  tintColor,
  backgroundColor,
  style,
}) => {
  const { colors, isDark } = useTheme();

  const bgColor =
    backgroundColor || (isDark ? colors.mcWhite4 : colors.mcBlack4);

  const isLevel2Active = level === 'intermediate' || level === 'advanced';
  const isLevel3Active = level === 'advanced';

  return (
    <View style={[styles.iconContainer, style]}>
      {/* Horizontal bars */}
      <View style={styles.barsContainer}>
        <View
          style={[
            styles.bar,
            { backgroundColor: isLevel2Active ? tintColor : bgColor },
          ]}
        />
        <View
          style={[
            styles.bar,
            { backgroundColor: isLevel3Active ? tintColor : bgColor },
          ]}
        />
      </View>

      {/* Circles */}
      <View style={styles.circlesContainer}>
        <View style={[styles.circle, { backgroundColor: tintColor }]} />
        <View
          style={[
            styles.circle,
            { backgroundColor: isLevel2Active ? tintColor : bgColor },
          ]}
        />
        <View
          style={[
            styles.circle,
            { backgroundColor: isLevel3Active ? tintColor : bgColor },
          ]}
        />
      </View>
    </View>
  );
};

export interface LevelIndicatorProps {
  /**
   * Difficulty level
   * @default 'beginner'
   */
  level?: Level;
  /**
   * Color for active elements
   */
  tintColor: string;
  /**
   * Color for the text
   * @default theme.colors.mcWhite1 (dark) or theme.colors.mcBlack1 (light)
   */
  textColor?: string;
  /**
   * Color for inactive elements
   * @default theme.colors.mcBlack1 (light) or theme.colors.mcWhite4 (dark)
   */
  backgroundColor?: string;
  /**
   * Custom style for the container
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Custom label to display instead of the level value
   * For example: 'easy' instead of 'beginner'
   */
  label?: string;
  /**
   * Custom labels for each level
   * Allows mapping levels to custom text (e.g., 'easy', 'normal', 'hard')
   * If provided, overrides the 'label' prop
   */
  levelLabels?: {
    beginner?: string;
    intermediate?: string;
    advanced?: string;
  };
}

/**
 * LevelIndicator component for displaying difficulty level with label
 */
export const LevelIndicator: React.FC<LevelIndicatorProps> = ({
  level = 'beginner',
  tintColor,
  textColor,
  backgroundColor,
  style,
  label,
  levelLabels,
}) => {
  const { colors, isDark } = useTheme();

  const txtColor = textColor || (isDark ? colors.mcWhite1 : colors.mcBlack1);
  const bgColor =
    backgroundColor || (isDark ? colors.mcWhite4 : colors.mcBlack1);

  const getLevelText = (): string => {
    if (levelLabels && levelLabels[level]) {
      return levelLabels[level]!;
    }

    if (label) {
      return label;
    }

    return level;
  };

  return (
    <View style={[styles.container, style]}>
      <LevelIcon
        level={level}
        tintColor={tintColor}
        backgroundColor={bgColor}
      />

      <Text variant="small" uppercase color={txtColor} style={styles.levelText}>
        {getLevelText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    width: 60,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  bar: {
    width: 10,
    height: 2.5,
  },
  circlesContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 5,
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  levelText: {
    marginLeft: 8,
  },
});
