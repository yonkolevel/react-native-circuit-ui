/**
 * TrophyAwardedModal — Celebration modal when trophy earned.
 * Mirrors iOS TrophyAwardedModal.swift + TrophyAwardedViewModel.
 */
import { memo } from 'react';
import { View, Modal, Pressable, StyleSheet, Image } from 'react-native';
import { Text } from '../../../components/Text';
import { makeSpacing } from '../../../theme/spacing';
import type { Trophy } from '../types';

export interface TrophyAwardedModalProps {
  visible: boolean;
  trophy: Trophy | null;
  onClose: () => void;
  onNext?: () => void;
  hasNext: boolean;
}

export const TrophyAwardedModal = memo(function TrophyAwardedModal({
  visible, trophy, onClose, onNext, hasNext,
}: TrophyAwardedModalProps) {
  if (!trophy) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <Text style={styles.header}>🏆 Trophy Earned!</Text>

          {/* Trophy image */}
          {trophy.imageUrl ? (
            <Image source={{ uri: trophy.imageUrl }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.emoji}>🏆</Text>
            </View>
          )}

          {/* Title + description */}
          <Text style={styles.title}>{trophy.title}</Text>
          <Text style={styles.description}>{trophy.description}</Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            {hasNext && onNext ? (
              <>
                <Pressable onPress={onClose} style={styles.secondaryBtn} accessibilityLabel="Close" accessibilityRole="button">
                  <Text style={styles.secondaryBtnText}>Close</Text>
                </Pressable>
                <Pressable onPress={onNext} style={styles.primaryBtn} accessibilityLabel="Next trophy" accessibilityRole="button">
                  <Text style={styles.primaryBtnText}>Next</Text>
                </Pressable>
              </>
            ) : (
              <Pressable onPress={onClose} style={[styles.primaryBtn, styles.fullWidth]} accessibilityLabel="Close" accessibilityRole="button">
                <Text style={styles.primaryBtnText}>Close</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  card: {
    backgroundColor: '#1A1C20', borderRadius: 12, padding: makeSpacing(6),
    width: '100%', maxWidth: 340, alignItems: 'center', gap: makeSpacing(3),
  },
  header: { color: '#FF5C24', fontSize: 28, fontWeight: '700', textAlign: 'center' },
  image: { width: 100, height: 100, borderRadius: 50 },
  placeholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#2A2C30', justifyContent: 'center', alignItems: 'center',
  },
  emoji: { fontSize: 40 },
  title: { color: '#F7F7F7', fontSize: 22, fontWeight: '600', textAlign: 'center' },
  description: { color: 'rgba(247,247,247,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  buttons: { flexDirection: 'row', gap: makeSpacing(3), marginTop: makeSpacing(2), width: '100%' },
  primaryBtn: { flex: 1, backgroundColor: '#FF5C24', paddingVertical: 14, borderRadius: 6, alignItems: 'center' },
  primaryBtnText: { color: '#F7F7F7', fontSize: 16, fontWeight: '600' },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(247,247,247,0.3)', paddingVertical: 14, borderRadius: 6, alignItems: 'center' },
  secondaryBtnText: { color: '#F7F7F7', fontSize: 16, fontWeight: '500' },
  fullWidth: { flex: 1 },
});
