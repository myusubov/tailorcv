'use client';

import { Spinner, cn, useIsHydrated } from '@heroui/react';
import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

export interface GlobalLoadingProps {
  title: string;
  description?: string;
  className?: string;
}


/**
 * Renders a blocking, full-viewport loading status directly under the document body.
 *
 * The component accepts user-facing title and description text, returns no server
 * markup before hydration, and restores the body's previous overflow style when it
 * unmounts. Its portal and fixed overlay intentionally escape ancestor layout,
 * overflow, and stacking contexts.
 */
export function GlobalLoading({
  title,
  description,
  className,
}: GlobalLoadingProps) {

  const isHydrated = useIsHydrated()

  useEffect(() => {
    if (!isHydrated) return undefined;

    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isHydrated]);

  if (!isHydrated) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-atomic="true"
      className={cn(
        'bg-background fixed inset-0 z-100 flex h-dvh w-full items-center justify-center px-6',
        className,
      )}
    >
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full ring-1 ring-primary/15">
          <Spinner aria-hidden="true" color="current" size="lg" />
        </div>

        <div className="space-y-1.5">
          <p className="text-foreground text-base font-semibold">{title}</p>
          {description ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
