'use client';

import {
  LoginBranding,
  VerificationView,
  LoginFormView,
} from '@/app/components/auth/login';
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
      className="flex min-h-screen flex-col lg:flex-row"
      data-auth-ready={isClientReady ? 'true' : 'false'}
    >
      <LoginBranding />

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
