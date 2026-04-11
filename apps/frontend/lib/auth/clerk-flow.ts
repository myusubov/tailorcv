interface SupportedSecondFactor {
  strategy: string;
}

interface ResolveLoginAttemptOutcomeArgs {
  status: string | null | undefined;
  supportedSecondFactors?: readonly SupportedSecondFactor[] | null;
}

type LoginAttemptOutcome =
  | {
      type: 'finalize';
    }
  | {
      type: 'client_trust_email_code';
    }
  | {
      type: 'needs_second_factor';
    }
  | {
      type: 'needs_new_password';
    }
  | {
      type: 'unsupported_second_factor';
    }
  | {
      type: 'unhandled_status';
      status: string | null | undefined;
    };

interface ResolveForgotPasswordCompletionArgs {
  status: string | null | undefined;
}

type ForgotPasswordCompletionOutcome =
  | {
      type: 'finalize';
    }
  | {
      type: 'needs_second_factor';
    }
  | {
      type: 'unexpected_status';
      status: string | null | undefined;
    };

/**
 * Normalizes Clerk sign-in statuses into the app's explicit password-login outcomes.
 * The login flow uses this helper to separate direct completion, Client Trust email
 * verification, unsupported MFA, forced password reset, and unexpected states.
 */
export function resolveLoginAttemptOutcome({
  status,
  supportedSecondFactors,
}: ResolveLoginAttemptOutcomeArgs): LoginAttemptOutcome {
  if (status === 'complete') {
    return { type: 'finalize' };
  }

  if (status === 'needs_client_trust') {
    const hasEmailCodeFactor =
      supportedSecondFactors?.some((factor) => factor.strategy === 'email_code') ?? false;

    return hasEmailCodeFactor
      ? { type: 'client_trust_email_code' }
      : { type: 'unsupported_second_factor' };
  }

  if (status === 'needs_second_factor') {
    return { type: 'needs_second_factor' };
  }

  if (status === 'needs_new_password') {
    return { type: 'needs_new_password' };
  }

  return {
    type: 'unhandled_status',
    status,
  };
}

/**
 * Maps Clerk's post-reset sign-in status to the forgot-password flow's supported outcomes.
 * This keeps the reset controller from assuming every successful password write can finalize
 * immediately when Clerk may still require an additional MFA step.
 */
export function resolveForgotPasswordCompletion({
  status,
}: ResolveForgotPasswordCompletionArgs): ForgotPasswordCompletionOutcome {
  if (status === 'complete') {
    return { type: 'finalize' };
  }

  if (status === 'needs_second_factor') {
    return { type: 'needs_second_factor' };
  }

  return {
    type: 'unexpected_status',
    status,
  };
}
