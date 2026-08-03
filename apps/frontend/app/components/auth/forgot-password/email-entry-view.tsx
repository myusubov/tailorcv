'use client';

import NextLink from 'next/link';
import {
  Form,
  TextField,
  Label,
  Input,
  Button,
  FieldError,
  Spinner,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { Control, Controller } from 'react-hook-form';
import { motion } from 'framer-motion';

import { AnimatedError } from '@/app/components/ui';
import { ForgotPasswordFormValues } from '@/lib/schemas/auth';
import { AuthLogo } from '../auth-logo';

interface EmailEntryViewProps {
  control: Control<ForgotPasswordFormValues>;
  isSubmitting: boolean;
  onSubmit: () => void;
  globalError: string;
}

/**
 * Renders the forgot-password email step with responsive brand treatments.
 *
 * @param props - Form control, submission state, submit callback, and global error.
 * @returns The desktop marketing panel and email-entry form.
 */
export function EmailEntryView({
  control,
  isSubmitting,
  onSubmit,
  globalError,
}: EmailEntryViewProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left Panel - Branding (Desktop Only) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative hidden w-full flex-col justify-between overflow-hidden bg-[#020617] p-12 text-white lg:flex lg:w-[45%] xl:p-16"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(79,70,229,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.15),transparent)]" />
        <div className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute -right-20 -bottom-20 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px]" />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AuthLogo variant="inverse" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-24 max-w-lg"
          >
            <h1 className="text-5xl leading-tight font-bold tracking-tight lg:text-6xl">
              Forgot your <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                password?
              </span>
            </h1>
            <p className="mt-8 text-xl leading-relaxed text-slate-300">
              No worries! Enter your email and we&apos;ll send you a code to
              reset your password.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 mt-12 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="group flex items-center gap-4"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30 transition-colors group-hover:bg-indigo-500/30 group-hover:text-indigo-200">
              <Icon icon="lucide:shield-check" className="size-4" />
            </div>
            <span className="text-lg font-medium text-slate-200">
              Secure password reset
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <div className="auth-form-panel">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="auth-form-content"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Forgot password?
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Enter your email and we&apos;ll send you a reset code
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

            <AnimatedError message={globalError} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Button
                type="submit"
                isDisabled={isSubmitting}
                className="group w-full font-semibold shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Spinner color="current" size="sm" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Send Reset Code
                    <Icon
                      icon="lucide:arrow-right"
                      className="size-4 transition-all group-hover:translate-x-1"
                    />
                  </>
                )}
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="text-muted-foreground text-center text-sm"
            >
              Remember your password?{' '}
              <NextLink
                href="/login"
                className="text-primary hover:text-primary/80 font-semibold underline-offset-4 hover:underline"
              >
                Back to login
              </NextLink>
            </motion.p>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
