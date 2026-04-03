'use client';

import { useClerk, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button, InputOTP, Card, Tooltip, Spinner } from '@heroui/react';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { motion } from 'framer-motion';

import { AnimatedError } from '@/app/components/ui';
import { getClerkErrorMessage } from '@/lib/utils/utils';
import { config } from '@/lib/config';

export interface RegistrationVerificationProps {
  /** The email being verified */
  email: string;
  /** Callback to go back and fix the email */
  onGoBack: () => void;
  /** Passed from the parent's useSignUp to keep state in sync */
  signUp: ReturnType<typeof useSignUp>['signUp'];
  /** Hook form reset */
  resetForm: () => void;
}

export function RegistrationVerification({
  email,
  onGoBack,
  signUp,
  resetForm,
}: RegistrationVerificationProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Handle re-sending the verification code
  const handleResend = async () => {
    if (!signUp) return;
    setResending(true);
    setGlobalError('');

    try {
      await signUp.verifications.sendEmailCode();
      toast.success('Verification code resent');
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  // Handle the submission of the verification form
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setIsVerifying(true);

    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) {
        console.error(JSON.stringify(error, null, 2));
        const clerkError = getClerkErrorMessage(error);
        setGlobalError(clerkError || 'Verification failed');
        setIsVerifying(false);
        return;
      }

      if (signUp.status === 'complete') {
        await signUp.finalize({
          navigate: async ({ session, decorateUrl }) => {
            if (session.currentTask) {
              console.log("Session task triggered", session.currentTask)
              return
            }

            const url = decorateUrl(config.auth.afterSignUpUrl);
            if (url.startsWith('http')) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          }
        })
      }
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

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
                    className="text-muted hover:text-foreground bg-surface-elevated/90 absolute -top-4 -right-4 size-5"
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
            <form onSubmit={handleVerification} className="flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex justify-center pt-4"
              >
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={setCode}
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

              <Button
                type="submit"
                isDisabled={code.length !== 6 || isVerifying || resending}
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
            <p className="text-muted text-center text-sm">
              Didn&apos;t receive the code?{' '}
              <button
                type="button"
                className="text-primary cursor-pointer font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleResend}
                disabled={resending || isVerifying}
              >
                {resending ? 'Resending...' : 'Resend code'}
              </button>
            </p>
          </Card.Footer>
        </Card>
      </motion.div>
    </div>
  );
}
