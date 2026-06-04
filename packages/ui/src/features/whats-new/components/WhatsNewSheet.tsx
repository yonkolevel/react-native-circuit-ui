/**
 * WhatsNewSheet — Auto-presenting modal wrapper.
 * Mirrors .whatsNewSheet() view modifier in WhatsNewKit.
 *
 * Wraps children and shows a WhatsNewView in a Modal when whatsNew is not null.
 *
 * Usage:
 *   <WhatsNewSheet
 *     whatsNew={currentWhatsNew}
 *     versionStore={store}
 *     onDismiss={() => setWhatsNew(null)}
 *   >
 *     <App />
 *   </WhatsNewSheet>
 */
import { Modal } from 'react-native';
import type { WhatsNewSheetProps } from '../types';
import { WhatsNewView } from './WhatsNewView';

export function WhatsNewSheet({
  whatsNew,
  versionStore,
  layout,
  onDismiss,
  children,
}: WhatsNewSheetProps) {
  return (
    <>
      {children}
      <Modal
        visible={whatsNew != null}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
        onRequestClose={onDismiss}
      >
        {whatsNew != null && (
          <WhatsNewView
            whatsNew={whatsNew}
            versionStore={versionStore}
            layout={layout}
            onDismiss={onDismiss}
          />
        )}
      </Modal>
    </>
  );
}
