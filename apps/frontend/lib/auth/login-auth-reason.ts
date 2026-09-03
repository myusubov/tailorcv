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

/**
 * Builds the canonical login URL for auth recovery redirects coming from SSO callback handling.
 * When a reason is provided it is encoded as the `auth_reason` query param so the login page can
 * show a contextual inline notice before cleaning the param from the URL.
 */
export function buildLoginUrl({ reason }: { reason?: LoginAuthReason }) {
  if (!reason) return '/login';

  const searchParams = new URLSearchParams({
    [LOGIN_AUTH_REASON_QUERY_PARAM]: reason,
  });

  return `/login?${searchParams.toString()}`;
}

/**
 * Returns the inline notice content for a login recovery reason encoded in the URL.
 * Unknown or absent reasons resolve to `null` so the login page can render normally.
 */
export function getLoginAuthNotice({
  reason,
}: {
  reason: string | null;
}): LoginAuthNotice | null {
  if (!reason) return null;

  return loginAuthReasonNotices[reason as LoginAuthReason] ?? null;
}
