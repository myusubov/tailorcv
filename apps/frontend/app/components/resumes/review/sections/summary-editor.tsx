'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { TextField, Label, TextArea, FieldError } from '@heroui/react';
import type { BaseResumeData } from 'shared';

/**
 * Compact summary/professional statement editor for the review page accordion.
 * Uses a textarea for the summary content.
 */
export function SummaryEditor() {
  const { control } = useFormContext<BaseResumeData>();

  return (
    <div className="space-y-3">
      <Controller
        name="summary"
        control={control}
        render={({ field, fieldState }) => (
          <TextField className="w-full" isInvalid={!!fieldState.error}>
            <Label>Professional Summary</Label>
            <TextArea
              {...field}
              value={field.value || ''}
              placeholder="Write a brief professional summary highlighting your key skills and experience..."
              className="min-h-[120px]"
            />
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </TextField>
        )}
      />
      <p className="text-muted text-xs">
        Aim for 2-4 sentences that capture your professional identity.
      </p>
    </div>
  );
}
