import { Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';

interface RegisterSocialActionsProps {
  appleLoading: boolean;
  googleLoading: boolean;
  isAnyAuthActionInProgress: boolean;
  onAppleSignUp: () => void;
  onGoogleSignUp: () => void;
}

/**
 * Renders the Google and Apple registration actions with shared loading state.
 *
 * @param props - Provider loading state, disabled state, and sign-up callbacks.
 * @returns The provider buttons with route-scoped CSS animation targets.
 */
export function RegisterSocialActions({
  appleLoading,
  googleLoading,
  isAnyAuthActionInProgress,
  onAppleSignUp,
  onGoogleSignUp,
}: RegisterSocialActionsProps) {
  return (
    <>
      <div className="auth-register-social-enter">
        <Button
          type="button"
          variant="secondary"
          isDisabled={isAnyAuthActionInProgress}
          className="w-full font-medium"
          onPress={onGoogleSignUp}
        >
          {googleLoading ? (
            <>
              <Spinner color="current" size="sm" />
              Signing up with Google...
            </>
          ) : (
            <>
              <Icon icon="logos:google-icon" className="size-5" />
              Continue with Google
            </>
          )}
        </Button>
      </div>

      <div className="auth-register-social-enter">
        <Button
          type="button"
          variant="tertiary"
          isDisabled={isAnyAuthActionInProgress}
          className="w-full font-medium"
          onPress={onAppleSignUp}
        >
          {appleLoading ? (
            <>
              <Spinner color="current" size="sm" />
              Signing up with Apple...
            </>
          ) : (
            <>
              <Icon icon="logos:apple" className="size-5 fill-current" />
              Continue with Apple
            </>
          )}
        </Button>
      </div>
    </>
  );
}
