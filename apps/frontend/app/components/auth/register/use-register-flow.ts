import { useSignUp } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from '@heroui/react';

import { config } from '@/lib/config';
import { registerSchema, type RegisterFormValues } from '@/lib/schemas/auth';
import { getClerkErrorMessage } from '@/lib/utils/utils';
import type { RegistrationVerificationViewProps } from '@/app/components/auth/registration-verification-view';

import type { RegisterFormViewProps } from './register-form-view';

type OAuthSignUpStrategy = 'oauth_google' | 'oauth_apple';

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
 *
 * @returns Render-safe props for either registration entry or email verification.
 * @remarks Side effects are limited to Clerk attempt mutations, HeroUI feedback, and
 * post-finalization navigation. Clerk must be reset successfully before changing email.
 */
export function useRegisterFlow(): UseRegisterFlowResult {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
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

  /**
   * Abandons the pending Clerk attempt before returning to email entry.
   * Keeps verification visible when Clerk cannot clear its local attempt state.
   *
   * @returns A promise that resolves after Clerk and local form state are reconciled.
   * @remarks Mutates Clerk's local attempt and clears local verification state only on success.
   */
  const handleGoBack = async () => {
    if (!signUp) {
      toast.danger('Unable to restart sign up. Please refresh and try again.');
      return;
    }

    try {
      const { error } = await signUp.reset();
      if (error) {
        const clerkError = getClerkErrorMessage(error);
        toast.danger(clerkError || 'Unable to restart sign up');
        return;
      }
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      toast.danger(clerkError || 'Unable to restart sign up');
      return;
    }

    setVerifying(false);
    setVerificationCode('');
    setValue('email', '');
  };

  const handleResendVerification = async () => {
    if (!signUp) return;
    setIsResending(true);

    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) {
        console.error(JSON.stringify(error, null, 2));
        const clerkError = getClerkErrorMessage(error);
        toast.danger(clerkError || 'Verification failed');
        return;
      }

      toast.success('Verification code resent');
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      toast.danger(clerkError || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmitVerification = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!signUp) return;
    setIsVerifying(true);

    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: verificationCode,
      });
      if (error) {
        console.error(JSON.stringify(error, null, 2));
        const clerkError = getClerkErrorMessage(error);
        toast.danger(clerkError || 'Verification failed');
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
          toast.danger(clerkError || 'Failed to complete sign up');
          return;
        }

        return;
      }

      toast.danger(
        `Unexpected verification status: ${signUp.status?.replace(/_/g, ' ') || 'unknown'}. Please try again.`,
      );
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      toast.danger(clerkError || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Starts password registration, sends Clerk's email code, and opens verification
   * only for the supported pending-email state.
   *
   * @param data - Locally validated email, password, confirmation, and terms values.
   * @returns A promise that resolves after Clerk advances or feedback is shown.
   * @remarks Sends only email and password to Clerk; confirmation and terms remain local guards.
   */
  const submitRegistration = async (data: RegisterFormValues) => {
    if (fetchStatus === 'fetching' || !signUp) return;

    try {
      const { error } = await signUp.password({
        emailAddress: data.email,
        password: data.password,
      });

      if (error) {
        console.error(JSON.stringify(error, null, 2));
        const clerkError = getClerkErrorMessage(error);
        toast.danger(clerkError || 'Verification failed');
        return;
      }

      const { error: sendEmailError } =
        await signUp.verifications.sendEmailCode();

      if (sendEmailError) {
        console.error(JSON.stringify(sendEmailError, null, 2));
        const clerkError = getClerkErrorMessage(sendEmailError);
        toast.danger(clerkError || 'Verification failed');
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

      toast.danger(
        `Unexpected sign-up status: ${signUp.status?.replace(/_/g, ' ') || 'unknown'}. Please try again.`,
      );
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      toast.danger(clerkError || 'Something went wrong');
    }
  };

  /**
   * Delegates social-provider navigation to Clerk's v7 SSO operation for the
   * requested strategy.
   *
   * @param input - Provider strategy and its route-specific loading-state setter.
   * @returns A promise that resolves when Clerk redirects or reports an initiation failure.
   */
  const performOAuthSignUp = async ({
    strategy,
    setLoading,
  }: {
    strategy: OAuthSignUpStrategy;
    setLoading: (loading: boolean) => void;
  }) => {
    if (fetchStatus === 'fetching' || !signUp) return;

    try {
      setLoading(true);
      const { error } = await signUp.sso({
        strategy,
        redirectCallbackUrl: '/sso-callback',
        redirectUrl: config.auth.afterSignUpUrl,
      });

      if (error) {
        const clerkError = getClerkErrorMessage(error);
        toast.danger(clerkError || 'OAuth failed');
        return;
      }
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      toast.danger(clerkError || 'OAuth failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Starts a Google sign-up through the shared Clerk SSO boundary.
   *
   * @returns A promise that resolves when social initiation finishes or redirects.
   */
  const handleGoogleSignUp = async () => {
    await performOAuthSignUp({
      strategy: 'oauth_google',
      setLoading: setGoogleLoading,
    });
  };

  /**
   * Starts an Apple sign-up through the shared Clerk SSO boundary.
   *
   * @returns A promise that resolves when social initiation finishes or redirects.
   */
  const handleAppleSignUp = async () => {
    await performOAuthSignUp({
      strategy: 'oauth_apple',
      setLoading: setAppleLoading,
    });
  };

  if (verifying) {
    return {
      mode: 'verification',
      verificationViewProps: {
        code: verificationCode,
        email,
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
