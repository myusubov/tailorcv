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

import { ForgotPasswordFormValues } from '@/lib/schemas/auth';
import { AuthBrandPanel } from '../auth-brand-panel';

interface EmailEntryViewProps {
  control: Control<ForgotPasswordFormValues>;
  isSubmitting: boolean;
  onSubmit: () => void;
}

/**
 * Renders the forgot-password email step with responsive brand treatments.
 *
 * @param props - Form control, submission state, and submit callback.
 * @returns The desktop marketing panel and email-entry form.
 */
export function EmailEntryView({
  control,
  isSubmitting,
  onSubmit,
}: EmailEntryViewProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left Panel - Branding (Desktop Only) */}
      <AuthBrandPanel />

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
