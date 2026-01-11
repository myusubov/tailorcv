'use client';

import { Icon } from '@iconify/react';
import { type KeyboardEvent } from 'react';
import { cn } from '@heroui/react';

/**
 * Props for the SkillInlineInput component.
 */
interface SkillInlineInputProps {
  /** The current value of the input */
  value: string;
  /** Callback for value change */
  onChange: (value: string) => void;
  /** Callback for when the user submits (Enter or Checkmark) */
  onSubmit: () => void;
  /** Callback for when the user cancels (Escape or Blur) */
  onCancel: () => void;
  /** Custom placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A compact, inline input field for adding skills or categories.
 * Automatically focuses on mount and provides visual triggers for submission.
 */
export function SkillInlineInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = 'Type...',
  className,
}: SkillInlineInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className={cn(
        'bg-default-100 focus-within:border-primary/50 inline-flex items-center rounded-full border border-transparent px-2 py-0.5 transition-all',
        className,
      )}
    >
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!value.trim()) {
            onCancel();
          }
        }}
        placeholder={placeholder}
        className="placeholder:text-muted w-24 bg-transparent px-1 text-sm outline-none"
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
        onClick={onSubmit}
        className="text-primary hover:text-primary/80 hover:bg-default-200 ml-1 rounded-full p-0.5 transition-colors"
        aria-label="Confirm addition"
      >
        <Icon icon="lucide:check" className="size-3.5" />
      </button>
    </div>
  );
}
