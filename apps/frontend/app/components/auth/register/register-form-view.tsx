import NextLink from 'next/link';
import { Button, Form, Separator, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { Control } from 'react-hook-form';

import { AnimatedError } from '@/app/components/ui';
import type { RegisterFormValues } from '@/lib/schemas/auth';

import { RegisterFields } from './register-fields';
import { RegisterSocialActions } from './register-social-actions';
import { RegisterTermsField } from './register-terms-field';

export interface RegisterFormViewProps {
  control: Control<RegisterFormValues>;
  globalError: string;
  googleLoading: boolean;
  appleLoading: boolean;
  isSubmitting: boolean;
  isAnyAuthActionInProgress: boolean;
  onSubmit: () => void;
  onGoogleSignUp: () => void;
  onAppleSignUp: () => void;
}

/**
 * Renders the registration form, provider actions, and login navigation.
 *
 * @param props - Form control, request state, errors, and registration callbacks.
 * @returns The render-only register form with route-scoped CSS animation targets.
 */
export function RegisterFormView({
  control,
  globalError,
  googleLoading,
  appleLoading,
  isSubmitting,
  isAnyAuthActionInProgress,
  onSubmit,
  onGoogleSignUp,
  onAppleSignUp,
}: RegisterFormViewProps) {
  return (
    <Form className="space-y-6" onSubmit={onSubmit}>
      <RegisterFields control={control} />
      <RegisterTermsField control={control} />

      <AnimatedError message={globalError} />

      <div id="clerk-captcha" />

      <div className="auth-register-submit-enter">
        <Button
          type="submit"
          isDisabled={isAnyAuthActionInProgress}
          className="group w-full font-semibold shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Spinner color="current" size="sm" />
              Creating Account...
            </>
          ) : (
            <>
              Create Account
              <Icon
                icon="lucide:arrow-right"
                className="size-4 transition-all group-hover:translate-x-1"
              />
            </>
          )}
        </Button>
      </div>

      <div className="auth-register-divider-enter relative py-2">
        <div className="absolute inset-0 flex items-center">
          <Separator className="border-divider w-full" />
        </div>
        <div className="relative flex justify-center text-xs tracking-wider uppercase">
          <span className="bg-background text-muted px-4 font-medium">Or</span>
        </div>
      </div>

      <RegisterSocialActions
        appleLoading={appleLoading}
        googleLoading={googleLoading}
        isAnyAuthActionInProgress={isAnyAuthActionInProgress}
        onAppleSignUp={onAppleSignUp}
        onGoogleSignUp={onGoogleSignUp}
      />

      <p className="auth-register-login-enter text-muted text-center text-sm">
        Already have an account?{' '}
        <NextLink
          href="/login"
          className="text-accent hover:text-accent/80 font-semibold underline-offset-4 hover:underline"
        >
          Log in
        </NextLink>
      </p>
    </Form>
  );
}
