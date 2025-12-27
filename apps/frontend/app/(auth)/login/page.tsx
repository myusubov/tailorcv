'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { loginSchema, LoginFormValues } from '@/lib/schemas/auth';
import { getClerkErrorMessage } from '@/lib/utils/utils';
import { config } from '@/lib/config';
import {
  LoginBranding,
  VerificationView,
  LoginFormView,
} from '@/app/components/auth/login';

export default function LoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [globalError, setGlobalError] = useState('');
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

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

  const onSubmit = async (data: LoginFormValues) => {
    if (!isLoaded) return;
    setGlobalError('');

    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push(config.auth.afterSignInUrl);
      } else if (result.status === 'needs_second_factor') {
        const factor = result.supportedSecondFactors?.find(
          (f) => f.strategy === 'email_code',
        );
        if (factor) {
          await signIn.prepareSecondFactor({
            strategy: 'email_code',
          });
          setVerifying(true);
        } else {
          setGlobalError(
            'Unsupported verification method. Please contact support.',
          );
        }
      } else if (result.status === 'needs_new_password') {
        // Handle leaked password / forced reset
        toast.error('For your security, you must reset your password.');
        router.push('/forgot-password');
      } else {
        // Handling unexpected statuses (e.g., missing_requirements) to prevent getting stuck
        console.error('Unhandled sign-in status:', result.status);
        setGlobalError(
          `Sign in status: ${result.status?.replace(/_/g, ' ') || 'Unknown'}. Please contact support.`,
        );
      }
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      // Account lockouts are returned as errors (e.g. "Too many failed attempts")
      // so this will naturally handle them by displaying the API message.
      setGlobalError(clerkError || 'Invalid email or password');
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;
    try {
      setGoogleLoading(true);
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: config.auth.afterSignInUrl,
      });
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'OAuth failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (!isLoaded) return;
    try {
      setAppleLoading(true);
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_apple',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: config.auth.afterSignInUrl,
      });
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'OAuth failed');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded || !signIn) return;
    setResending(true);
    setGlobalError('');
    try {
      await signIn.prepareSecondFactor({
        strategy: 'email_code',
      });
      toast.success('Verification code resent');
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setIsVerifying(true);
    setGlobalError('');
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push(config.auth.afterSignInUrl);
      }
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  if (verifying) {
    return (
      <VerificationView
        code={code}
        onCodeChange={setCode}
        onSubmit={handleVerification}
        isVerifying={isVerifying}
        isResending={resending}
        onResend={handleResend}
        onBack={() => setVerifying(false)}
        error={globalError}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <LoginBranding />

      <LoginFormView
        control={control}
        isSubmitting={isSubmitting}
        googleLoading={googleLoading}
        appleLoading={appleLoading}
        globalError={globalError}
        onSubmit={handleSubmit(onSubmit)}
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
      />
    </div>
  );
}
