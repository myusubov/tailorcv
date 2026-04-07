'use client';

import {
  SSOContinueForm,
  useSSOContinueFlow,
} from '@/app/components/auth/sso-continue';

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
        {/* Why: Clerk's bot protection still applies to custom sign-up continuation flows. */}
        <div id="clerk-captcha" />
      </div>
    </div>
  );
}
