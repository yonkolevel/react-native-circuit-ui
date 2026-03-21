/**
 * LearningPathCard — Matches LearningPathCard.swift
 *
 * SwiftUI: VStack with title, Spacer, background color, frame, padding,
 * cornerRadius(6), shadow(radius: 6).
 * Min width 300, max 358 on iPhone.
 */
import React, { memo } from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../Text';
import { makeSpacing, shadows } from '../../theme/spacing';
import type { TypographyVariant } from '../../theme';

// ─── Types ──────────────────────────────────────────────────────────────────

export type CardSize = 'small' | 'medium' | 'large';

export interface LearningPathDetails {
  id: string;
  title: string;
  coverImageUrl?: string;
  circuitIds?: string[];
}

export interface LearningPathCardProps {
  learningPath: LearningPathDetails;
  size?: CardSize;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

// ─── Size Config (matches SwiftUI CardSize extension) ───────────────────────

interface CardDimConfig {
  height: number;
  padding: number;
  titleVariant: TypographyVariant;
}

const CARD_DIMS: Record<CardSize, CardDimConfig> = {
  small: {
    height: 140,
    padding: makeSpacing(3), // 12
    titleVariant: 'quote',
  },
  medium: {
    height: 160,
    padding: makeSpacing(5), // 20
    titleVariant: 'quote',
  },
  large: {
    height: 250,
    padding: makeSpacing(8), // 32
    titleVariant: 'h4',
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

export const LearningPathCard: React.FC<LearningPathCardProps> = memo(
  function LearningPathCard({
    learningPath,
    size = 'medium',
    backgroundColor,
    style,
    onPress,
  }) {
    const { colors } = useTheme();
    const bgColor = backgroundColor || colors.mcPink2;
    const dims = CARD_DIMS[size];

    const cardContent = (
      <View
        style={[
          styles.container,
          {
            height: dims.height,
            padding: dims.padding,
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
          {/* Title + Spacer — matches SwiftUI VStack { Text.h4() Spacer() } */}
          <Text variant={dims.titleVariant} color={colors.mcWhite}>
            {learningPath.title}
          </Text>
        </View>
      </View>
    );

    if (onPress) {
      return (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={learningPath.title}
          accessibilityHint="Opens this learning path"
          style={({ pressed }) => [
            styles.touchable,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          {cardContent}
        </Pressable>
      );
    }

    return (
      <View accessible accessibilityLabel={learningPath.title}>
        {cardContent}
      </View>
    );
  }
);

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
    justifyContent: 'flex-start',
  },
});

export default LearningPathCard;
