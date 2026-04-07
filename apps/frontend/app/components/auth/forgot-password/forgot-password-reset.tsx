'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/lib/schemas/auth';

import { ResetPasswordView } from './reset-password-view';

type ResetPasswordStep = 'verify-code' | 'set-password';

interface ForgotPasswordResetProps {
  email: string;
  step: ResetPasswordStep;
  code: string;
  onCodeChange: (code: string) => void;
  onVerifyCode: () => Promise<void>;
  onSetPassword: ({ password }: { password: string }) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  globalError: string;
  isResending: boolean;
  isVerifyingCode: boolean;
}

export function ForgotPasswordReset({
  email,
  step,
  code,
  onCodeChange,
  onVerifyCode,
  onSetPassword,
  onResend,
  onBack,
  globalError,
  isResending,
  isVerifyingCode,
}: ForgotPasswordResetProps) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  const handleFormSubmit = async ({ password }: ResetPasswordFormValues) => {
    await onSetPassword({ password });
  };

  return (
    <ResetPasswordView
      control={control}
      isSubmitting={isSubmitting}
      email={email}
      step={step}
      code={code}
      onCodeChange={onCodeChange}
      onVerifyCode={onVerifyCode}
      onSetPassword={handleSubmit(handleFormSubmit)}
      onResend={onResend}
      onBack={onBack}
      globalError={globalError}
      isResending={isResending}
      isVerifyingCode={isVerifyingCode}
    />
  );
}
