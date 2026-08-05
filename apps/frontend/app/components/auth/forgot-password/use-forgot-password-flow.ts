'use client';

import { useEffect, useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { toast } from '@heroui/react';
import { useRouter } from 'next/navigation';

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
 * @returns Render state and callbacks for the forgot-password controllers.
 * @remarks The hook owns Clerk calls, local step transitions, navigation, toast
 * feedback, and the in-memory UI resend cooldown. Clerk's server-side rate limit
 * remains authoritative.
 */
export function useForgotPasswordFlow() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
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
     * @returns Nothing. Updates or clears the in-memory countdown state.
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

  /**
   * Activates the completed Clerk session and navigates to the signed-in route.
   *
   * @returns A promise that settles after Clerk's finalize callback completes.
   * @remarks Finalization failures use a persistent toast because the reset has
   * already reached a terminal stage and no inline error surface remains.
   */
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
      toast.danger(clerkError || 'Failed to complete password reset', {
        timeout: 0,
      });
    }
  };

  /**
   * Starts Clerk's email-code reset flow and records the first resend availability.
   *
   * @param emailAddress - Validated address that should receive the reset code.
   * @returns A promise that settles after the Clerk request finishes.
   * @remarks Advances to verification and starts the in-memory cooldown only after
   * both Clerk calls succeed.
   */
  const handleEmailSubmit = async (emailAddress: string) => {
    if (fetchStatus === 'fetching' || !signIn) return;
    try {
      const { error: createError } = await signIn.create({
        identifier: emailAddress,
      });

      if (createError) {
        console.error(JSON.stringify(createError, null, 2));
        const clerkError = getClerkErrorMessage(createError);
        toast.danger(clerkError || 'Failed to send reset code');
        return;
      }

      const { error: sendCodeError } =
        await signIn.resetPasswordEmailCode.sendCode();

      if (sendCodeError) {
        console.error(JSON.stringify(sendCodeError, null, 2));
        const clerkError = getClerkErrorMessage(sendCodeError);
        toast.danger(clerkError || 'Failed to send reset code');
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
      toast.danger(clerkError || 'Failed to send reset code');
    }
  };

  /**
   * Requests another reset code for the active Clerk reset attempt.
   *
   * @returns A promise that settles after the resend attempt and UI state cleanup.
   * @remarks Rejects concurrent or early attempts, shows feedback through toasts,
   * and restarts the in-memory cooldown only after Clerk reports success.
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
    try {
      const { error } = await signIn.resetPasswordEmailCode.sendCode();
      if (error) {
        console.error(JSON.stringify(error, null, 2));
        const clerkError = getClerkErrorMessage(error);
        toast.danger(clerkError || 'Failed to send reset code');
        return;
      }

      const availableAt = Date.now() + RESEND_COOLDOWN_MS;

      setResendAvailableAt(availableAt);
      setRemainingSeconds(Math.ceil((availableAt - Date.now()) / 1000));

      toast.success('A new verification code was sent. Check your email.');
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      toast.danger(clerkError || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  /**
   * Verifies the entered email code with Clerk.
   *
   * @returns A promise that settles after verification and state cleanup.
   * @remarks Successful verification advances to password entry; failures are
   * reported through a toast while keeping the verification step active.
   */
  const handleVerifyCode = async () => {
    if (fetchStatus === 'fetching' || !signIn) return;
    setIsVerifyingCode(true);
    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({
        code,
      });

      if (error) {
        toast.danger(
          getClerkErrorMessage(error) || 'Failed to verify reset code',
        );
        return;
      }

      setStep('set-password');
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      toast.danger(clerkError || 'Failed to verify reset code');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  /**
   * Submits the new password and resolves Clerk's resulting sign-in state.
   *
   * @param args - Validated password values required by Clerk.
   * @returns A promise that settles after submission and any required finalization.
   * @remarks Terminal outcomes that need user action remain visible in persistent
   * toasts; retryable submission failures use the standard toast duration.
   */
  const handleSetPassword = async ({ password }: SetPasswordArgs) => {
    if (fetchStatus === 'fetching' || !signIn) return;
    try {
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({
        password,
      });

      if (error) {
        toast.danger(
          getClerkErrorMessage(error) || 'Failed to set new password',
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
        toast.danger(
          'Your password was updated, but this account requires an additional MFA step before sign-in can complete.',
          {
            timeout: 0,
          },
        );
        return;
      }

      toast.danger(
        `Password reset finished with an unexpected sign-in status: ${outcome.status?.replace(/_/g, ' ') || 'unknown'}.`,
        { timeout: 0 },
      );
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      toast.danger(clerkError || 'Failed to set your new password');
    }
  };

  /**
   * Returns the mounted recovery flow to its initial email step.
   *
   * @returns Nothing. Clears the email and verification-code state.
   */
  const handleBack = () => {
    setStep('email');
    setEmail('');
    setCode('');
  };

  return {
    step,
    email,
    code,
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
