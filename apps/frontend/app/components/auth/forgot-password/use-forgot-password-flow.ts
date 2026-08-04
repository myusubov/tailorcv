'use client';

import { useEffect, useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { resolveForgotPasswordCompletion } from '@/lib/auth/clerk-flow';
import { config } from '@/lib/config';
import { getClerkErrorMessage } from '@/lib/utils/utils';

export type ResetStep = 'email' | 'verify-code' | 'set-password';

const RESEND_COOLDOWN_MS = 60_000;

interface SetPasswordArgs {
  password: string;
}

/**
 * Controls the custom forgot-password flow across email entry, code verification,
 * and new-password submission.
 *
 * @returns Render state and callbacks for the forgot-password controllers, including
 * the best-effort resend-cooldown restoration state.
 * @remarks The hook owns Clerk calls, local step transitions, navigation after a
 * successful reset, and session-storage access for the UI-only cooldown. Clerk's
 * server-side rate limit remains authoritative. Countdown state updates are owned
 * here, while view-level resend enforcement is not yet implemented.
 */
export function useForgotPasswordFlow() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(
    null,
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (signIn?.status === 'needs_new_password') {
      setStep('set-password');
    }
  }, [signIn]);

  // Regularly update the remaining seconds until the resend cooldown expires.

  useEffect(() => {
    if (resendAvailableAt === null) {
      return;
    }

    /**
     * Recalculates the cooldown from its absolute timestamp.
     *
     * @returns Nothing. Updates countdown state and removes expired best-effort
     * session storage as side effects.
     */
    const updateRemainingSeconds = () => {
      const remaining = Math.ceil((resendAvailableAt - Date.now()) / 1000);
      if (remaining <= 0) {
        setRemainingSeconds(null);
        setResendAvailableAt(null);
      } else {
        setRemainingSeconds(remaining);
      }
    };

    updateRemainingSeconds();

    const intervalId = setInterval(() => updateRemainingSeconds(), 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [resendAvailableAt]);

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

  /**
   * Starts Clerk's email-code reset flow and records the first resend availability.
   *
   * @param emailAddress - Validated address that should receive the reset code.
   * @returns A promise that settles after Clerk and best-effort storage work finish.
   * @remarks Advances to verification only after both Clerk calls succeed. A storage
   * failure is logged but does not turn a successfully sent code into a failed request.
   */
  const handleEmailSubmit = async (emailAddress: string) => {
    if (fetchStatus === 'fetching' || !signIn) return;
    setGlobalError('');

    try {
      const { error: createError } = await signIn.create({
        identifier: emailAddress,
      });

      if (createError) {
        console.error(JSON.stringify(createError, null, 2));
        const clerkError = getClerkErrorMessage(createError);
        setGlobalError(clerkError || 'Failed to send reset code');
        return;
      }

      const { error: sendCodeError } =
        await signIn.resetPasswordEmailCode.sendCode();

      if (sendCodeError) {
        console.error(JSON.stringify(sendCodeError, null, 2));
        const clerkError = getClerkErrorMessage(sendCodeError);
        setGlobalError(clerkError || 'Failed to send reset code');
        return;
      }

      const availableAt = Date.now() + RESEND_COOLDOWN_MS;

      setResendAvailableAt(availableAt);
      setRemainingSeconds(Math.ceil((availableAt - Date.now()) / 1000));
      setEmail(emailAddress);
      setStep('verify-code');
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Failed to send reset code');
    }
  };

  /**
   * Requests another reset code for the active Clerk reset attempt.
   *
   * @returns A promise that settles after the resend attempt and UI state cleanup.
   * @remarks Shows a success toast only when Clerk reports success. This handler does
   * not yet restart or enforce the local cooldown.
   */
  const handleResend = async () => {
    const isCooldownActive =
      resendAvailableAt !== null && resendAvailableAt > Date.now();
    if (
      fetchStatus === 'fetching' ||
      !signIn ||
      !email ||
      isCooldownActive ||
      isResending
    ) {
      return;
    }

    setIsResending(true);
    setGlobalError('');

    try {
      const { error } = await signIn.resetPasswordEmailCode.sendCode();
      if (error) {
        console.error(JSON.stringify(error, null, 2));
        const clerkError = getClerkErrorMessage(error);
        setGlobalError(clerkError || 'Failed to send reset code');
        return;
      }

      const availableAt = Date.now() + RESEND_COOLDOWN_MS;

      setResendAvailableAt(availableAt);
      setRemainingSeconds(Math.ceil((availableAt - Date.now()) / 1000));

      toast.success('A new verification code was sent. Check your email.');
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
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({
        code,
      });

      if (error) {
        setGlobalError(
          getClerkErrorMessage(error) || 'Failed to verify reset code',
        );
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

  const handleSetPassword = async ({ password }: SetPasswordArgs) => {
    if (fetchStatus === 'fetching' || !signIn) return;
    setGlobalError('');

    try {
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({
        password,
      });

      if (error) {
        setGlobalError(
          getClerkErrorMessage(error) || 'Failed to set your new password',
        );
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
    resendAvailableAt,
    remainingSeconds,
    handleBack,
    handleEmailSubmit,
    handleResend,
    handleSetPassword,
    handleVerifyCode,
    setCode,
  };
}
