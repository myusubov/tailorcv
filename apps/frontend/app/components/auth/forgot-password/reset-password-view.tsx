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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';

import { AnimatedError } from '@/app/components/ui';

import {
  resetPasswordSchema,
  ResetPasswordFormValues,
} from '@/lib/schemas/auth';

interface ResetPasswordViewProps {
  email: string;
  code: string;
  onCodeChange: (code: string) => void;
  onSubmit: (password: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  globalError: string;
  isResending: boolean;
}

export function ResetPasswordView({
  email,
  code,
  onCodeChange,
  onSubmit,
  onResend,
  onBack,
  globalError,
  isResending,
}: ResetPasswordViewProps) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  const handleFormSubmit = async (data: ResetPasswordFormValues) => {
    await onSubmit(data.password);
  };

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <NextLink
          href="/"
          className="mb-8 flex items-center gap-2 text-xl font-bold transition-opacity hover:opacity-80"
        >
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <Icon icon="lucide:file-text" className="size-5" />
          </div>
          TailorCV
        </NextLink>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-[440px]"
      >
        <Card className="w-full">
          <Card.Header className="flex flex-col gap-1 text-center">
            <Card.Title className="text-2xl">Reset your password</Card.Title>
            <Card.Description>
              We sent a 6-digit code to{' '}
              <span className="text-foreground font-medium">{email}</span>
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <Form
              onSubmit={handleSubmit(handleFormSubmit)}
              className="flex flex-col gap-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex justify-center py-4"
              >
                <InputOTP
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
                  <InputOTP.Separator />
                  <InputOTP.Group>
                    <InputOTP.Slot index={3} />
                    <InputOTP.Slot index={4} />
                    <InputOTP.Slot index={5} />
                  </InputOTP.Group>
                </InputOTP>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
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
                transition={{ duration: 0.3, delay: 0.4 }}
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
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Button
                  type="submit"
                  isDisabled={code.length !== 6 || isSubmitting}
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
                        className="ml-2 size-4 transition-all group-hover:translate-x-1"
                      />
                    </>
                  )}
                </Button>
              </motion.div>
            </Form>
          </Card.Content>
          <Card.Footer className="border-divider flex-col gap-2 border-t pt-4">
            <p className="text-muted-foreground text-center text-sm">
              Didn&apos;t receive the code?{' '}
              <button
                type="button"
                className="text-primary cursor-pointer font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onResend}
                disabled={isResending}
              >
                {isResending ? 'Resending...' : 'Resend code'}
              </button>
            </p>
            <p className="text-muted-foreground text-center text-sm">
              <button
                type="button"
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
