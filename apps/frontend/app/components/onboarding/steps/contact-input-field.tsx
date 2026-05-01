'use client';

import { FieldError, Input, Label, TextField } from '@heroui/react';
import type { InputHTMLAttributes } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import type { OnboardingFormInput } from '@/lib/schemas/onboarding';

type ContactFieldName =
  | 'contact.firstName'
  | 'contact.lastName'
  | 'contact.email'
  | 'contact.phone'
  | 'contact.location'
  | 'contact.githubUrl'
  | 'contact.linkedinUrl'
  | 'contact.websiteUrl';

interface ContactInputFieldProps {
  name: ContactFieldName;
  label: string;
  placeholder: string;
  isRequired?: boolean;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  useEmptyFallback?: boolean;
}

/**
 * Renders a single contact input bound to the onboarding form.
 *
 * It keeps the contact step's repeated React Hook Form and HeroUI field wiring in
 * one place while leaving layout, ordering, and navigation in the parent step.
 */
export function ContactInputField({
  name,
  label,
  placeholder,
  isRequired,
  type,
  useEmptyFallback,
}: ContactInputFieldProps) {
  const { control } = useFormContext<OnboardingFormInput>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          isRequired={isRequired}
          className="w-full"
          isInvalid={!!fieldState.error}
        >
          <Label>{label}</Label>
          <Input
            {...field}
            value={useEmptyFallback ? field.value || '' : field.value ?? ''}
            type={type}
            placeholder={placeholder}
          />
          {fieldState.error && (
            <FieldError>{fieldState.error.message}</FieldError>
          )}
        </TextField>
      )}
    />
  );
}
