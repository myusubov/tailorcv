'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Form,
  TextField,
  Label,
  Input,
  Button,
  Link,
  Separator,
  FieldError,
  Spinner,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';

import { AnimatedError } from '@/app/components/ui';

import { loginSchema, LoginFormValues } from '@/lib/schemas/auth';
import { getClerkErrorMessage } from '@/lib/utils';
import { config, LOGOS } from '@/lib/config';
import Image from 'next/image';

export default function LoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [globalError, setGlobalError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (!isLoaded) return;
    setGlobalError('');

    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push(config.auth.afterSignInUrl as string);
      } else {
      }
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Invalid email or password');
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;
    try {
      setGoogleLoading(true);
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: config.auth.afterSignInUrl,
      });
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'OAuth failed');
    } finally {
      setGoogleLoading(false);
    }
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
                <Image
                  src={LOGOS.TAILORCV}
                  alt="TailorCV Logo"
                  width={40}
                  height={40}
                  priority
                  quality={100}
                  loading="eager"
                />
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
              Welcome back to <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                TailorCV
              </span>
            </h1>
            <p className="mt-8 text-xl leading-relaxed text-slate-300">
              Please enter your details to sign in.
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
              <Icon icon="lucide:check" className="size-4" />
            </div>
            <span className="text-lg font-medium text-slate-200">
              Continue where you left off
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
              Welcome back
            </h2>
            <p className="text-muted mt-3 text-lg">
              Enter your email to sign in to your account
            </p>
          </motion.div>

          <Form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Controller
                name="password"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField className="w-full" isInvalid={!!fieldState.error}>
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Password</Label>
                      <NextLink
                        href="/forgot-password"
                        className="text-primary text-sm font-medium hover:underline"
                      >
                        Forgot password?
                      </NextLink>
                    </div>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter your password"
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
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Button
                type="submit"
                isDisabled={isSubmitting || googleLoading}
                className="group w-full font-semibold shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Spinner color="current" size="sm" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <Icon
                      icon="lucide:arrow-right"
                      className="size-4 transition-all group-hover:translate-x-1"
                    />
                  </>
                )}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="relative py-2"
            >
              <div className="absolute inset-0 flex items-center">
                <Separator className="border-divider w-full" />
              </div>
              <div className="relative flex justify-center text-xs tracking-wider uppercase">
                <span className="bg-background text-muted px-4 font-medium">
                  Or
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <Button
                type="button"
                variant="secondary"
                isDisabled={googleLoading || isSubmitting}
                className="w-full font-medium"
                onPress={handleGoogleSignIn}
              >
                {googleLoading ? (
                  <>
                    <Spinner color="current" size="sm" />
                    Signing in with Google...
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
              transition={{ duration: 0.4, delay: 0.8 }}
              className="text-muted text-center text-sm"
            >
              Don&apos;t have an account?{' '}
              <NextLink
                href="/register"
                className="text-primary hover:text-primary/80 font-semibold underline-offset-4 hover:underline"
              >
                Sign up
              </NextLink>
            </motion.p>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
