'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/lib/schemas/auth';

import { EmailEntryView } from './email-entry-view';
import { useEffect } from 'react';

interface ForgotPasswordEmailEntryProps {
  onSubmit: (email: string) => Promise<void>;
  email?: string;
}

/**
 * Connects the forgot-password email form to its validated submit callback.
 *
 * @param props - Callback that starts the reset flow with a validated email.
 * @returns The controlled email-entry view.
 */
export function ForgotPasswordEmailEntry({
  onSubmit,
  email,
}: ForgotPasswordEmailEntryProps) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: email ?? '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (email) {
      setValue('email', email);
    }
  }, [email, setValue]);

  const handleFormSubmit = async ({ email }: ForgotPasswordFormValues) => {
    await onSubmit(email);
  };

  return (
    <EmailEntryView
      control={control}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(handleFormSubmit)}
    />
  );
}
