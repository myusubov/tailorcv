'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import type { useSignUp } from '@clerk/nextjs';

import { config } from '@/lib/config';
import { getClerkErrorMessage } from '@/lib/utils/utils';

interface UseRegistrationVerificationFlowArgs {
  signUp: ReturnType<typeof useSignUp>['signUp'];
}

export interface UseRegistrationVerificationFlowResult {
  code: string;
  globalError: string;
  isResending: boolean;
  isVerifying: boolean;
  handleCodeChange: (code: string) => void;
  handleResend: () => Promise<void>;
  handleVerification: (event: React.FormEvent) => Promise<void>;
}

/**
 * Handles email-code verification for the custom sign-up flow.
 * The hook owns OTP state, resend behavior, and finalizes sign-up when Clerk reports
 * completion after verification; otherwise it surfaces an explicit unexpected-state error.
 */
export function useRegistrationVerificationFlow({
  signUp,
}: UseRegistrationVerificationFlowArgs): UseRegistrationVerificationFlowResult {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleResend = async () => {
    if (!signUp) return;
    setResending(true);
    setGlobalError('');

    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) {
        console.error(JSON.stringify(error, null, 2));
        const clerkError = getClerkErrorMessage(error);
        setGlobalError(clerkError || 'Verification failed');
        return;
      }

      toast.success('Verification code resent');
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleVerification = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!signUp) return;
    setIsVerifying(true);

    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) {
        console.error(JSON.stringify(error, null, 2));
        const clerkError = getClerkErrorMessage(error);
        setGlobalError(clerkError || 'Verification failed');
        return;
      }

      if (signUp.status === 'complete') {
        const { error: finalizeError } = await signUp.finalize({
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              console.log('Session task triggered', session.currentTask);
              return;
            }

            const url = decorateUrl(config.auth.afterSignUpUrl);
            if (url.startsWith('http')) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });

        if (finalizeError) {
          console.error(JSON.stringify(finalizeError, null, 2));
          const clerkError = getClerkErrorMessage(finalizeError);
          setGlobalError(clerkError || 'Failed to complete sign up');
          return;
        }

        return;
      }

      setGlobalError(
        `Unexpected verification status: ${signUp.status?.replace(/_/g, ' ') || 'unknown'}. Please try again.`,
      );
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    code,
    globalError,
    isResending: resending,
    isVerifying,
    handleCodeChange: setCode,
    handleResend,
    handleVerification,
  };
}
