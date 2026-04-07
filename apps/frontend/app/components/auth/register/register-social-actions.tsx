import { motion } from 'framer-motion';
import { Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';

interface RegisterSocialActionsProps {
  appleLoading: boolean;
  googleLoading: boolean;
  isAnyAuthActionInProgress: boolean;
  onAppleSignUp: () => void;
  onGoogleSignUp: () => void;
}

export function RegisterSocialActions({
  appleLoading,
  googleLoading,
  isAnyAuthActionInProgress,
  onAppleSignUp,
  onGoogleSignUp,
}: RegisterSocialActionsProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.9 }}
      >
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.9 }}
      >
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
      </motion.div>
    </>
  );
}
