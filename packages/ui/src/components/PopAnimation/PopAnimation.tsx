import { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

export interface PopAnimationProps {
  isEnabled: boolean;
  color?: string;
  children: React.ReactNode;
}

export const PopAnimation = memo(function PopAnimation({
  isEnabled,
  color,
  children,
}: PopAnimationProps) {
  const { colors } = useTheme();
  const popColor = color || colors.mcGreen2;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = isEnabled
      ? withSpring(1, { stiffness: 200, damping: 15 })
      : withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) });
  }, [isEnabled, progress]);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.05]) }],
  }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0, 1.3]) }],
    borderWidth: interpolate(progress.value, [0, 1], [20, 0]),
    opacity: interpolate(progress.value, [0, 0.8, 1], [0, 1, 0]),
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={contentStyle}>{children}</Animated.View>
      <Animated.View
        style={[styles.circle, { borderColor: popColor }, circleStyle]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute', width: 35, height: 35, borderRadius: 17.5 },
});
