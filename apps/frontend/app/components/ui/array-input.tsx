'use client';

import { useState, useEffect } from 'react';
import { TextField, Label, Input, Description } from '@heroui/react';

/**
 * Props for the ArrayInput component.
 */
interface ArrayInputProps {
  /** The current array value */
  value: string[] | null;
  /** Callback when the array value changes (on blur) */
  onChange: (val: string[] | null) => void;
  /** Callback on blue */
  onBlur?: () => void;
  /** Label for the input */
  label: string;
  /** Placeholder for the input */
  placeholder?: string;
  /** Optional description text */
  description?: string;
  /** Optional className for the container */
  className?: string;
}

/**
 * Generic input component that handles string-to-array conversion via comma separation.
 * Updates the actual array value only on blur to prevent cursor issues while typing.
 */
export function ArrayInput({
  value,
  onChange,
  onBlur,
  label,
  placeholder,
  description,
  className,
}: ArrayInputProps) {
  const [inputValue, setInputValue] = useState(
    Array.isArray(value) ? value.join(', ') : '',
  );

  // Sync with external changes (e.g. form reset)
  useEffect(() => {
    const newVal = Array.isArray(value) ? value.join(', ') : '';
    if (newVal !== inputValue) {
      setInputValue(newVal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleBlur = () => {
    const arr = inputValue
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onChange(arr.length ? arr : null);
    onBlur?.();
  };

  return (
    <TextField className={className}>
      <Label>{label}</Label>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
      {description && <Description>{description}</Description>}
    </TextField>
  );
}
