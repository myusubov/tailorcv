import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { Spinner } from '@heroui/react';

import { config } from '@/lib/config';

export default function SSOCallbackPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <h1 className="text-lg font-semibold">Finishing sign in…</h1>
        <p className="text-muted text-sm">
          You&apos;ll be redirected automatically once the sign-in is complete.
        </p>

        <Spinner color="current" size="lg" />

        <AuthenticateWithRedirectCallback
          signInFallbackRedirectUrl={config.auth.signInFallbackUrl}
          signUpFallbackRedirectUrl={config.auth.signUpFallbackUrl}
        />

        {/* Required for sign-up flows - Clerk's bot sign-up protection */}
        <div id="clerk-captcha" />
      </div>
    </div>
  );
}
