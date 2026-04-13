import { RegistrationVerification } from '@/app/components/auth/registration-verification';

import { RegisterFormView } from './register-form-view';
import { useRegisterFlow } from './use-register-flow';

export default function RegisterForm() {
  const registerFlow = useRegisterFlow();

  if (registerFlow.mode === 'verification') {
    return <RegistrationVerification {...registerFlow.verificationViewProps} />;
  }

  return <RegisterFormView {...registerFlow.formViewProps} />;
}
