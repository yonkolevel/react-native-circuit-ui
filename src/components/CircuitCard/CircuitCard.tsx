import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../Text';
import { LevelIndicator } from '../LevelIndicator';
import { ProgressBar } from '../ProgressBar';
import { Heart, Check } from 'lucide-react-native';

export type CircuitCardVariant = 'horizontal' | 'vertical';
export type CircuitCardSize = 'small' | 'medium' | 'large';

export interface CircuitCardProps {
  /**
   * Content to be displayed inside the card
   * If children are provided, they will override the default content structure
   */
  children?: React.ReactNode;
  /**
   * Custom style for the card container
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Whether to show a shadow around the card
   * @default true
   */
  showShadow?: boolean;
  /**
   * Whether to show a border around the card
   * @default true
   */
  showBorder?: boolean;
  /**
   * Corner radius of the card
   * @default 6
   */
  borderRadius?: number;
  /**
   * Background color of the card
   * If not provided, uses card color from theme
   */
  backgroundColor?: string;
  /**
   * Border color of the card
   * If not provided, uses border color from theme
   */
  borderColor?: string;
  /**
   * Whether the card is pressable
   * @default false
   */
  pressable?: boolean;
  /**
   * Function to call when the card is pressed
   * Only works if pressable is true
   */
  onPress?: () => void;
  /**
   * Padding inside the card
   * @default 16
   */
  padding?: number;
  /**
   * Elevation of the card (Android only)
   * @default 2
   */
  elevation?: number;
  /**
   * Layout variant of the card
   * @default 'vertical'
   */
  variant?: CircuitCardVariant;
  /**
   * Size of the card
   * @default 'medium'
   */
  size?: CircuitCardSize;
  /**
   * URL of the cover image
   */
  coverImageUrl?: string;
  /**
   * Title of the card
   */
  title?: string;
  /**
   * Description of the card
   */
  description?: string;
  /**
   * Whether the card is a preview
   * @default false
   */
  isPreview?: boolean;
  /**
   * Whether the card is completed
   * @default false
   */
  isCompleted?: boolean;
  /**
   * Whether the card is favorited
   * @default false
   */
  isFavorite?: boolean;
  /**
   * Function to call when the favorite button is pressed
   */
  onFavoritePress?: () => void;
  /**
   * Whether the user has started the circuit
   * @default false
   */
  isStarted?: boolean;
  /**
   * Number of completed modules
   */
  completedModulesCount?: number;
  /**
   * Total number of modules
   */
  totalModulesCount?: number;
  /**
   * Trophies text to display
   */
  trophies?: string;
  /**
   * Progress value (0-100)
   */
  progress?: number;
  /**
   * Difficulty level
   */
  level?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * CircuitCard component for displaying content in a card container
 */
export const CircuitCard: React.FC<CircuitCardProps> = ({
  children,
  style,
  showShadow = true,
  showBorder = true,
  borderRadius = 6,
  backgroundColor,
  borderColor,
  pressable = false,
  onPress,
  padding = 16,
  elevation = 2,
  variant = 'vertical',
  size = 'medium',
  coverImageUrl,
  title,
  description,
  isPreview = false,
  isCompleted = false,
  isFavorite = false,
  onFavoritePress,
  isStarted = false,
  completedModulesCount = 0,
  totalModulesCount = 0,
  trophies,
  progress = 0,
  level = 'beginner',
}) => {
  const { colors, isDark } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const isIphone =
    Platform.OS === 'ios' && Dimensions.get('window').width < 768;

  const bgColor =
    backgroundColor || (isDark ? colors.mcBlack2 : colors.mcWhite1);
  const borderClr = borderColor || (isDark ? colors.mcBlack4 : colors.mcWhite4);

  const shadowStyle = showShadow
    ? Platform.select({
        ios: {
          shadowColor: colors.mcBlack1,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 6,
        },
        android: {
          elevation,
        },
        default: {},
      })
    : {};

  const borderStyle = showBorder
    ? {
        borderWidth: 1,
        borderColor: borderClr,
      }
    : {};

  const dimensions = getCardDimensions(size, variant, isIphone);

  const cardStyles = [
    styles.container,
    {
      backgroundColor: isPressed ? colors.mcBlue2 : bgColor,
      borderRadius,
    },
    shadowStyle,
    borderStyle,
    dimensions,
    style,
  ];

  // Handle press state
  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  if (children) {
    if (pressable) {
      return (
        <Pressable
          style={cardStyles}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_ripple={{ color: colors.mcBlue3 }}
        >
          <View style={{ padding }}>{children}</View>
        </Pressable>
      );
    }
    return (
      <View style={cardStyles}>
        <View style={{ padding }}>{children}</View>
      </View>
    );
  }

  const cardContent = (
    <>
      {variant === 'horizontal' ? (
        <View style={styles.horizontalLayout}>
          {coverImageUrl && (
            <View
              style={[
                styles.imageContainer,
                {
                  width: dimensions.imageWidth,
                  height: '100%',
                },
              ]}
            >
              <Image
                source={{ uri: coverImageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}
          <CardContent
            title={title}
            description={description}
            isPreview={isPreview}
            isCompleted={isCompleted}
            isFavorite={isFavorite}
            onFavoritePress={onFavoritePress}
            isStarted={isStarted}
            completedModulesCount={completedModulesCount}
            totalModulesCount={totalModulesCount}
            trophies={trophies}
            progress={progress}
            level={level}
            isPressed={isPressed}
            padding={padding}
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        <View style={styles.verticalLayout}>
          {coverImageUrl && (
            <View
              style={[
                styles.imageContainer,
                { height: dimensions.imageHeight },
              ]}
            >
              <Image
                source={{ uri: coverImageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}
          <CardContent
            title={title}
            description={description}
            isPreview={isPreview}
            isCompleted={isCompleted}
            isFavorite={isFavorite}
            onFavoritePress={onFavoritePress}
            isStarted={isStarted}
            completedModulesCount={completedModulesCount}
            totalModulesCount={totalModulesCount}
            trophies={trophies}
            progress={progress}
            level={level}
            isPressed={isPressed}
            padding={padding}
            style={{ height: dimensions.contentHeight }}
          />
        </View>
      )}
    </>
  );

  if (pressable) {
    return (
      <Pressable
        style={cardStyles}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: colors.mcBlue3 }}
      >
        {cardContent}
      </Pressable>
    );
  }

  return <View style={cardStyles}>{cardContent}</View>;
};

interface CardContentProps {
  title?: string;
  description?: string;
  isPreview?: boolean;
  isCompleted?: boolean;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
  isStarted?: boolean;
  completedModulesCount?: number;
  totalModulesCount?: number;
  trophies?: string;
  progress?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  isPressed?: boolean;
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

const CardContent: React.FC<CardContentProps> = ({
  title,
  description,
  isPreview,
  isCompleted,
  isFavorite,
  onFavoritePress,
  isStarted,
  completedModulesCount,
  totalModulesCount,
  trophies,
  progress,
  level,
  isPressed,
  padding = 16,
  style,
}) => {
  const { colors, isDark } = useTheme();

  const tintColor = colors.mcBlue2;
  const textColor = isPressed
    ? colors.mcWhite1
    : isDark
      ? colors.mcWhite2
      : colors.mcBlack2;
  const titleColor = isPressed ? colors.mcWhite1 : colors.mcBlue2;
  const backgroundColor = isPressed
    ? tintColor
    : isDark
      ? colors.mcBlack2
      : colors.mcWhite1;

  return (
    <View
      style={[styles.contentContainer, { padding, backgroundColor }, style]}
    >
      {/* Title Content */}
      {title && (
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text
              variant="h5"
              color={titleColor}
              numberOfLines={2}
              style={styles.titleText}
            >
              {title}
            </Text>
            {isPreview && (
              <View style={styles.previewLabel}>
                <Text variant="small" color={colors.mcWhite1}>
                  PREVIEW
                </Text>
              </View>
            )}
          </View>

          <View style={styles.titleActions}>
            {isCompleted && (
              <View
                style={[
                  styles.checkmark,
                  {
                    backgroundColor: isPressed
                      ? 'transparent'
                      : colors.mcGreen2,
                  },
                ]}
              >
                <Check
                  size={18}
                  color={isPressed ? colors.mcGreen2 : colors.mcWhite1}
                  strokeWidth={2.5}
                />
              </View>
            )}

            {onFavoritePress && (
              <TouchableOpacity
                onPress={onFavoritePress}
                style={styles.favoriteButton}
              >
                <Heart
                  size={20}
                  color={
                    isPressed
                      ? colors.mcWhite2
                      : isFavorite
                        ? colors.mcBlue2
                        : colors.mcWhite2
                  }
                  fill={
                    isFavorite
                      ? isPressed
                        ? colors.mcWhite2
                        : colors.mcBlue2
                      : 'none'
                  }
                  strokeWidth={2}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Middle Content */}
      <View style={styles.middleContent}>
        {isStarted ? (
          <View style={styles.lessonsTrophiesContent}>
            <View style={styles.lessonsContainer}>
              <Text variant="small" uppercase color={colors.mcWhite2}>
                Lessons
              </Text>
              <Text
                variant="label"
                color={isPressed ? colors.mcWhite2 : colors.mcBlue2}
              >
                {completedModulesCount}/{totalModulesCount}
              </Text>
            </View>

            {trophies && (
              <View style={styles.trophiesContainer}>
                <Text variant="small" uppercase color={colors.mcWhite2}>
                  Trophies
                </Text>
                <Text
                  variant="label"
                  color={isPressed ? colors.mcWhite2 : colors.mcBlue2}
                >
                  {trophies}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.descriptionContainer}>
            {description && (
              <Text
                variant="small"
                color={textColor}
                numberOfLines={4}
                style={styles.descriptionText}
              >
                {description}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Bottom Content */}
      <View style={styles.bottomContent}>
        {isStarted ? (
          <View style={styles.progressContainer}>
            <Text
              variant="small"
              uppercase
              color={colors.mcWhite2}
              style={styles.progressLabel}
            >
              Progress:
            </Text>
            <ProgressBar
              value={progress}
              tintColor={isPressed ? colors.mcWhite2 : colors.mcBlue2}
              style={styles.progressBar}
            />
          </View>
        ) : (
          <View style={styles.levelContainer}>
            {level && (
              <LevelIndicator
                level={level}
                tintColor={isPressed ? colors.mcWhite2 : colors.mcBlue2}
                textColor={colors.mcWhite2}
                backgroundColor={isPressed ? colors.mcBlack1 : colors.mcBlack4}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const getCardDimensions = (
  size: CircuitCardSize,
  variant: CircuitCardVariant,
  isIphone: boolean
) => {
  let dimensions: any = {};

  // Set image dimensions based on size and device
  switch (size) {
    case 'small':
      dimensions.imageHeight = 140;
      dimensions.imageWidth = isIphone ? 122 : 122;
      break;
    case 'medium':
      dimensions.imageHeight = 160;
      dimensions.imageWidth = isIphone ? 180 : 298;
      break;
    case 'large':
      dimensions.imageHeight = 250;
      dimensions.imageWidth = isIphone ? 298 : 298;
      break;
    default:
      dimensions.imageHeight = 160;
      dimensions.imageWidth = isIphone ? 180 : 298;
  }

  if (variant === 'horizontal') {
    // Match the SwiftUI implementation for horizontal layout
    dimensions.minHeight = isIphone ? (size === 'small' ? 141 : 180) : 180;
    dimensions.height = isIphone ? (size === 'small' ? 141 : 180) : 180;
    dimensions.minWidth = 300;
    dimensions.maxWidth = isIphone ? 358 : '100%';
  } else {
    // Vertical layout dimensions
    dimensions.minWidth = 300;
    dimensions.maxWidth = isIphone ? 358 : '100%';
    dimensions.contentHeight = dimensions.imageHeight;
    dimensions.height = dimensions.imageHeight * 2;
  }

  return dimensions;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    minWidth: 300,
  },
  horizontalLayout: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  verticalLayout: {
    flexDirection: 'column',
    height: '100%',
  },
  imageContainer: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  titleText: {
    flexShrink: 1,
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewLabel: {
    backgroundColor: '#666',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  checkmark: {
    marginRight: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 4,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleContent: {
    flex: 1,
    marginVertical: 8,
  },
  descriptionContainer: {
    flex: 1,
  },
  descriptionText: {
    lineHeight: 20,
  },
  lessonsTrophiesContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 24,
  },
  lessonsContainer: {
    gap: 4,
  },
  trophiesContainer: {
    gap: 4,
  },
  bottomContent: {
    marginTop: 8,
  },
  progressContainer: {
    gap: 8,
  },
  progressLabel: {
    marginBottom: 4,
  },
  progressBar: {
    marginBottom: 8,
  },
  levelContainer: {
    alignItems: 'flex-start',
  },
});
