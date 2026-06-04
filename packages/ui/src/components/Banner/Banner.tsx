/**
 * Banner — Matches Banner.swift
 *
 * Full-width hero image with rounded bottom corners.
 * SwiftUI uses .mask(RoundBottomShape(radius: 10)) and maxHeight: 370.
 */
import React, { memo, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface BannerProps {
  /** Image URL */
  imageUrl: string;
  /** Banner height. Default: 370 (matches SwiftUI idealHeight). */
  height?: number;
  /** Bottom corner radius. Default: 10 (matches SwiftUI RoundBottomShape). */
  bottomRadius?: number;
  /** Container style override */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label for the banner image. Default: 'Banner image'. */
  accessibilityLabel?: string;
}

export const Banner: React.FC<BannerProps> = memo(function Banner({
  imageUrl,
  height = 370,
  bottomRadius = 10,
  style,
  accessibilityLabel = 'Banner image',
}) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          height,
          borderBottomLeftRadius: bottomRadius,
          borderBottomRightRadius: bottomRadius,
        },
        style,
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {error ? (
        <View
          style={[styles.placeholder, { backgroundColor: colors.mcGray }]}
        />
      ) : (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
        />
      )}
      {loading && !error && (
        <ActivityIndicator
          style={styles.loader}
          color={colors.mcWhite}
          size="large"
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Banner;
