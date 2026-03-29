/**
 * Haptic feedback utility — mirrors WhatsNew+HapticFeedback.swift.
 *
 * Uses expo-haptics if available, falls back to no-op.
 */
import type { WhatsNewHapticFeedback } from '../types';

let Haptics: typeof import('expo-haptics') | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require('expo-haptics');
} catch {
  // expo-haptics not installed — haptics are optional
}

/**
 * Fire haptic feedback matching the WhatsNewKit HapticFeedback enum.
 */
export async function fireHaptic(
  feedback: WhatsNewHapticFeedback | undefined
): Promise<void> {
  if (!feedback || !Haptics) return;

  switch (feedback.type) {
    case 'impact': {
      const styleMap = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      } as const;
      await Haptics.impactAsync(
        styleMap[feedback.style ?? 'medium']
      );
      break;
    }
    case 'selection':
      await Haptics.selectionAsync();
      break;
    case 'notification': {
      const typeMap = {
        success: Haptics.NotificationFeedbackType.Success,
        warning: Haptics.NotificationFeedbackType.Warning,
        error: Haptics.NotificationFeedbackType.Error,
      } as const;
      await Haptics.notificationAsync(
        typeMap[feedback.style ?? 'success']
      );
      break;
    }
  }
}
