'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

import {
  EmailEntryView,
  ResetPasswordView,
} from '@/app/components/auth/forgot-password';
import { getClerkErrorMessage } from '@/lib/utils';
import { config } from '@/lib/config';

export default function ForgotPasswordPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Send password reset code to email
  const handleEmailSubmit = async (emailAddress: string) => {
    if (!isLoaded) return;
    setGlobalError('');

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: emailAddress,
      });
      setEmail(emailAddress);
      setStep('reset');
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Failed to send reset code');
    }
  };

  // Resend the reset code
  const handleResend = async () => {
    if (!isLoaded || !email) return;
    setIsResending(true);
    setGlobalError('');

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  // Reset password with code
  const handleResetSubmit = async (password: string) => {
    if (!isLoaded) return;
    setGlobalError('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result.status === 'needs_second_factor') {
        setGlobalError('Two-factor authentication is required');
      } else if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push(config.auth.afterSignInUrl);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Failed to reset password');
    }
  };

  // Handle going back to email entry
  const handleBack = () => {
    setStep('email');
    setCode('');
    setGlobalError('');
  };

  if (step === 'reset') {
    return (
      <ResetPasswordView
        email={email}
        code={code}
        onCodeChange={setCode}
        onSubmit={handleResetSubmit}
        onResend={handleResend}
        onBack={handleBack}
        globalError={globalError}
        isResending={isResending}
      />
    );
  }

  return (
    <EmailEntryView onSubmit={handleEmailSubmit} globalError={globalError} />
  );
}
