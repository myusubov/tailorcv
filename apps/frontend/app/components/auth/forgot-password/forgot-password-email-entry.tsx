'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/lib/schemas/auth';

import { EmailEntryView } from './email-entry-view';

interface ForgotPasswordEmailEntryProps {
  onSubmit: (email: string) => Promise<void>;
}

/**
 * Connects the forgot-password email form to its validated submit callback.
 *
 * @param props - Callback that starts the reset flow with a validated email.
 * @returns The controlled email-entry view.
 */
export function ForgotPasswordEmailEntry({
  onSubmit,
}: ForgotPasswordEmailEntryProps) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onSubmit',
  });

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
