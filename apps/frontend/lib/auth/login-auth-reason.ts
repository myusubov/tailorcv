export const LOGIN_AUTH_REASON_QUERY_PARAM = 'auth_reason';

export type LoginAuthReason =
  | 'primary_required'
  | 'second_factor_required'
  | 'reset_password_required';

export interface LoginAuthNotice {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

const loginAuthReasonNotices: Record<LoginAuthReason, LoginAuthNotice> = {
  primary_required: {
    title: 'Finish sign-in with your primary method',
    description:
      'This OAuth account is not the primary sign-in method for your account here. Continue with your email and password to finish signing in.',
  },
  second_factor_required: {
    title: 'Additional verification is required',
    description:
      'Your account requires a second verification step after password sign-in. Continue with your primary sign-in method and we will send your verification code.',
  },
  reset_password_required: {
    title: 'Reset your password to continue',
    description:
      'Your account requires a password reset before sign-in can complete. Use the forgot-password flow to set a new password.',
    actionHref: '/forgot-password',
    actionLabel: 'Reset password',
  },
};

export function buildLoginUrl({
  reason,
}: {
  reason?: LoginAuthReason;
}) {
  if (!reason) return '/login';

  const searchParams = new URLSearchParams({
    [LOGIN_AUTH_REASON_QUERY_PARAM]: reason,
  });

  return `/login?${searchParams.toString()}`;
}

export function getLoginAuthNotice({
  reason,
}: {
  reason: string | null;
}): LoginAuthNotice | null {
  if (!reason) return null;

  return loginAuthReasonNotices[reason as LoginAuthReason] ?? null;
}
