'use client';

import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Form,
  TextField,
  Label,
  Input,
  Button,
  Checkbox,
  Link,
  Separator,
  FieldError,
  Spinner,
  InputOTP,
  Card,
} from '@heroui/react';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';

import { registerSchema, RegisterFormValues } from '@/lib/schemas/auth';
import { getClerkErrorMessage } from '@/lib/utils';

export default function RegisterPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      terms: false,
    },
    mode: 'onSubmit',
  });

  // Handle submission of the sign-up form
  const onSubmit = async (data: RegisterFormValues) => {
    if (!isLoaded) return;
    setGlobalError('');

    try {
      if (!signUp.status || signUp.status === 'missing_requirements') {
        await signUp.create({
          emailAddress: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        });
      }

      // Send the user an email with the verification code
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      setVerifying(true);
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Something went wrong');
    }
  };

  // Handle re-sending the verification code
  const handleResend = async () => {
    if (!isLoaded) return;
    setResending(true);
    setGlobalError('');

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });
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
    if (!isLoaded) return;
    setIsVerifying(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status !== 'complete') {
        console.log(JSON.stringify(completeSignUp, null, 2));
      }

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push('/test');
      }
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;
    try {
      setGoogleLoading(true);
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/test',
      });
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Oauth failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  if (verifying) {
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
          className="w-full max-w-[400px]"
        >
          <Card className="w-full max-w-[400px]">
            <Card.Header className="flex flex-col gap-1 text-center">
              <Card.Title className="text-2xl">Check your email</Card.Title>
              <Card.Description>
                We&apos;ve sent a 6-digit verification code to{' '}
                <span className="text-foreground font-medium">
                  {control._formValues.email}
                </span>
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <form
                onSubmit={handleVerification}
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
                    onChange={setCode}
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

                <Button
                  type="submit"
                  isDisabled={code.length !== 6 || isVerifying}
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
                        className="ml-2 size-4 transition-all group-hover:translate-x-1"
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
                  onClick={handleResend}
                  disabled={resending}
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(79,70,229,0.15),_transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(59,130,246,0.15),_transparent)]" />
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
              Tailor your CV <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                in 30 seconds
              </span>
            </h1>
            <p className="mt-8 text-xl leading-relaxed text-slate-300">
              Stop sending generic resumes. Our AI analyzes the job description
              and customizes your CV to match perfectly.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 mt-12 space-y-6">
          {[
            'AI-powered customization',
            'ATS-friendly templates',
            'Instant PDF download',
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
              className="group flex items-center gap-4"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30 transition-colors group-hover:bg-indigo-500/30 group-hover:text-indigo-200">
                <Icon icon="lucide:check" className="size-4" />
              </div>
              <span className="text-lg font-medium text-slate-200">
                {feature}
              </span>
            </motion.div>
          ))}
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
              Create account
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Start building your resume for free.
            </p>
          </motion.div>

          <Form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      className="w-full"
                      isInvalid={!!fieldState.error}
                    >
                      <Label className="text-base">First Name</Label>
                      <Input {...field} placeholder="John" />
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
                transition={{ duration: 0.4, delay: 0.35 }}
              >
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      className="w-full"
                      isInvalid={!!fieldState.error}
                    >
                      <Label className="text-base">Last Name</Label>
                      <Input {...field} placeholder="Doe" />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </TextField>
                  )}
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
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
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Controller
                name="password"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField className="w-full" isInvalid={!!fieldState.error}>
                    <Label className="text-base">Password</Label>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Controller
                name="terms"
                control={control}
                render={({
                  field: { value, onChange, ...field },
                  fieldState,
                }) => (
                  <div className="flex flex-col gap-1">
                    <Checkbox
                      className="flex items-start pt-1"
                      isSelected={value}
                      onChange={onChange}
                      isInvalid={!!fieldState.error}
                      {...field}
                    >
                      <Checkbox.Control className="size-5">
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <span className="text-muted-foreground text-sm leading-snug">
                          I agree to the{' '}
                          <Link
                            href="/terms"
                            className="text-primary hover:text-primary/80 font-bold"
                          >
                            Terms
                          </Link>{' '}
                          and{' '}
                          <Link
                            href="/privacy"
                            className="text-primary hover:text-primary/80 font-bold"
                          >
                            Privacy Policy
                          </Link>
                        </span>
                      </Checkbox.Content>
                    </Checkbox>
                    {fieldState.error && (
                      <span className="text-tiny text-danger">
                        {fieldState.error.message}
                      </span>
                    )}
                  </div>
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

            <div id="clerk-captcha" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <Button
                type="submit"
                isDisabled={isSubmitting || googleLoading}
                className="group w-full font-semibold shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Spinner color="current" size="sm" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <Icon
                      icon="lucide:arrow-right"
                      className="ml-2 size-4 transition-all group-hover:translate-x-1"
                    />
                  </>
                )}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="relative py-2"
            >
              <div className="absolute inset-0 flex items-center">
                <Separator className="border-divider w-full" />
              </div>
              <div className="relative flex justify-center text-xs tracking-wider uppercase">
                <span className="bg-background text-muted-foreground px-4 font-medium">
                  Or
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.9 }}
            >
              <Button
                type="button"
                variant="secondary"
                isDisabled={googleLoading || isSubmitting}
                className="w-full font-medium"
                onPress={handleGoogleSignUp}
              >
                {googleLoading ? (
                  <>
                    <Spinner color="current" size="sm" />
                    Signing up with Google...
                  </>
                ) : (
                  <>
                    <Icon icon="logos:google-icon" className="size-5" />
                    Continue with Google
                  </>
                )}
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.0 }}
              className="text-muted-foreground text-center text-sm"
            >
              Already have an account?{' '}
              <NextLink
                href="/login"
                className="text-primary hover:text-primary/80 font-semibold underline-offset-4 hover:underline"
              >
                Log in
              </NextLink>
            </motion.p>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
