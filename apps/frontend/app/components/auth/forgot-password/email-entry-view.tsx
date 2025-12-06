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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';

import {
  forgotPasswordSchema,
  ForgotPasswordFormValues,
} from '@/lib/schemas/auth';

interface EmailEntryViewProps {
  onSubmit: (email: string) => Promise<void>;
  globalError: string;
}

export function EmailEntryView({ onSubmit, globalError }: EmailEntryViewProps) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onSubmit',
  });

  const handleFormSubmit = async (data: ForgotPasswordFormValues) => {
    await onSubmit(data.email);
  };

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
            <NextLink
              href="/"
              className="inline-flex items-center gap-3 text-2xl font-bold tracking-tight transition-opacity hover:opacity-90"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner ring-1 ring-white/20 backdrop-blur-md">
                <Icon icon="lucide:file-text" className="size-6 text-white" />
              </div>
              TailorCV
            </NextLink>
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
              Forgot password?
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Enter your email and we&apos;ll send you a reset code
            </p>
          </motion.div>

          <Form
            className="space-y-6"
            onSubmit={handleSubmit(handleFormSubmit)}
          >
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

            <AnimatePresence mode="wait">
              {globalError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-danger-50 text-danger flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
                >
                  <Icon
                    icon="lucide:alert-circle"
                    className="size-4 shrink-0"
                  />
                  {globalError}
                </motion.div>
              )}
            </AnimatePresence>

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
                      className="ml-2 size-4 transition-all group-hover:translate-x-1"
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
