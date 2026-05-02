import { motion } from 'framer-motion';
import { Card, InputOTP, Button, Spinner } from '@heroui/react';
import { AnimatedError } from '@/app/components/ui';

interface VerificationViewProps {
  code: string;
  onCodeChange: (code: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isVerifying: boolean;
  isResending: boolean;
  onResend: () => void;
  onBack: () => void;
  error: string;
}

export function VerificationView({
  code,
  onCodeChange,
  onSubmit,
  isVerifying,
  isResending,
  onResend,
  onBack,
  error,
}: VerificationViewProps) {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[400px]"
      >
        <Card className="w-full">
          <Card.Header className="flex flex-col gap-1 text-center">
            <Card.Title className="text-2xl">Verify your identity</Card.Title>
            <Card.Description>
              Enter the 6-digit code we sent to your email
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <form onSubmit={onSubmit} className="flex flex-col gap-6">
              <div className="flex justify-center py-4">
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
                  <InputOTP.Group>
                    <InputOTP.Slot index={3} />
                    <InputOTP.Slot index={4} />
                    <InputOTP.Slot index={5} />
                  </InputOTP.Group>
                </InputOTP>
              </div>

              <AnimatedError message={error} />

              <Button
                type="submit"
                isDisabled={code.length !== 6 || isVerifying}
                className="w-full shadow-sm"
              >
                {isVerifying ? (
                  <>
                    <Spinner color="current" size="sm" />
                    Verifying...
                  </>
                ) : (
                  'Complete Sign In'
                )}
              </Button>
            </form>
          </Card.Content>
          <Card.Footer className="border-divider flex-col gap-2 border-t pt-4">
            <p className="text-muted-foreground text-center text-sm">
              Didn&apos;t receive the code?{' '}
              <button
                type="button"
                className="text-primary cursor-pointer font-medium hover:underline disabled:opacity-50"
                onClick={onResend}
                disabled={isResending}
              >
                {isResending ? 'Resending...' : 'Resend code'}
              </button>
            </p>
            <button
              type="button"
              className="text-muted-foreground mt-2 text-sm hover:underline"
              onClick={onBack}
            >
              Back to Sign In
            </button>
          </Card.Footer>
        </Card>
      </motion.div>
    </div>
  );
}
