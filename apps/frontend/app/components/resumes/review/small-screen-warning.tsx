'use client';

import { useState } from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

/**
 * Overlay component that warns users when they are on a small screen.
 * Recommends switching to a desktop for a better editing experience.
 */
export function SmallScreenWarning() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-background/60 fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md xl:hidden">
      <div className="bg-surface border-border flex max-w-sm flex-col items-center rounded-3xl border p-8 text-center shadow-2xl">
        <div className="bg-accent/10 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl">
          <Icon icon="lucide:monitor" className="text-accent h-10 w-10" />
        </div>
        <h2 className="text-foreground mb-3 text-2xl font-bold tracking-tight">
          Desktop Recommended
        </h2>
        <p className="text-muted mb-8 text-sm leading-relaxed">
          Resume editing requires precision and a side-by-side view for the best
          results. We recommend switching to a larger screen for a professional
          experience.
        </p>
        <Button
          className="w-full font-semibold"
          onPress={() => setIsVisible(false)}
        >
          Continue on Mobile
        </Button>
      </div>
    </div>
  );
}
