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
import { LoginFormValues } from '@/lib/schemas/auth';

interface LoginFormViewProps {
  control: Control<LoginFormValues>;
  isSubmitting: boolean;
  googleLoading: boolean;
  appleLoading: boolean;
  globalError: string;
  onSubmit: () => void;
  onGoogleSignIn: () => void;
  onAppleSignIn: () => void;
}

export function LoginFormView({
  control,
  isSubmitting,
  googleLoading,
  appleLoading,
  globalError,
  onSubmit,
  onGoogleSignIn,
  onAppleSignIn,
}: LoginFormViewProps) {
  const isAnyAuthActionInProgress = isSubmitting || googleLoading || appleLoading;
  return (
    <div className="bg-background flex w-full flex-col justify-center p-6 lg:w-[55%] lg:px-24 lg:py-12">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mx-auto w-full max-w-[440px] space-y-10"
      >
        {/* Mobile Logo - Centered */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 flex justify-center lg:hidden"
        >
          <NextLink
            href="/"
            className="text-foreground flex items-center gap-2.5 text-2xl font-bold transition-opacity hover:opacity-80"
          >
            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
              <Icon icon="lucide:file-text" className="size-5" />
            </div>
            TailorCV
          </NextLink>
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
          <p className="text-muted mt-3 text-lg">
            Enter your email to sign in to your account
          </p>
        </motion.div>

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
                <TextField className="w-full" isInvalid={!!fieldState.error}>
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
                <TextField className="w-full" isInvalid={!!fieldState.error}>
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Password</Label>
                    <NextLink
                      href="/forgot-password"
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      Forgot password?
                    </NextLink>
                  </div>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Enter your password"
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </TextField>
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
              <span className="bg-background text-muted px-4 font-medium">
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
            className="text-muted text-center text-sm"
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
