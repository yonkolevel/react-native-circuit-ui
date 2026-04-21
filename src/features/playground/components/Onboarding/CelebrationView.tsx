/**
 * CelebrationView — Playground onboarding celebration modal.
 *
 * MDC-271: Full-screen modal with confetti effect, emoji, title,
 * subtitle, and dismiss button.
 */
import { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';

export interface CelebrationViewProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Title text. Default: "You did it! 🎉" */
  title?: string;
  /** Subtitle text. Default: "You've completed the playground tutorial" */
  subtitle?: string;
  /** Button title. Default: "Get Started" */
  buttonTitle?: string;
  /** Called when user taps the button */
  onDismiss: () => void;
}

// ─── Confetti Configuration ─────────────────────────────────────────────────

const CONFETTI_COUNT = 24;
const CONFETTI_COLORS = [
  '#FF5C24', // mcOrange
  '#00FF9E', // mcGreen
  '#FF245B', // mcPink
  '#2496FF', // mcBlue
  '#8557FF', // mcPurple
  '#FFD33F', // mcYellow
];
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  x: number;
  color: string;
  size: number;
  delay: number;
  isCircle: boolean;
}

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, () => ({
    x: Math.random() * SCREEN_WIDTH,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
    size: 6 + Math.random() * 8,
    delay: Math.random() * 800,
    isCircle: Math.random() > 0.5,
  }));
}

// ─── Confetti Dot ───────────────────────────────────────────────────────────

function ConfettiDot({
  piece,
  fallAnim,
}: {
  piece: ConfettiPiece;
  fallAnim: Animated.Value;
}) {
  const translateY = fallAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, SCREEN_HEIGHT + 40],
  });

  return (
    <Animated.View
      style={[
        styles.confettiDot,
        {
          left: piece.x,
          width: piece.size,
          height: piece.size,
          borderRadius: piece.isCircle ? piece.size / 2 : 2,
          backgroundColor: piece.color,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

// ─── CelebrationView ────────────────────────────────────────────────────────

export function CelebrationView({
  visible,
  title = 'You did it! 🎉',
  subtitle = "You've completed the playground tutorial",
  buttonTitle = 'Get Started',
  onDismiss,
}: CelebrationViewProps) {
  const confettiPieces = useMemo(() => generateConfetti(), []);
  const fallAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    try {
      fallAnim.setValue(0);
      Animated.timing(fallAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }).start();
    } catch {
      // Animated may not be available in test environments
    }
  }, [visible, fallAnim]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        {/* Confetti layer */}
        <View
          style={styles.confettiContainer}
          testID="confetti-container"
          pointerEvents="none"
        >
          {confettiPieces.map((piece, i) => (
            <ConfettiDot key={i} piece={piece} fallAnim={fallAnim} />
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onDismiss}
            activeOpacity={0.8}
            testID="celebration-dismiss-button"
          >
            <Text style={styles.buttonText}>{buttonTitle}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confettiDot: {
    position: 'absolute',
    top: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    color: '#F7F7F7',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(247,247,247,0.6)',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#FF5C24',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#F7F7F7',
    fontSize: 16,
    fontWeight: '600',
  },
});
