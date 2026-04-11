import type { Page } from '@playwright/test';

export type LoginAttemptResult =
  | 'success'
  | 'failure'
  | 'reset_required'
  | 'unsupported_second_factor'
  | 'retry';

export type RealLoginOutcome =
  | 'signed_in'
  | 'signed_in_after_client_trust'
  | 'reset_required'
  | 'invalid_credentials'
  | 'unsupported_second_factor'
  | 'retry';

export interface ResolveLoginOutcomeArgs {
  attempt: LoginAttemptResult;
  usedEmailCodeVerification: boolean;
}

export interface AttemptRealLoginArgs {
  page: Page;
  email: string;
  password: string;
}

export interface AttemptRealLoginResult {
  outcome: RealLoginOutcome;
  usedEmailCodeVerification: boolean;
}
