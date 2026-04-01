/**
 * TrophyDetailModal — Shows trophy details with next/previous navigation.
 * Mirrors iOS TrophyDetailView.swift + TrophyDetailViewModel.
 */
import { memo } from 'react';
import { View, Modal, Pressable, StyleSheet, Image } from 'react-native';
import { Text } from '../../../components/Text';
import { makeSpacing } from '../../../theme/spacing';
import type { Trophy } from '../types';

export interface TrophyDetailModalProps {
  visible: boolean;
  trophy: Trophy | null;
  onNext: () => void;
  onPrevious: () => void;
  onDismiss: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const TrophyDetailModal = memo(function TrophyDetailModal({
  visible,
  trophy,
  onNext,
  onPrevious,
  onDismiss,
  hasNext,
  hasPrevious,
}: TrophyDetailModalProps) {
  if (!trophy) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        style={styles.overlay}
        onPress={onDismiss}
        accessibilityLabel="Close"
        accessibilityRole="button"
      >
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Trophy image or placeholder */}
          {trophy.imageUrl ? (
            <Image
              source={{ uri: trophy.imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.emoji}>🏆</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{trophy.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{trophy.description}</Text>

          {/* Achieved date */}
          {trophy.achievedAt && (
            <Text style={styles.date}>
              Achieved {new Date(trophy.achievedAt).toLocaleDateString()}
            </Text>
          )}

          {/* Navigation */}
          <View style={styles.nav}>
            <Pressable
              onPress={onPrevious}
              disabled={!hasPrevious}
              style={[styles.navBtn, !hasPrevious && styles.navBtnDisabled]}
              accessibilityLabel="Previous trophy"
              accessibilityRole="button"
            >
              <Text style={styles.navBtnText}>‹ Previous</Text>
            </Pressable>

            <Pressable
              onPress={onDismiss}
              style={styles.closeBtn}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>

            <Pressable
              onPress={onNext}
              disabled={!hasNext}
              style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
              accessibilityLabel="Next trophy"
              accessibilityRole="button"
            >
              <Text style={styles.navBtnText}>Next ›</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1A1C20',
    borderRadius: 6,
    padding: makeSpacing(5),
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: makeSpacing(3),
  },
  image: { width: 120, height: 120, borderRadius: 60 },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2A2C30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: { fontSize: 48 },
  title: {
    color: '#F7F7F7',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    color: 'rgba(247,247,247,0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  date: { color: 'rgba(247,247,247,0.4)', fontSize: 12 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: makeSpacing(2),
    marginTop: makeSpacing(2),
  },
  navBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: '#F7F7F7', fontSize: 14, fontWeight: '500' },
  closeBtn: {
    backgroundColor: '#FF5C24',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  closeBtnText: { color: '#F7F7F7', fontSize: 14, fontWeight: '600' },
});
