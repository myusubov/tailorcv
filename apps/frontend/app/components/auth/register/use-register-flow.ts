import { useSignUp } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { beginSSOFlow } from '@/lib/auth/sso-flow';
import { config } from '@/lib/config';
import { registerSchema, type RegisterFormValues } from '@/lib/schemas/auth';
import { getClerkErrorMessage } from '@/lib/utils/utils';

import type { RegisterFormViewProps } from './register-form-view';

interface RegistrationVerificationViewProps {
  signUp: ReturnType<typeof useSignUp>['signUp'];
  email: string;
  resetForm: ReturnType<typeof useForm<RegisterFormValues>>['reset'];
  onGoBack: () => void;
}

export type UseRegisterFlowResult =
  | {
      mode: 'form';
      formViewProps: RegisterFormViewProps;
    }
  | {
      mode: 'verification';
      verificationViewProps: RegistrationVerificationViewProps;
    };

/**
 * Orchestrates custom email/password registration and OAuth sign-up entry points.
 * The hook owns form state, Clerk password sign-up, email-code dispatch, and the transition
 * into the verification screen once Clerk reports the expected pending-email state. It returns
 * view-specific props so the controller can switch screens without knowing each field mapping.
 */
export function useRegisterFlow(): UseRegisterFlowResult {
  const [globalError, setGlobalError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { signUp, fetchStatus } = useSignUp();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
    reset,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      terms: false,
    },
    mode: 'onSubmit',
  });

  const email = useWatch({ control, name: 'email' });

  const handleGoBack = () => {
    setVerifying(false);
    setValue('email', '');
  };

  const submitRegistration = async (data: RegisterFormValues) => {
    if (fetchStatus === 'fetching' || !signUp) return;
    setGlobalError('');

    try {
      const { error } = await signUp.password({
        emailAddress: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      });

      if (error) {
        console.error(JSON.stringify(error, null, 2));
        const clerkError = getClerkErrorMessage(error);
        setGlobalError(clerkError || 'Verification failed');
        return;
      }

      const { error: sendEmailError } = await signUp.verifications.sendEmailCode();

      if (sendEmailError) {
        console.error(JSON.stringify(sendEmailError, null, 2));
        const clerkError = getClerkErrorMessage(sendEmailError);
        setGlobalError(clerkError || 'Verification failed');
        return;
      }

      if (
        signUp.status === 'missing_requirements' &&
        signUp.unverifiedFields.includes('email_address') &&
        signUp.missingFields.length === 0
      ) {
        setVerifying(true);
        return;
      }

      setGlobalError(
        `Unexpected sign-up status: ${signUp.status?.replace(/_/g, ' ') || 'unknown'}. Please try again.`,
      );
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Something went wrong');
    }
  };

  const handleGoogleSignUp = async () => {
    if (fetchStatus === 'fetching' || !signUp) return;
    try {
      setGoogleLoading(true);
      beginSSOFlow('sign-up');
      const { error } = await signUp.sso({
        strategy: 'oauth_google',
        redirectCallbackUrl: '/sso-callback',
        redirectUrl: config.auth.afterSignUpUrl,
      });

      if (error) {
        console.error(JSON.stringify(error, null, 2));
        const clerkError = getClerkErrorMessage(error);
        setGlobalError(clerkError || 'Verification failed');
        return;
      }
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Oauth failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    if (fetchStatus === 'fetching' || !signUp) return;
    try {
      setAppleLoading(true);
      beginSSOFlow('sign-up');
      const { error } = await signUp.sso({
        strategy: 'oauth_apple',
        redirectCallbackUrl: '/sso-callback',
        redirectUrl: config.auth.afterSignUpUrl,
      });

      if (error) {
        console.error(JSON.stringify(error, null, 2));
        const clerkError = getClerkErrorMessage(error);
        setGlobalError(clerkError || 'Verification failed');
        return;
      }
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Oauth failed');
    } finally {
      setAppleLoading(false);
    }
  };

  if (verifying) {
    return {
      mode: 'verification',
      verificationViewProps: {
        email,
        signUp,
        resetForm: reset,
        onGoBack: handleGoBack,
      },
    };
  }

  return {
    mode: 'form',
    formViewProps: {
      control,
      globalError,
      googleLoading,
      appleLoading,
      isSubmitting,
      isAnyAuthActionInProgress: isSubmitting || googleLoading || appleLoading,
      onSubmit: handleSubmit(submitRegistration),
      onGoogleSignUp: handleGoogleSignUp,
      onAppleSignUp: handleAppleSignUp,
    },
  };
}
