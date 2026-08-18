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
}: RegistrationVerificationProps) {
  const registrationVerificationFlow = useRegistrationVerificationFlow({
    email,
    onGoBack,
    signUp,
  });

  return <RegistrationVerificationView {...registrationVerificationFlow.viewProps} />;
}
