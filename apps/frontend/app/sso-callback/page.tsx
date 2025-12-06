import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/test"
        signUpFallbackRedirectUrl="/test"
      />

      {/* Required for sign-up flows - Clerk's bot sign-up protection */}
      <div id="clerk-captcha" />
    </div>
  );
}
