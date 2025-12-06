import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

import { config } from '@/lib/config';

export default function SSOCallbackPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl={config.auth.signInFallbackUrl}
        signUpFallbackRedirectUrl={config.auth.signUpFallbackUrl}
      />

      {/* Required for sign-up flows - Clerk's bot sign-up protection */}
      <div id="clerk-captcha" />
    </div>
  );
}
