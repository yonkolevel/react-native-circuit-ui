import React, { useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import type { StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface AvatarProps {
  /**
   * URL of the profile image
   */
  imageUrl?: string;
  /**
   * Size of the avatar (width and height)
   * @default 80
   */
  size?: number;
  /**
   * Custom style for the avatar container
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Custom style for the image
   */
  imageStyle?: StyleProp<ImageStyle>;
  /**
   * Whether to show a shadow around the avatar
   * @default true
   */
  showShadow?: boolean;
}

/**
 * Avatar component for displaying user profile images
 */
export const Avatar: React.FC<AvatarProps> = ({
  imageUrl,
  size = 80,
  style,
  imageStyle,
  showShadow = true,
}) => {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const shadowStyle = showShadow
    ? {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
      }
    : {};

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDark ? colors.mcBlack4 : colors.mcBlack5,
        },
        shadowStyle,
        style,
      ]}
    >
      {imageUrl && !hasError ? (
        <>
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.image,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
              imageStyle,
            ]}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
          {isLoading && (
            <ActivityIndicator
              style={styles.loader}
              color={isDark ? colors.mcWhite2 : colors.mcBlack2}
              size="small"
            />
          )}
        </>
      ) : (
        <View style={styles.placeholderContainer}>
          <View
            style={[
              styles.personHead,
              {
                backgroundColor: isDark ? colors.mcWhite2 : colors.mcWhite1,
                width: size * 0.3,
                height: size * 0.3,
                borderRadius: (size * 0.3) / 2,
                top: size * 0.15,
              },
            ]}
          />
          <View
            style={[
              styles.personBody,
              {
                backgroundColor: isDark ? colors.mcWhite2 : colors.mcWhite1,
                width: size * 0.5,
                height: size * 0.35,
                borderTopLeftRadius: (size * 0.5) / 2,
                borderTopRightRadius: (size * 0.5) / 2,
                top: size * 0.45,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  loader: {
    position: 'absolute',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personHead: {
    position: 'absolute',
  },
  personBody: {
    position: 'absolute',
  },
});
