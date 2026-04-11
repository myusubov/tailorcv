'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useClerk, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { clearSSOFlowState, hasActiveSSOFlow } from '@/lib/auth/sso-flow';
import { config } from '@/lib/config';
import {
  ssoContinueSchema,
  type SSOContinueFormValues,
} from '@/lib/schemas/auth';
import { getClerkErrorMessage } from '@/lib/utils/utils';

export interface UseSSOContinueFlowResult {
  control: ReturnType<typeof useForm<SSOContinueFormValues>>['control'];
  isSubmitting: boolean;
  globalError: string;
  signUp: ReturnType<typeof useSignUp>['signUp'];
  handleSubmit: () => Promise<void>;
}

/**
 * Controls the OAuth sign-up continuation form used when required profile fields are missing.
 * The hook keeps the form aligned with Clerk's current sign-up snapshot, rejects direct access
 * without a verified external account, updates the sign-up through Clerk's client API, and
 * finalizes navigation after completion.
 */
export function useSSOContinueFlow(): UseSSOContinueFlowResult {
  const clerk = useClerk();
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();
  const [globalError, setGlobalError] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<SSOContinueFormValues>({
    resolver: zodResolver(ssoContinueSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
    },
  });

  useEffect(() => {
    if (!signUp) return;

    reset({
      firstName: signUp.firstName ?? '',
      lastName: signUp.lastName ?? '',
    });
  }, [reset, signUp]);

  useEffect(() => {
    if (!hasActiveSSOFlow()) {
      clearSSOFlowState();
      router.replace('/register');
      return;
    }

    const hasVerifiedExternalAccount =
      signUp?.verifications.externalAccount.status === 'verified';

    if (
      fetchStatus === 'idle' &&
      (signUp?.status !== 'missing_requirements' || !hasVerifiedExternalAccount)
    ) {
      clearSSOFlowState();
      router.replace('/register');
    }
  }, [fetchStatus, router, signUp]);

  const submitContinuation = async ({
    firstName,
    lastName,
  }: SSOContinueFormValues) => {
    if (!signUp) return;

    setGlobalError('');

    try {
      await clerk.client!.signUp.update({ firstName, lastName });

      if (signUp.status === 'complete') {
        const { error } = await signUp.finalize({
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) return;

            clearSSOFlowState();
            const url = decorateUrl(config.auth.afterSignUpUrl);
            if (url.startsWith('http')) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });

        if (error) {
          setGlobalError(getClerkErrorMessage(error) || 'Failed to complete sign up');
          return;
        }

        return;
      }

      setGlobalError(
        `Unexpected sign-up status: ${signUp.status?.replace(/_/g, ' ') || 'unknown'}. Please try again.`,
      );
    } catch (err: unknown) {
      setGlobalError(getClerkErrorMessage(err) || 'Something went wrong');
    }
  };

  return {
    control,
    isSubmitting,
    globalError,
    signUp,
    handleSubmit: handleSubmit(submitContinuation),
  };
}
