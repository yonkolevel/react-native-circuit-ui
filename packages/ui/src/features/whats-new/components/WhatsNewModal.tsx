/**
 * WhatsNewModal — Legacy simple modal API.
 *
 * Thin wrapper over WhatsNewView + Modal for backward compatibility
 * with the whatsNewStore's simple WhatsNewItem[] interface.
 *
 * For full WhatsNewKit-style usage, use <WhatsNewSheet> or <WhatsNewView> directly.
 *
 * Usage:
 *   const { isVisible, items, didFinish } = useWhatsNewStore();
 *   <WhatsNewModal visible={isVisible} items={items} onDismiss={didFinish} />
 */
import { Modal } from 'react-native';
import type { WhatsNewItem, WhatsNew as WhatsNewModel } from '../types';
import { WhatsNewView } from './WhatsNewView';

export interface WhatsNewModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Optional title override (default: "What's New") */
  title?: string;
  /** Feature items (legacy format from whatsNewStore) */
  items: WhatsNewItem[];
  /** Action button title (default: "Continue") */
  actionTitle?: string;
  /** Called when user dismisses the modal */
  onDismiss: () => void;
}

/**
 * Convert legacy WhatsNewItem[] to a WhatsNew model.
 */
function itemsToWhatsNew(
  items: WhatsNewItem[],
  title?: string,
  actionTitle?: string
): WhatsNewModel {
  return {
    version: { major: 0, minor: 0, patch: 0 },
    title: title ?? "What's New",
    features: items.map((item) => ({
      image: { type: 'systemName' as const, name: item.imageName },
      title: item.title,
      subtitle: item.description,
    })),
    primaryAction: actionTitle ? { title: actionTitle } : undefined,
  };
}

export function WhatsNewModal({
  visible,
  title,
  items,
  actionTitle,
  onDismiss,
}: WhatsNewModalProps) {
  const whatsNew = itemsToWhatsNew(items, title, actionTitle);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      transparent={false}
    >
      {visible && <WhatsNewView whatsNew={whatsNew} onDismiss={onDismiss} />}
    </Modal>
  );
}
