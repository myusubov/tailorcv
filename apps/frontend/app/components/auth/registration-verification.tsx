'use client';

import { useSignUp } from '@clerk/nextjs';

import { RegistrationVerificationView } from './registration-verification-view';
import { useRegistrationVerificationFlow } from './use-registration-verification-flow';

export interface RegistrationVerificationProps {
  /** The email being verified */
  email: string;
  /** Callback to go back and fix the email */
  onGoBack: () => void;
  /** Passed from the parent's useSignUp to keep state in sync */
  signUp: ReturnType<typeof useSignUp>['signUp'];
  /** Hook form reset */
  resetForm: () => void;
}

export function RegistrationVerification({
  email,
  onGoBack,
  signUp,
  resetForm,
}: RegistrationVerificationProps) {
  const registrationVerificationFlow = useRegistrationVerificationFlow({
    signUp,
  });

  return (
    <RegistrationVerificationView
      email={email}
      code={registrationVerificationFlow.code}
      globalError={registrationVerificationFlow.globalError}
      isResending={registrationVerificationFlow.isResending}
      isVerifying={registrationVerificationFlow.isVerifying}
      onCodeChange={registrationVerificationFlow.handleCodeChange}
      onGoBack={onGoBack}
      onResend={registrationVerificationFlow.handleResend}
      onSubmit={registrationVerificationFlow.handleVerification}
    />
  );
}
