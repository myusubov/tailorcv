import NextLink from 'next/link';
import {
  Form,
  TextField,
  Label,
  Input,
  Button,
  Separator,
  FieldError,
  Spinner,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { Control, Controller, useWatch } from 'react-hook-form';
import { AuthLogo } from '@/app/components/auth/auth-logo';
import type { LoginAuthNotice } from '@/lib/auth/login-auth-reason';
import { LoginFormValues } from '@/lib/schemas/auth';

interface LoginFormViewProps {
  control: Control<LoginFormValues>;
  isSubmitting: boolean;
  googleLoading: boolean;
  appleLoading: boolean;
  authNotice: LoginAuthNotice | null;
  onSubmit: () => void;
  onGoogleSignIn: () => void;
  onAppleSignIn: () => void;
}

/**
 * Renders the password-login screen, inline recovery notice, and OAuth entry buttons.
 * When the login page receives an auth notice with a recovery action, this view presents
 * that action as a primary CTA because it blocks the user's next sign-in step.
 *
 * @param props - Form state, auth notices, loading state, and submission callbacks.
 * @returns The responsive login form panel and its mobile TailorCV branding.
 */
export function LoginFormView({
  control,
  isSubmitting,
  googleLoading,
  appleLoading,
  authNotice,
  onSubmit,
  onGoogleSignIn,
  onAppleSignIn,
}: LoginFormViewProps) {
  const isAnyAuthActionInProgress =
    isSubmitting || googleLoading || appleLoading;

  const emailValue = useWatch({ control, name: 'email', defaultValue: '' });
  return (
    <div className="auth-login-form auth-form-panel">
      <div className="auth-form-content">
        {/* Mobile Logo - Centered */}
        <div className="auth-form-mobile-logo">
          <AuthLogo className="text-foreground" />
        </div>

        <div className="auth-form-mobile-intro lg:hidden">
          <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back
          </h1>
          <p className="text-muted mt-3 text-lg">
            Enter your email to sign in to your account
          </p>
        </div>

        {authNotice ? (
          <div
            className="auth-login-notice-enter border-accent/20 bg-accent/5 space-y-3 rounded-2xl border px-4 py-4"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="bg-accent/10 text-accent flex size-9 shrink-0 items-center justify-center rounded-xl">
                <Icon icon="lucide:shield-alert" className="size-5" />
              </div>
              <div className="space-y-1 text-left">
                <p className="text-foreground font-semibold">
                  {authNotice.title}
                </p>
                <p className="text-muted text-sm">{authNotice.description}</p>
              </div>
            </div>

            {authNotice.actionHref && authNotice.actionLabel ? (
              <div className="flex pt-1">
                <NextLink
                  href={authNotice.actionHref}
                  className="bg-accent text-accent-foreground inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5 hover:opacity-95"
                >
                  <Icon icon="lucide:key-round" className="size-4" />
                  {authNotice.actionLabel}
                  <Icon icon="lucide:arrow-right" className="size-4" />
                </NextLink>
              </div>
            ) : null}
          </div>
        ) : null}

        <Form className="space-y-6" onSubmit={onSubmit}>
          <div className="auth-login-email-enter">
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  isRequired
                  className="w-full"
                  isInvalid={!!fieldState.error}
                >
                  <Label className="text-base">Email</Label>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="john@example.com"
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </TextField>
              )}
            />
          </div>

          <div className="auth-login-password-enter">
            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <div className="relative">
                  <TextField
                    isRequired
                    className="w-full"
                    isInvalid={!!fieldState.error}
                  >
                    <Label className="text-base">Password</Label>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </TextField>
                  <NextLink
                    href={`/forgot-password${emailValue ? `?email=${encodeURIComponent(emailValue)}` : ''}`}
                    className="text-accent absolute top-0 right-0 text-sm font-medium hover:underline"
                  >
                    Forgot password?
                  </NextLink>
                </div>
              )}
            />
          </div>

          <div className="auth-login-submit-enter">
            <Button
              type="submit"
              isDisabled={isAnyAuthActionInProgress}
              className="group w-full font-semibold shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Spinner color="current" size="sm" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <Icon
                    icon="lucide:arrow-right"
                    className="size-4 transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </Button>
          </div>

          <div className="auth-login-divider-enter relative py-2">
            <div className="absolute inset-0 flex items-center">
              <Separator className="border-divider w-full" />
            </div>
            <div className="relative flex justify-center text-xs tracking-wider uppercase">
              <span className="bg-background text-muted px-4 font-medium">
                Or
              </span>
            </div>
          </div>

          <div className="auth-login-social-enter">
            <Button
              type="button"
              variant="secondary"
              isDisabled={isAnyAuthActionInProgress}
              className="w-full font-medium"
              onPress={onGoogleSignIn}
            >
              {googleLoading ? (
                <>
                  <Spinner color="current" size="sm" />
                  Signing in with Google...
                </>
              ) : (
                <>
                  <Icon icon="logos:google-icon" className="size-5" />
                  Continue with Google
                </>
              )}
            </Button>
          </div>
          <div className="auth-login-social-enter">
            <Button
              type="button"
              variant="tertiary"
              isDisabled={isAnyAuthActionInProgress}
              className="w-full font-medium"
              onPress={onAppleSignIn}
            >
              {appleLoading ? (
                <>
                  <Spinner color="current" size="sm" />
                  Signing in with Apple...
                </>
              ) : (
                <>
                  <Icon icon="logos:apple" className="size-5 fill-current" />
                  Continue with Apple
                </>
              )}
            </Button>
          </div>

          <p className="auth-login-sign-up-enter text-muted text-center text-sm">
            Don&apos;t have an account?{' '}
            <NextLink
              href="/register"
              className="text-accent hover:text-accent/80 font-semibold underline-offset-4 hover:underline"
            >
              Sign up
            </NextLink>
          </p>
        </Form>
      </div>
    </div>
  );
}
