import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../Text';

export interface LoadingViewProps {
  text?: string;
}

export const LoadingView = memo(function LoadingView({
  text = 'Loading...',
}: LoadingViewProps) {
  return (
    <View style={styles.container} accessibilityLabel={text}>
      <Text variant="body">{text}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
