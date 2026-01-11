'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { TextField, Label, Input, FieldError } from '@heroui/react';
import type { BaseResumeData } from 'shared';

/**
 * Compact contact information editor for the review page accordion.
 * Uses a 2-column grid layout for space efficiency.
 */
export function ContactEditor() {
  const { control } = useFormContext<BaseResumeData>();

  return (
    <div className="space-y-3">
      {/* Name row */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name="contact.firstName"
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>First Name *</Label>
              <Input {...field} placeholder="John" />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />

        <Controller
          name="contact.lastName"
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Last Name *</Label>
              <Input {...field} placeholder="Doe" />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />
      </div>

      {/* Email and Phone row */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name="contact.email"
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Email *</Label>
              <Input {...field} type="email" placeholder="john@example.com" />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />

        <Controller
          name="contact.phone"
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>Phone</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="+1 555 123 4567"
              />
            </TextField>
          )}
        />
      </div>

      {/* Location */}
      <Controller
        name="contact.location"
        control={control}
        render={({ field }) => (
          <TextField className="w-full">
            <Label>Location</Label>
            <Input
              {...field}
              value={field.value || ''}
              placeholder="San Francisco, CA"
            />
          </TextField>
        )}
      />

      {/* URLs row */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name="contact.linkedinUrl"
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>LinkedIn URL</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="linkedin.com/in/username"
              />
            </TextField>
          )}
        />

        <Controller
          name="contact.githubUrl"
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>GitHub URL</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="github.com/username"
              />
            </TextField>
          )}
        />
      </div>

      {/* Website */}
      <Controller
        name="contact.websiteUrl"
        control={control}
        render={({ field }) => (
          <TextField className="w-full">
            <Label>Website</Label>
            <Input
              {...field}
              value={field.value || ''}
              placeholder="yourwebsite.com"
            />
          </TextField>
        )}
      />
    </div>
  );
}
