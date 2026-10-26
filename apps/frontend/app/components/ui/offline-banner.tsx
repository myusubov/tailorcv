'use client';

import { useSyncExternalStore } from 'react';
import { Icon } from '@iconify/react';
import { onlineManager } from '@tanstack/react-query';

/**
 * Shows a banner while the browser is offline.
 * Reads the same online state that pauses React Query requests, so the banner
 * and the paused loading states always agree.
 */
export function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    // The server cannot know; assuming online avoids a hydration mismatch.
    () => true,
  );

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="bg-surface text-muted border-separator fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 border-b px-4 py-2 text-sm"
    >
      <Icon icon="lucide:wifi-off" aria-hidden="true" />
      <span>You&apos;re offline. We&apos;ll continue when your connection returns.</span>
    </div>
  );
}
