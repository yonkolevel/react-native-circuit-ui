import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../Text';

export interface MenuLabelProps { title: string; icon?: React.ReactNode; }

export const MenuLabel = memo(function MenuLabel({ title, icon }: MenuLabelProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text variant="body">{title}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 24, alignItems: 'center' },
});
