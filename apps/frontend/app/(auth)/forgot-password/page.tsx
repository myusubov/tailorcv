'use client';

import {
  ForgotPasswordEmailEntry,
  ForgotPasswordReset,
} from '@/app/components/auth/forgot-password';
import { useForgotPasswordFlow } from '@/app/components/auth/forgot-password/use-forgot-password-flow';

export default function ForgotPasswordPage() {
  const {
    step,
    email,
    code,
    globalError,
    isResending,
    isVerifyingCode,
    remainingSeconds,
    handleBack,
    handleEmailSubmit,
    handleResend,
    handleSetPassword,
    handleVerifyCode,
    setCode,
  } = useForgotPasswordFlow();

  if (step !== 'email') {
    return (
      <ForgotPasswordReset
        email={email}
        step={step}
        code={code}
        onCodeChange={setCode}
        onVerifyCode={handleVerifyCode}
        onSetPassword={handleSetPassword}
        onResend={handleResend}
        onBack={handleBack}
        globalError={globalError}
        isResending={isResending}
        isVerifyingCode={isVerifyingCode}
        remainingSeconds={remainingSeconds}
      />
    );
  }

  return (
    <ForgotPasswordEmailEntry
      onSubmit={handleEmailSubmit}
      globalError={globalError}
    />
  );
}
