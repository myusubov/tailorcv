'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

import {
  EmailEntryView,
  ResetPasswordView,
} from '@/app/components/auth/forgot-password';
import { getClerkErrorMessage } from '@/lib/utils/utils';
import { config } from '@/lib/config';

export default function ForgotPasswordPage() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Send password reset code to email
  const handleEmailSubmit = async (emailAddress: string) => {
    if (fetchStatus === 'fetching' || !signIn) return;
    setGlobalError('');

    try {
      await signIn.create({ identifier: emailAddress });
      await signIn.resetPasswordEmailCode.sendCode();
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
    if (fetchStatus === 'fetching' || !signIn || !email) return;
    setIsResending(true);
    setGlobalError('');

    try {
      await signIn.create({ identifier: email });
      await signIn.resetPasswordEmailCode.sendCode();
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
    if (fetchStatus === 'fetching' || !signIn) return;
    setGlobalError('');

    try {
      await signIn.resetPasswordEmailCode.verifyCode({ code });
      await signIn.resetPasswordEmailCode.submitPassword({ password });

      if (signIn.status === 'needs_second_factor') {
        setGlobalError('Two-factor authentication is required');
      } else if (signIn.status === 'complete') {
        await signIn.finalize();
        router.push(config.auth.afterSignInUrl);
      } else {
        console.log(JSON.stringify({ status: signIn.status }, null, 2));
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
