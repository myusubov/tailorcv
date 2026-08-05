'use client';

import { Button, Card, InputOTP, Spinner, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

import { AnimatedError } from '@/app/components/ui';

export interface RegistrationVerificationViewProps {
  code: string;
  email: string;
  globalError: string;
  isResending: boolean;
  isVerifying: boolean;
  onCodeChange: (code: string) => void;
  onGoBack: () => void;
  onResend: () => Promise<void>;
  onSubmit: (event: React.FormEvent) => Promise<void>;
}

export function RegistrationVerificationView({
  code,
  email,
  globalError,
  isResending,
  isVerifying,
  onCodeChange,
  onGoBack,
  onResend,
  onSubmit,
}: RegistrationVerificationViewProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full"
      >
        <Card className="w-full">
          <Card.Header className="flex flex-col gap-1 text-center">
            <Card.Title className="text-2xl">Check your email</Card.Title>
            <Card.Description>
              We&apos;ve sent a 6-digit code to{' '}
              <span className="relative inline-flex items-center justify-center">
                <span className="text-foreground font-medium">{email}</span>
                <Tooltip delay={500}>
                  <Button
                    isIconOnly
                    className="text-muted-foreground hover:text-foreground bg-surface-elevated/90 absolute -top-4 -right-4 size-5"
                    onClick={onGoBack}
                  >
                    <Icon icon="lucide:undo-2" className="size-3" />
                  </Button>
                  <Tooltip.Content className="bg-secondary text-secondary-foreground shadow-2xl">
                    Wrong email address ? Change it back
                  </Tooltip.Content>
                </Tooltip>
              </span>
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <form onSubmit={onSubmit} className="flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex justify-center pt-4"
              >
                <InputOTP
                  aria-label="Verification code"
                  maxLength={6}
                  value={code}
                  onChange={onCodeChange}
                  pattern="^[0-9]*$"
                  inputMode="numeric"
                  className='justify-center'
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

              <Button
                type="submit"
                isDisabled={code.length !== 6 || isVerifying || isResending}
                className="group w-full shadow-sm"
              >
                {isVerifying ? (
                  <>
                    <Spinner color="current" size="sm" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Email
                    <Icon
                      icon="lucide:arrow-right"
                      className="size-4 transition-all group-hover:translate-x-1"
                    />
                  </>
                )}
              </Button>
            </form>
          </Card.Content>
          <Card.Footer className="border-divider flex-col gap-2 border-t pt-4">
            <p className="text-muted-foreground text-center text-sm">
              Didn&apos;t receive the code?{' '}
              <button
                type="button"
                className="text-primary cursor-pointer font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onResend}
                disabled={isResending || isVerifying}
              >
                {isResending ? 'Resending...' : 'Resend code'}
              </button>
            </p>
          </Card.Footer>
        </Card>
      </motion.div>
    </div>
  );
}
