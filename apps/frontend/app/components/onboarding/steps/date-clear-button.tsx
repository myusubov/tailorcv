'use client';

import { Icon } from '@iconify/react';

interface DateClearButtonProps {
  /** Accessible label for the clear action. */
  label: string;
  /** Clears the current date value. */
  onClear: () => void;
}

/**
 * Clears a DatePicker value without allowing the click to open or focus
 * the surrounding picker trigger.
 */
export function DateClearButton({ label, onClear }: DateClearButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClear();
      }}
      onMouseDown={(event) => event.preventDefault()}
      onKeyDown={(event) => event.stopPropagation()}
      className="text-muted hover:bg-default/40 hover:text-foreground focus-visible:ring-focus flex size-5 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <Icon icon="lucide:x" className="size-4" />
    </button>
  );
}
