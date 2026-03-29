/**
 * useWhatsNew — Auto-presentation hook.
 * Mirrors the WhatsNewEnvironment auto-presentation in WhatsNewKit.
 *
 * Given a WhatsNewCollection and a VersionStore, finds the latest
 * unseen version and provides it for display.
 *
 * Usage:
 *   const { whatsNew, dismiss } = useWhatsNew(collection, versionStore);
 *   return <WhatsNewSheet whatsNew={whatsNew} onDismiss={dismiss}>...</WhatsNewSheet>;
 */
import { useState, useEffect, useCallback } from 'react';
import type {
  WhatsNew,
  WhatsNewCollection,
  WhatsNewVersionStore,
} from '../types';
import { findUnpresented } from '../models/WhatsNewCollection';

interface UseWhatsNewResult {
  /** The WhatsNew to display, or null if nothing to show */
  whatsNew: WhatsNew | null;
  /** Dismiss the current WhatsNew (persists version as seen) */
  dismiss: () => void;
  /** Whether the hook is still loading from the version store */
  isLoading: boolean;
}

export function useWhatsNew(
  collection: WhatsNewCollection,
  versionStore: WhatsNewVersionStore
): UseWhatsNewResult {
  const [whatsNew, setWhatsNew] = useState<WhatsNew | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      setIsLoading(true);
      const found = await findUnpresented(collection, versionStore);
      if (!cancelled) {
        setWhatsNew(found);
        setIsLoading(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [collection, versionStore]);

  const dismiss = useCallback(() => {
    setWhatsNew(null);
    // Version is persisted by WhatsNewView's onDismiss handler
  }, []);

  return { whatsNew, dismiss, isLoading };
}
