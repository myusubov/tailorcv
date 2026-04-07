import { RegistrationVerification } from '@/app/components/auth/registration-verification';

import { RegisterFormView } from './register-form-view';
import { useRegisterFlow } from './use-register-flow';

export default function RegisterForm() {
  const registerFlow = useRegisterFlow();

  if (registerFlow.verifying) {
    return (
      <RegistrationVerification
        resetForm={registerFlow.resetForm}
        onGoBack={registerFlow.handleGoBack}
        signUp={registerFlow.signUp}
        email={registerFlow.email}
      />
    );
  }

  return (
    <RegisterFormView
      control={registerFlow.control}
      globalError={registerFlow.globalError}
      googleLoading={registerFlow.googleLoading}
      appleLoading={registerFlow.appleLoading}
      isSubmitting={registerFlow.isSubmitting}
      isAnyAuthActionInProgress={registerFlow.isAnyAuthActionInProgress}
      onSubmit={registerFlow.handleSubmit}
      onGoogleSignUp={registerFlow.handleGoogleSignUp}
      onAppleSignUp={registerFlow.handleAppleSignUp}
    />
  );
}
