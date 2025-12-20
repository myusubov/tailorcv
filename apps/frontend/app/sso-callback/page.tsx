'use client';

import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs';
import { Spinner } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { config } from '@/lib/config';

export default function SSOCallbackPage() {
  const { handleRedirectCallback } = useClerk();
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const router = useRouter();

  useEffect(() => {
    if (!isSignInLoaded || !isSignUpLoaded) return;

    const processCallback = async () => {
      try {
        await handleRedirectCallback({});
      } catch (err) {
        console.error('SSO Callback error:', err);
        router.push('/login');
      }
    };

    processCallback();
  }, [isSignInLoaded, isSignUpLoaded, handleRedirectCallback, router]);

  useEffect(() => {
    if (!isSignInLoaded || !isSignUpLoaded) return;


    const handleSession = async () => {
      // 1. Handle Sign In Complete (User exists and is fully verified)
      if (signIn?.status === 'complete') {
        await setSignInActive({ session: signIn.createdSessionId });
        router.push(config.auth.afterSignInUrl as string);
        return;
      }

      // 2. Handle Sign Up Complete (New user fully verified)
      if (signUp?.status === 'complete') {
        await setSignUpActive({ session: signUp.createdSessionId });
        router.push(config.auth.afterSignUpUrl);
        return;
      }

      // 3. Handle Missing Requirements (e.g. missing Last Name from Google)
      if (signUp?.status === 'missing_requirements') {
        // Redirection to register will trigger the "Complete Profile" form we built
        router.push('/register');
        return;
      }

      // 4. Handle 2FA (Multi-Factor Authentication)
      if (signIn?.status === 'needs_second_factor') {
        // TODO: ideally we redirect to a 2FA verification page. 
        // For now, sending to login.
        router.push('/login');
        return;
      }

      // 5. Fallback for unhandled states (prevent infinite spinner)
      // If we are loaded, have a sign in/up attempt, but no matching status above:
      if (signIn || signUp) {
        console.warn('Unhandled auth state:', {
          signInStatus: signIn?.status,
          signUpStatus: signUp?.status
        });
        // Give a short delay to ensure we don't race, then redirect
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    handleSession();
  }, [
    isSignInLoaded,
    isSignUpLoaded,
    signIn,
    signUp,
    setSignInActive,
    setSignUpActive,
    router,
  ]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <h1 className="text-lg font-semibold">Finishing sign in...</h1>
        <p className="text-muted text-sm">
          Please wait while we complete your authentication.
        </p>
        <Spinner color="current" size="lg" />
        <div id="clerk-captcha" />
      </div>
    </div>
  );
}
