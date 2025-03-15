import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../Text';
import { spacing, shadows } from '../../theme/spacing';

export type CardSize = 'small' | 'medium' | 'large';

export interface LearningPathDetails {
  /**
   * Unique identifier for the learning path
   */
  id: string;
  /**
   * Title of the learning path
   */
  title: string;
  /**
   * URL of the cover image
   */
  coverImageUrl?: string;
  /**
   * List of circuit IDs in this learning path
   */
  circuitIds?: string[];
}

export interface LearningPathCardProps {
  /**
   * Learning path data
   */
  learningPath: LearningPathDetails;
  /**
   * Size of the card
   * @default 'medium'
   */
  size?: CardSize;
  /**
   * Background color of the card
   * If not provided, uses pink2 color from theme
   */
  backgroundColor?: string;
  /**
   * Custom style for the card container
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Function to call when the card is pressed
   */
  onPress?: () => void;
}

/**
 * Get dimensions and styling based on card size
 */
const getCardDimensions = (size: CardSize) => {
  switch (size) {
    case 'small':
      return {
        height: 140,
        padding: spacing.custom(3),
        spacing: spacing.custom(3),
        titleVariant: 'quote' as const,
      };
    case 'large':
      return {
        height: 250,
        padding: spacing.custom(8),
        spacing: spacing.custom(8),
        titleVariant: 'h4' as const,
      };
    case 'medium':
    default:
      return {
        height: 160,
        padding: spacing.custom(5),
        spacing: spacing.custom(4),
        titleVariant: 'quote' as const,
      };
  }
};

/**
 * LearningPathCard component for displaying learning path information
 */
export const LearningPathCard: React.FC<LearningPathCardProps> = ({
  learningPath,
  size = 'medium',
  backgroundColor,
  style,
  onPress,
}) => {
  const { colors } = useTheme();
  const bgColor = backgroundColor || colors.mcPink2;
  const dimensions = getCardDimensions(size);

  const cardContent = (
    <View
      style={[
        styles.container,
        {
          height: dimensions.height,
          padding: dimensions.padding,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      {learningPath.coverImageUrl && (
        <Image
          source={{ uri: learningPath.coverImageUrl }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.contentContainer}>
        <Text variant={dimensions.titleVariant} style={styles.title}>
          {learningPath.title}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.touchable}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  touchable: {
    minWidth: 300,
    maxWidth: 358,
  },
  container: {
    minWidth: 300,
    maxWidth: 358,
    borderRadius: 6,
    overflow: 'hidden',
    ...shadows.md,
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    marginBottom: spacing.md,
  },
});

export default LearningPathCard;
