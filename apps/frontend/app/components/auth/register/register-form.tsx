import { RegistrationVerificationView } from '@/app/components/auth/registration-verification-view';

import { RegisterFormView } from './register-form-view';
import { useRegisterFlow } from './use-register-flow';

export default function RegisterForm() {
  const registerFlow = useRegisterFlow();

  if (registerFlow.mode === 'verification') {
    return <RegistrationVerificationView {...registerFlow.verificationViewProps} />;
  }

  return <RegisterFormView {...registerFlow.formViewProps} />;
}
