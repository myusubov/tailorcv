import { useSignUp } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { resetClerkAuthResource } from '@/lib/auth/reset-clerk-auth-resource';
import { config } from '@/lib/config';
import { registerSchema, type RegisterFormValues } from '@/lib/schemas/auth';
import { getClerkErrorMessage } from '@/lib/utils/utils';
import type { RegistrationVerificationViewProps } from '@/app/components/auth/registration-verification-view';

import type { RegisterFormViewProps } from './register-form-view';

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
  const router = useRouter();
  const [globalError, setGlobalError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { signUp, fetchStatus } = useSignUp();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
    mode: 'onSubmit',
  });

  const email = useWatch({ control, name: 'email' });

  const handleGoBack = () => {
    setVerifying(false);
    setVerificationCode('');
    setVerificationError('');
    setValue('email', '');
  };

  const handleResendVerification = async () => {
    if (!signUp) return;
    setIsResending(true);
    setVerificationError('');

    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) {
        console.error(JSON.stringify(error, null, 2));
        const clerkError = getClerkErrorMessage(error);
        setVerificationError(clerkError || 'Verification failed');
        return;
      }

      toast.success('Verification code resent');
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setVerificationError(clerkError || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmitVerification = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!signUp) return;
    setIsVerifying(true);
    setVerificationError('');

    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: verificationCode,
      });
      if (error) {
        console.error(JSON.stringify(error, null, 2));
        const clerkError = getClerkErrorMessage(error);
        setVerificationError(clerkError || 'Verification failed');
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
          setVerificationError(clerkError || 'Failed to complete sign up');
          return;
        }

        return;
      }

      setVerificationError(
        `Unexpected verification status: ${signUp.status?.replace(/_/g, ' ') || 'unknown'}. Please try again.`,
      );
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setVerificationError(clerkError || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const submitRegistration = async (data: RegisterFormValues) => {
    if (fetchStatus === 'fetching' || !signUp) return;
    setGlobalError('');

    try {
      const { error } = await signUp.password({
        emailAddress: data.email,
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
      setGlobalError('');
      setGoogleLoading(true);
      await resetClerkAuthResource({ resource: signUp });
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
      setGlobalError('');
      setAppleLoading(true);
      await resetClerkAuthResource({ resource: signUp });
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
        code: verificationCode,
        email,
        globalError: verificationError,
        isResending,
        isVerifying,
        onCodeChange: setVerificationCode,
        onGoBack: handleGoBack,
        onResend: handleResendVerification,
        onSubmit: handleSubmitVerification,
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
