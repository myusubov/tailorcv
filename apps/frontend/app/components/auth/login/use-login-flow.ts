'use client';

import { useSignIn } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@heroui/react';

import {
  getLoginAuthNotice,
  type LoginAuthNotice,
  LOGIN_AUTH_REASON_QUERY_PARAM,
} from '@/lib/auth/login-auth-reason';
import { resolveLoginAttemptOutcome } from '@/lib/auth/clerk-flow';
import { config } from '@/lib/config';
import { loginSchema, type LoginFormValues } from '@/lib/schemas/auth';
import { getClerkErrorMessage } from '@/lib/utils/utils';

type OAuthSignInStrategy = 'oauth_google' | 'oauth_apple';

export interface UseLoginFlowResult {
  control: ReturnType<typeof useForm<LoginFormValues>>['control'];
  isSubmitting: boolean;
  googleLoading: boolean;
  appleLoading: boolean;
  authNotice: LoginAuthNotice | null;
  verifying: boolean;
  code: string;
  isVerifying: boolean;
  resending: boolean;
  isClientReady: boolean;
  setCode: (code: string) => void;
  handleSubmit: () => Promise<void>;
  handleGoogleSignIn: () => Promise<void>;
  handleAppleSignIn: () => Promise<void>;
  handleResend: () => Promise<void>;
  handleVerification: (event: React.FormEvent) => Promise<void>;
  handleBackToLogin: () => void;
}

/**
 * Orchestrates the custom login page across password sign-in, Client Trust email verification,
 * OAuth entry points, and SSO recovery notices. The hook owns form state, Clerk interactions,
 * URL cleanup, and post-auth navigation.
 */
export function useLoginFlow(): UseLoginFlowResult {
  const { signIn, fetchStatus } = useSignIn();
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authNotice, setAuthNotice] = useState<LoginAuthNotice | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  useEffect(() => {
    const authReason = searchParams.get(LOGIN_AUTH_REASON_QUERY_PARAM);
    const nextNotice = getLoginAuthNotice({ reason: authReason });

    if (!nextNotice) return;

    setAuthNotice(nextNotice);

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete(LOGIN_AUTH_REASON_QUERY_PARAM);
    const nextQuery = nextSearchParams.toString();
    router.replace(nextQuery ? `/login?${nextQuery}` : '/login');
  }, [router, searchParams]);

  const finalizeSignIn = async () => {
    if (!signIn) return false;

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
      const clerkError = getClerkErrorMessage(error);
      toast.danger(clerkError || 'Failed to complete sign in');
      return false;
    }

    return true;
  };

  const submitPasswordSignIn = async ({ email, password }: LoginFormValues) => {
    if (fetchStatus === 'fetching' || !signIn) return;

    try {
      const { error: signInError } = await signIn.password({
        emailAddress: email,
        password,
      });

      if (signInError) {
        const clerkError = getClerkErrorMessage(signInError);
        toast.danger(clerkError || 'Invalid email or password');
        return;
      }

      const outcome = resolveLoginAttemptOutcome({
        status: signIn.status,
        supportedSecondFactors: signIn.supportedSecondFactors,
      });

      if (outcome.type === 'finalize') {
        await finalizeSignIn();
        return;
      }

      if (outcome.type === 'client_trust_email_code') {
        const { error } = await signIn.mfa.sendEmailCode();

        if (error) {
          const clerkError = getClerkErrorMessage(error);
          toast.danger(clerkError || 'Failed to send verification code');
          return;
        }

        setCode('');
        setVerifying(true);
        return;
      }

      if (outcome.type === 'needs_second_factor') {
        toast.danger(
          'Your account requires a second verification method after password sign-in. This login form does not support that MFA step yet.',
        );
        return;
      }

      if (outcome.type === 'needs_new_password') {
        toast.danger('For your security, you must reset your password.');
        router.push('/forgot-password');
        return;
      }

      if (outcome.type === 'unsupported_second_factor') {
        toast.danger(
          'Trusted-device verification is required, but email code verification is not available for this account.',
        );
        return;
      }

      console.error('Unhandled sign-in status:', outcome.status);
      toast.danger(
        `Sign in status: ${outcome.status?.replace(/_/g, ' ') || 'Unknown'}. Please contact support.`,
      );
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      toast.danger(clerkError || 'Invalid email or password');
    }
  };

  const performOAuthSignIn = async ({
    strategy,
    setLoading,
  }: {
    strategy: OAuthSignInStrategy;
    setLoading: (loading: boolean) => void;
  }) => {
    if (fetchStatus === 'fetching' || !signIn) return;

    try {
      setLoading(true);
      const { error } = await signIn.sso({
        strategy,
        redirectCallbackUrl: '/sso-callback',
        redirectUrl: config.auth.afterSignInUrl,
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

  const handleGoogleSignIn = async () => {
    await performOAuthSignIn({
      strategy: 'oauth_google',
      setLoading: setGoogleLoading,
    });
  };

  const handleAppleSignIn = async () => {
    await performOAuthSignIn({
      strategy: 'oauth_apple',
      setLoading: setAppleLoading,
    });
  };

  const handleResend = async () => {
    if (fetchStatus === 'fetching' || !signIn) return;
    setResending(true);
    try {
      const { error } = await signIn.mfa.sendEmailCode();

      if (error) {
        const clerkError = getClerkErrorMessage(error);
        toast.danger(clerkError || 'Failed to resend code');
        return;
      }

      toast.success('Verification code resent');
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      toast.danger(clerkError || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleVerification = async (event: React.FormEvent) => {
    event.preventDefault();
    if (fetchStatus === 'fetching' || !signIn) return;
    setIsVerifying(true);
    try {
      const { error } = await signIn.mfa.verifyEmailCode({ code });

      if (error) {
        const clerkError = getClerkErrorMessage(error);
        toast.danger(clerkError || 'Verification failed');
        return;
      }

      if (signIn.status === 'complete') {
        await finalizeSignIn();
        return;
      }

      console.error('Unhandled sign-in verification status:', signIn.status);
      toast.danger(
        `Verification status: ${signIn.status?.replace(/_/g, ' ') || 'Unknown'}. Please contact support.`,
      );
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      toast.danger(clerkError || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackToLogin = () => {
    setVerifying(false);
  };

  return {
    control,
    isSubmitting,
    googleLoading,
    appleLoading,
    authNotice,
    verifying,
    code,
    isVerifying,
    resending,
    isClientReady,
    setCode,
    handleSubmit: handleSubmit(submitPasswordSignIn),
    handleGoogleSignIn,
    handleAppleSignIn,
    handleResend,
    handleVerification,
    handleBackToLogin,
  };
}
