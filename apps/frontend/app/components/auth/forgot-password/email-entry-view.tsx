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

import { ForgotPasswordFormValues } from '@/lib/schemas/auth';
import { AuthBrandPanel } from '../auth-brand-panel';
import { ForgotPasswordBrandPanelContent } from './forgot-password-brand-panel-content';

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
    <div className="auth-forgot-password-form flex min-h-screen flex-col lg:flex-row">
      {/* Left Panel - Branding (Desktop Only) */}
      <AuthBrandPanel>
        <ForgotPasswordBrandPanelContent />
      </AuthBrandPanel>

      {/* Right Panel - Form */}
      <div className="auth-form-panel">
        <div className="auth-form-content">
          <div className="auth-form-mobile-intro">
            <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Forgot password?
            </h1>
            <p className="text-muted mt-3 text-lg">
              Enter your email and we&apos;ll send you a reset code
            </p>
          </div>

          <Form className="space-y-6" onSubmit={onSubmit}>
            <div className="auth-forgot-password-email-enter">
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
            </div>

            <div className="auth-forgot-password-submit-enter">
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
            </div>

            <p className="text-muted auth-forgot-password-redirect-enter text-center text-sm">
              Remember your password?{' '}
              <NextLink
                href="/login"
                className="text-accent hover:text-accent/80 font-semibold underline-offset-4 hover:underline"
              >
                Back to login
              </NextLink>
            </p>
          </Form>
        </div>
      </div>
    </div>
  );
}
