'use client';

import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { buildLoginUrl, type LoginAuthReason } from '@/lib/auth/login-auth-reason';
import { config } from '@/lib/config';
import { getClerkErrorMessage } from '@/lib/utils/utils';

/**
 * Finalizes the Clerk v7 SSO callback state machine for both sign-in and sign-up flows.
 * The hook handles transfer cases, redirects incomplete sign-ins back into login, finalizes
 * completed OAuth sign-ups/sign-ins, and surfaces a persistent page-level error when the
 * blocking callback transition cannot finish.
 */
export function useSSOCallback() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Prevents double-execution in React StrictMode
  const hasRun = useRef(false);

  useEffect(() => {
    (async () => {
      if (!clerk.loaded || hasRun.current) return;

      if (!signIn || !signUp) {
        hasRun.current = true;
        router.push('/login');
        return;
      }

      hasRun.current = true;

      const redirectToLogin = ({
        reason,
      }: {
        reason?: LoginAuthReason;
      }) => {
        router.push(buildLoginUrl({ reason }));
      };

      const showMissingRequirementsError = () => {
        setError(
          'Clerk still requires additional sign-up fields. Confirm first and last name are optional or disabled in the Clerk dashboard, then restart sign-up.',
        );
        setIsLoading(false);
      };

      const finalizeSignIn = async () => {
        const { error } = await signIn.finalize({
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) return;
            const url = decorateUrl(config.auth.afterSignInUrl);
            if (url.startsWith('http')) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });

        if (error) {
          setError(getClerkErrorMessage(error));
          setIsLoading(false);
          return false;
        }

        return true;
      };

      const finalizeSignUp = async () => {
        const { error } = await signUp.finalize({
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) return;
            const url = decorateUrl(config.auth.afterSignUpUrl);
            if (url.startsWith('http')) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });

        if (error) {
          setError(getClerkErrorMessage(error));
          setIsLoading(false);
          return false;
        }

        return true;
      };

      try {
        // Case 1: OAuth sign-in completed — user already has an account tied to this provider.
        if (signIn.status === 'complete') {
          await finalizeSignIn();
          return;
        }

        // Case 2: The sign-up is transferable — the OAuth email already exists as a Clerk account.
        // Transfer the pending sign-up into a sign-in so the existing account is used instead.
        if (signUp.isTransferable) {
          await signIn.create({ transfer: true });
          // SignInFutureResource status doesn't update in-place afer create(); cast to include 'complete'.t
          const signInStatus = signIn.status as typeof signIn.status | 'complete';
          if (signInStatus === 'complete') {
            await finalizeSignIn();
            return;
          }
          // Transfer failed or needs additional factors — fall back to login page.
          return redirectToLogin({});
        }

        // Case 3: Sign-in needs a non-enterprise first factor (e.g. password).
        // This OAuth provider isn't the primary auth method — redirect to login to complete it.
        if (
          signIn.status === 'needs_first_factor' &&
          !signIn.supportedFirstFactors?.every((f) => f.strategy === 'enterprise_sso')
        ) {
          return redirectToLogin({ reason: 'primary_required' });
        }

        // Case 4: The sign-in is transferable — this OAuth account has no Clerk user yet.
        // Transfer the pending sign-in into a sign-up to create a new account.
        if (signIn.isTransferable) {
          await signUp.create({ transfer: true });
          if (signUp.status === 'complete') {
            await finalizeSignUp();
            return;
          }
          if (signUp.status === 'missing_requirements') {
            showMissingRequirementsError();
            return;
          }
        }

        // Case 5: New user signed up via OAuth and all required fields were provided.
        if (signUp.status === 'complete') {
          await finalizeSignUp();
          return;
        }

        // Case 6: Clerk still requires fields this app no longer collects.
        // Surface this as configuration drift instead of routing to a retired continuation page.
        if (
          signUp.status === 'missing_requirements' &&
          signUp.verifications.externalAccount.status === 'verified'
        ) {
          showMissingRequirementsError();
          return;
        }

        // Case 7: Sign-in requires MFA or a password reset — redirect to login to handle it.
        if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_new_password') {
          return redirectToLogin({
            reason:
              signIn.status === 'needs_second_factor'
                ? 'second_factor_required'
                : 'reset_password_required',
          });
        }

        // Case 8: An existing active session was found (e.g. user is already logged in on this device).
        // Activate it directly instead of creating a new one.
        if (signIn.existingSession || signUp.existingSession) {
          const sessionId =
            signIn.existingSession?.sessionId ?? signUp.existingSession?.sessionId;
          if (sessionId) {
            await clerk.setActive({
              session: sessionId,
              navigate: async ({ session, decorateUrl }) => {
                if (session?.currentTask) return;
                const url = decorateUrl(config.auth.afterSignInUrl);
                if (url.startsWith('http')) {
                  window.location.href = url;
                } else {
                  router.push(url);
                }
              },
            });
            return;
          }
        }

        // Fallback: no recognized SSO state — direct navigation with no active OAuth flow,
        // or an unexpected Clerk state. Redirect rather than hanging on the spinner.
        router.push('/login');
      } catch (err: unknown) {
        setError(getClerkErrorMessage(err));
        setIsLoading(false);
      }
    })();
  }, [clerk, signIn, signUp, router]);

  return { error, isLoading };
}
