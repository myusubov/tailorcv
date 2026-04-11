'use client';

import {
  SSOContinueForm,
  useSSOContinueFlow,
} from '@/app/components/auth/sso-continue';

/**
 * Renders the OAuth sign-up continuation form for providers that did not supply
 * all required profile fields. The page also mounts Clerk's captcha container so
 * bot protection continues to work for the custom continuation flow.
 */
export default function SSOContinuePage() {
  const {
    control,
    isSubmitting,
    globalError,
    signUp,
    handleSubmit,
  } = useSSOContinueFlow();

  if (!signUp) return null;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[440px]">
        <SSOContinueForm
          control={control}
          isSubmitting={isSubmitting}
          globalError={globalError}
          onSubmit={handleSubmit}
        />
        <div id="clerk-captcha" />
      </div>
    </div>
  );
}
