import { memo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

export interface ScreenContainerProps { children: React.ReactNode; }

export const ScreenContainer = memo(function ScreenContainer({ children }: ScreenContainerProps) {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  return (
    <View style={[styles.container, { padding: isPhone ? 16 : 40 }]}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
});
