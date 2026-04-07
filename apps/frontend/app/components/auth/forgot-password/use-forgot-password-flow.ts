'use client';

import { useEffect, useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

import { resolveForgotPasswordCompletion } from '@/lib/auth/clerk-flow';
import { config } from '@/lib/config';
import { getClerkErrorMessage } from '@/lib/utils/utils';

export type ResetStep = 'email' | 'verify-code' | 'set-password';

interface SetPasswordArgs {
  password: string;
}

export function useForgotPasswordFlow() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  useEffect(() => {
    if (signIn?.status === 'needs_new_password') {
      setStep('set-password');
    }
  }, [signIn]);

  const finalizeReset = async () => {
    if (!signIn) return;

    const { error } = await signIn.finalize({
      navigate: async ({ session, decorateUrl }) => {
        if (session?.currentTask) return;

        const url = decorateUrl(config.auth.afterSignInUrl);
        if (url.startsWith('http')) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      const clerkError = getClerkErrorMessage(error);
      setGlobalError(clerkError || 'Failed to complete password reset');
    }
  };

  const handleEmailSubmit = async (emailAddress: string) => {
    if (fetchStatus === 'fetching' || !signIn) return;
    setGlobalError('');

    try {
      await signIn.create({ identifier: emailAddress });
      await signIn.resetPasswordEmailCode.sendCode();
      setEmail(emailAddress);
      setStep('verify-code');
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Failed to send reset code');
    }
  };

  const handleResend = async () => {
    if (fetchStatus === 'fetching' || !signIn || !email) return;
    setIsResending(true);
    setGlobalError('');

    try {
      const { error } = await signIn.resetPasswordEmailCode.sendCode();
      if (error) {
        console.error(JSON.stringify(error, null, 2));
        const clerkError = getClerkErrorMessage(error);
        setGlobalError(clerkError || 'Failed to send reset code');
      }
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (fetchStatus === 'fetching' || !signIn) return;
    setIsVerifyingCode(true);
    setGlobalError('');

    try {
      // Why: Clerk's reset flow reports verification failures through the
      // returned error object, so the UI can advance on success without reading
      // a stale `signIn.status` snapshot in the same tick.
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({
        code,
      });

      if (error) {
        setGlobalError(getClerkErrorMessage(error) || 'Failed to verify reset code');
        return;
      }

      setStep('set-password');
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Failed to verify reset code');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSetPassword = async ({
    password,
  }: SetPasswordArgs) => {
    if (fetchStatus === 'fetching' || !signIn) return;
    setGlobalError('');

    try {
      // Why: Clerk completes the reset flow when `submitPassword()` succeeds, so
      // the page should branch on Clerk's documented post-submit sign-in states
      // instead of assuming every successful password write can finalize immediately.
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({
        password,
      });

      if (error) {
        setGlobalError(getClerkErrorMessage(error) || 'Failed to set your new password');
        return;
      }

      const outcome = resolveForgotPasswordCompletion({
        status: signIn.status,
      });

      if (outcome.type === 'finalize') {
        await finalizeReset();
        return;
      }

      if (outcome.type === 'needs_second_factor') {
        setGlobalError(
          'Your password was updated, but this account requires an additional MFA step before sign-in can complete.',
        );
        return;
      }

      setGlobalError(
        `Password reset finished with an unexpected sign-in status: ${outcome.status?.replace(/_/g, ' ') || 'unknown'}.`,
      );
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Failed to set your new password');
    }
  };

  const handleBack = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setGlobalError('');
  };

  return {
    step,
    email,
    code,
    globalError,
    isResending,
    isVerifyingCode,
    handleBack,
    handleEmailSubmit,
    handleResend,
    handleSetPassword,
    handleVerifyCode,
    setCode,
  };
}
