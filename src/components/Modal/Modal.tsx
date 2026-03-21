/**
 * Modal — Matches Modal.swift
 *
 * SwiftUI implementation:
 * - Title + close button header
 * - ScrollView body
 * - VisualEffectView background on macOS / standard on iOS
 * - Padding: 20pt iPhone, 40pt desktop
 * - minWidth: 500 (desktop), maxWidth: 1400, maxHeight: 700
 */
import React, { memo } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal as RNModal,
  useWindowDimensions,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { Icon, Icons } from '../../components/SFSymbol';

export interface ModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Modal title (matches SwiftUI `title` param) */
  title?: string;
  /** Close handler. If provided, shows close button. */
  onClose?: () => void;
  /** Modal content */
  children: React.ReactNode;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Animation type. Default: 'fade'. */
  animationType?: 'fade' | 'slide' | 'none';
}

export const Modal: React.FC<ModalProps> = memo(function Modal({
  visible,
  title = '',
  onClose,
  children,
  style,
  animationType = 'fade',
}) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isPhone = width < 768;

  const containerPadding = isPhone ? 20 : 40;
  const bgColor = isDark ? colors.mcBlack3 : colors.mcWhite;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      {/* Backdrop */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close modal"
      >
        <View />
      </Pressable>

      {/* Content */}
      <View style={styles.centeredView}>
        <View
          style={[
            styles.modalContent,
            {
              padding: containerPadding,
              backgroundColor: bgColor,
              minWidth: isPhone ? undefined : 500,
              maxWidth: 1400,
              maxHeight: 700,
            },
            style,
          ]}
          accessibilityRole="alert"
          accessibilityLabel={title ? `Dialog: ${title}` : 'Dialog'}
        >
          {/* Header — matches SwiftUI HStack { title + close } */}
          <View style={styles.header}>
            <Text variant="h4" style={styles.headerTitle}>
              {title}
            </Text>
            {onClose && (
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Icon icon={Icons.close}
                  
                  size={24} color={isDark ? colors.mcWhite2 : colors.mcBlack2}
                />
              </Pressable>
            )}
          </View>

          {/* Body — matches SwiftUI ScrollView { content } */}
          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    width: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
  },
  headerTitle: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    flex: 1,
  },
});

export default Modal;
