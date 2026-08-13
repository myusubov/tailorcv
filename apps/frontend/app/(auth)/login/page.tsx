'use client';

import { AuthBrandPanel } from '@/app/components/auth/auth-brand-panel';
import { VerificationView, LoginFormView } from '@/app/components/auth/login';
import { LoginBrandPanelContent } from '@/app/components/auth/login/login-brand-panel-content';
import { useLoginFlow } from '@/app/components/auth/login/use-login-flow';

export default function LoginPage() {
  const {
    control,
    isSubmitting,
    googleLoading,
    appleLoading,
    authNotice,
    globalError,
    verifying,
    code,
    isVerifying,
    resending,
    isClientReady,
    setCode,
    handleSubmit,
    handleGoogleSignIn,
    handleAppleSignIn,
    handleResend,
    handleVerification,
    handleBackToLogin,
  } = useLoginFlow();

  if (verifying) {
    return (
      <VerificationView
        code={code}
        onCodeChange={setCode}
        onSubmit={handleVerification}
        isVerifying={isVerifying}
        isResending={resending}
        onResend={handleResend}
        onBack={handleBackToLogin}
        error={globalError}
      />
    );
  }

  return (
    <div
      className="flex min-h-svh flex-col lg:flex-row"
      data-auth-ready={isClientReady ? 'true' : 'false'}
    >
      <AuthBrandPanel>
        <LoginBrandPanelContent />
      </AuthBrandPanel>

      <LoginFormView
        control={control}
        isSubmitting={isSubmitting}
        googleLoading={googleLoading}
        appleLoading={appleLoading}
        authNotice={authNotice}
        globalError={globalError}
        onSubmit={handleSubmit}
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
      />
    </div>
  );
}
