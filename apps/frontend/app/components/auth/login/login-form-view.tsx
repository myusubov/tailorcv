import { motion } from 'framer-motion';
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
import { Control, Controller } from 'react-hook-form';
import { AnimatedError } from '@/app/components/ui';
import { AuthLogo } from '@/app/components/auth/auth-logo';
import type { LoginAuthNotice } from '@/lib/auth/login-auth-reason';
import { LoginFormValues } from '@/lib/schemas/auth';

interface LoginFormViewProps {
  control: Control<LoginFormValues>;
  isSubmitting: boolean;
  googleLoading: boolean;
  appleLoading: boolean;
  authNotice: LoginAuthNotice | null;
  globalError: string;
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
  globalError,
  onSubmit,
  onGoogleSignIn,
  onAppleSignIn,
}: LoginFormViewProps) {
  const isAnyAuthActionInProgress =
    isSubmitting || googleLoading || appleLoading;
  return (
    <div className="auth-form-panel">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="auth-form-content"
      >
        {/* Mobile Logo - Centered */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="auth-form-mobile-logo"
        >
          <AuthLogo className="text-foreground" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center lg:text-left"
        >
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">
            Enter your email to sign in to your account
          </p>
        </motion.div>

        {authNotice ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="border-primary/20 bg-primary/5 space-y-3 rounded-2xl border px-4 py-4"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                <Icon icon="lucide:shield-alert" className="size-5" />
              </div>
              <div className="space-y-1 text-left">
                <p className="text-foreground font-semibold">
                  {authNotice.title}
                </p>
                <p className="text-muted-foreground text-sm">
                  {authNotice.description}
                </p>
              </div>
            </div>

            {authNotice.actionHref && authNotice.actionLabel ? (
              <div className="flex pt-1">
                <NextLink
                  href={authNotice.actionHref}
                  className="bg-primary text-primary-foreground inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5 hover:opacity-95"
                >
                  <Icon icon="lucide:key-round" className="size-4" />
                  {authNotice.actionLabel}
                  <Icon icon="lucide:arrow-right" className="size-4" />
                </NextLink>
              </div>
            ) : null}
          </motion.div>
        ) : null}

        <Form className="space-y-6" onSubmit={onSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
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
                    placeholder="john@example.com"
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </TextField>
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
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
                    />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </TextField>
                  <NextLink
                    href="/forgot-password"
                    className="text-primary absolute top-0 right-0 text-sm font-medium hover:underline"
                  >
                    Forgot password?
                  </NextLink>
                </div>
              )}
            />
          </motion.div>

          <AnimatedError message={globalError} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
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
                    className="size-4 transition-all group-hover:translate-x-1"
                  />
                </>
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="relative py-2"
          >
            <div className="absolute inset-0 flex items-center">
              <Separator className="border-divider w-full" />
            </div>
            <div className="relative flex justify-center text-xs tracking-wider uppercase">
              <span className="bg-background text-muted-foreground px-4 font-medium">
                Or
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
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
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
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
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="text-muted-foreground text-center text-sm"
          >
            Don&apos;t have an account?{' '}
            <NextLink
              href="/register"
              className="text-primary hover:text-primary/80 font-semibold underline-offset-4 hover:underline"
            >
              Sign up
            </NextLink>
          </motion.p>
        </Form>
      </motion.div>
    </div>
  );
}
