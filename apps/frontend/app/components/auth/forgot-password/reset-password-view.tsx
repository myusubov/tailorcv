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
  InputOTP,
  Card,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { Control, Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { maskEmail2 } from 'maskdata';

import { AnimatedError } from '@/app/components/ui';
import { ResetPasswordFormValues } from '@/lib/schemas/auth';

type ResetPasswordStep = 'verify-code' | 'set-password';

interface ResetPasswordViewProps {
  control: Control<ResetPasswordFormValues>;
  isSubmitting: boolean;
  email: string;
  step: ResetPasswordStep;
  code: string;
  onCodeChange: (code: string) => void;
  onVerifyCode: () => Promise<void>;
  onSetPassword: () => void;
  onResend: () => Promise<void>;
  onBack: () => void;
  globalError: string;
  isResending: boolean;
  isVerifyingCode: boolean;
  remainingSeconds: number | null;
}

/**
 * Renders reset-code verification and new-password entry in a centered recovery card.
 *
 * @param props - Reset flow state, form control, and transition callbacks.
 * @returns The active reset-password step with masked email context.
 */
export function ResetPasswordView({
  control,
  isSubmitting,
  email,
  step,
  code,
  onCodeChange,
  onVerifyCode,
  onSetPassword,
  onResend,
  onBack,
  globalError,
  isResending,
  isVerifyingCode,
  remainingSeconds,
}: ResetPasswordViewProps) {
  const isVerifyStep = step === 'verify-code';
  const maskedEmail = email ? maskEmail2(email) : '';
  const description = isVerifyStep
    ? `We sent a 6-digit code to ${maskedEmail}`
    : email
      ? `Enter a new password for ${maskedEmail}`
      : 'Enter your new password to finish resetting your account';

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-110"
      >
        <Card className="w-full">
          <Card.Header className="flex flex-col gap-1 text-center">
            <Card.Title className="text-2xl">Reset your password</Card.Title>
            <Card.Description>{description}</Card.Description>
          </Card.Header>
          <Card.Content>
            {isVerifyStep ? (
              <Form
                onSubmit={(event) => {
                  event.preventDefault();
                  void onVerifyCode();
                }}
                className="flex flex-col gap-6"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="flex justify-center pt-4"
                >
                  <InputOTP
                    aria-label="Reset code"
                    maxLength={6}
                    value={code}
                    onChange={onCodeChange}
                    pattern="^[0-9]*$"
                    inputMode="numeric"
                  >
                    <InputOTP.Group>
                      <InputOTP.Slot index={0} />
                      <InputOTP.Slot index={1} />
                      <InputOTP.Slot index={2} />
                    </InputOTP.Group>
                    <InputOTP.Group>
                      <InputOTP.Slot index={3} />
                      <InputOTP.Slot index={4} />
                      <InputOTP.Slot index={5} />
                    </InputOTP.Group>
                  </InputOTP>
                </motion.div>

                <AnimatedError message={globalError} />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Button
                    type="submit"
                    isDisabled={code.length !== 6 || isVerifyingCode}
                    className="group w-full shadow-sm"
                  >
                    {isVerifyingCode ? (
                      <>
                        <Spinner color="current" size="sm" />
                        Verifying Code...
                      </>
                    ) : (
                      <>
                        Verify Code
                        <Icon
                          icon="lucide:arrow-right"
                          className="size-4 transition-all group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </Button>
                </motion.div>
              </Form>
            ) : (
              <Form onSubmit={onSetPassword} className="flex flex-col gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Controller
                    name="password"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        className="w-full"
                        isInvalid={!!fieldState.error}
                      >
                        <Label className="text-base">New Password</Label>
                        <Input
                          {...field}
                          aria-label="New password"
                          type="password"
                          placeholder="Min. 8 characters"
                        />
                        {fieldState.error && (
                          <FieldError>{fieldState.error.message}</FieldError>
                        )}
                      </TextField>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        className="w-full"
                        isInvalid={!!fieldState.error}
                      >
                        <Label className="text-base">Confirm Password</Label>
                        <Input
                          {...field}
                          aria-label="Confirm password"
                          type="password"
                          placeholder="Confirm your password"
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <Button
                    type="submit"
                    isDisabled={isSubmitting}
                    className="group w-full shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner color="current" size="sm" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        Reset Password
                        <Icon
                          icon="lucide:arrow-right"
                          className="size-4 transition-all group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </Button>
                </motion.div>
              </Form>
            )}
          </Card.Content>
          <Card.Footer className="border-divider flex-col gap-2 border-t pt-4">
            {isVerifyStep && (
              <p className="text-muted-foreground text-center text-sm">
                Didn&apos;t receive the code?{' '}
                <button
                  type="button"
                  aria-label="Resend reset code"
                  className="text-primary cursor-pointer font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={onResend}
                  disabled={isResending || remainingSeconds !== null}
                >
                  {isResending
                    ? 'Resending...'
                    : remainingSeconds !== null
                      ? `Resend in ${remainingSeconds}s`
                      : 'Resend'}
                </button>
              </p>
            )}
            <p className="text-muted-foreground text-center text-sm">
              <button
                type="button"
                aria-label="Use a different email address"
                className="text-primary cursor-pointer font-medium hover:underline"
                onClick={onBack}
              >
                ← Use a different email
              </button>
            </p>
          </Card.Footer>
        </Card>
      </motion.div>
    </div>
  );
}
