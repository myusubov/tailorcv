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

  // Why: OAuth providers can pre-populate profile fields, so the continuation
  // form should stay in sync with Clerk's current sign-up snapshot.
  useEffect(() => {
    if (!signUp) return;

    reset({
      firstName: signUp.firstName ?? '',
      lastName: signUp.lastName ?? '',
    });
  }, [reset, signUp]);

  // Why: This page is only valid for an in-progress OAuth sign-up with verified
  // external account data and missing required fields. Any other state is stale or direct access.
  useEffect(() => {
    const hasVerifiedExternalAccount =
      signUp?.verifications.externalAccount.status === 'verified';

    if (
      fetchStatus === 'idle' &&
      (!hasActiveSSOFlow() ||
        signUp?.status !== 'missing_requirements' ||
        !hasVerifiedExternalAccount)
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
      // Why: SignUpFutureResource.update() still targets the wrong Clerk endpoint,
      // so the continuation flow must update through clerk.client.signUp.
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
