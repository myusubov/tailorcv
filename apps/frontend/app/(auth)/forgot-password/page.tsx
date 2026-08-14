'use client';

import {
  ForgotPasswordEmailEntry,
  ForgotPasswordReset,
} from '@/app/components/auth/forgot-password';
import { useForgotPasswordFlow } from '@/app/components/auth/forgot-password/use-forgot-password-flow';

/**
 * Selects the active forgot-password controller from the flow state.
 *
 * @returns The email-entry or reset controller for the current step.
 */
export default function ForgotPasswordPage() {
  const {
    step,
    email,
    emailPrefill,
    code,
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
        isResending={isResending}
        isVerifyingCode={isVerifyingCode}
        remainingSeconds={remainingSeconds}
      />
    );
  }

  return (
    <ForgotPasswordEmailEntry
      onSubmit={handleEmailSubmit}
      email={emailPrefill}
    />
  );
}
