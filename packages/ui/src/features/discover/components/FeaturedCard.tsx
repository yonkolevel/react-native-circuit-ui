/**
 * FeaturedCard — Matches FeaturedCardView.swift
 *
 * ZStack: Banner image + VStack(title, description, LEARN MORE button)
 * Height: 370, cornerRadius 6, full width
 */
import { memo } from 'react';
import { View, ImageBackground, Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../components/Text';
import { useTheme } from '../../../theme';
import { makeSpacing } from '../../../theme/spacing';

export interface FeaturedCardProps {
  title: string;
  description: string;
  imageUrl: string;
  textColor?: string;
  onPress?: () => void;
}

export const FeaturedCard = memo(function FeaturedCard({
  title,
  description,
  imageUrl,
  textColor,
  onPress,
}: FeaturedCardProps) {
  const { colors } = useTheme();
  const tColor = textColor || colors.mcWhite;

  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <Text variant="h4" color={tColor} style={styles.title}>
            {title}
          </Text>
          <Text variant="labelRegular3" color={tColor}>
            {description}
          </Text>
          <Text variant="buttonLabelSemiBold" color={colors.mcBlue}>
            LEARN MORE
          </Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: { height: 370, borderRadius: 6, overflow: 'hidden' },
  bg: { flex: 1, justifyContent: 'flex-end' },
  content: { padding: makeSpacing(5), gap: makeSpacing(5) },
  title: { maxWidth: '60%' },
});
