'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { Form, TextField, Label, Input, Button, Link, Separator, FieldError } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { loginSchema, LoginFormValues } from '@/lib/schemas/auth';

export default function LoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [globalError, setGlobalError] = useState('');
  const router = useRouter();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: "onSubmit"
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
        // router.push('/dashboard');
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setGlobalError(err.errors?.[0]?.message || 'Invalid email or password');
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err: any) {
      console.error(err);
      setGlobalError('Oauth failed')
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left Panel - Branding (Desktop Only) */}
      <div className="relative hidden w-full flex-col justify-between overflow-hidden bg-[#020617] p-12 text-white lg:flex lg:w-[45%] xl:p-16">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(79,70,229,0.15),_transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(59,130,246,0.15),_transparent)]" />
        <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px]" />

        <div className="relative z-10">
          <NextLink href="/" className="inline-flex items-center gap-3 text-2xl font-bold tracking-tight transition-opacity hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner backdrop-blur-md ring-1 ring-white/20">
              <Icon icon="lucide:file-text" className="size-6 text-white" />
            </div>
            TailorCV
          </NextLink>

          <div className="mt-24 max-w-lg">
            <h1 className="text-5xl font-bold tracking-tight leading-tight lg:text-6xl">
              Welcome back to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                TailorCV
              </span>
            </h1>
            <p className="mt-8 text-xl leading-relaxed text-slate-300">
              Please enter your details to sign in.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-12 space-y-6">
           <div className="flex items-center gap-4 group">
            <div className="flex size-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30 transition-colors group-hover:bg-indigo-500/30 group-hover:text-indigo-200">
                <Icon icon="lucide:check" className="size-4" />
            </div>
            <span className="text-lg font-medium text-slate-200">Continue where you left off</span>
            </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full flex-col justify-center bg-background p-6 lg:w-[55%] lg:px-24 lg:py-12">
        <div className="mx-auto w-full max-w-[440px] space-y-10">

          {/* Mobile Logo - Centered */}
          <div className="flex justify-center lg:hidden mb-8">
            <NextLink href="/" className="flex items-center gap-2.5 text-2xl font-bold text-foreground transition-opacity hover:opacity-80">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon icon="lucide:file-text" className="size-5" />
              </div>
              TailorCV
            </NextLink>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Welcome back</h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Enter your email to sign in to your account
            </p>
          </div>

          <Form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
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
                  {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                </TextField>
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <TextField className="w-full" isInvalid={!!fieldState.error}>
                    <div className="flex justify-between items-center">
                        <Label className="text-base">Password</Label>
                        <Link href="/forgot-password" className="text-sm font-medium text-primary">
                            Forgot password?
                        </Link>
                    </div>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Enter your password"
                  />
                  {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                </TextField>
              )}
            />

            {globalError && (
              <div className="flex items-center gap-2 rounded-lg bg-danger-50 px-4 py-3 text-sm font-medium text-danger">
                <Icon icon="lucide:alert-circle" className="size-4 shrink-0" />
                {globalError}
              </div>
            )}

            <Button type="submit" isPending={isSubmitting} className="w-full bg-primary font-semibold text-primary-foreground shadow-sm group hover:bg-primary/90">
              Sign In
              <Icon icon="lucide:arrow-right" className="ml-2 size-4 group-hover:translate-x-1 transition-all" />
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full border-divider" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-background px-4 text-muted-foreground font-medium">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full font-medium"
              onPress={handleGoogleSignIn}
            >
              <Icon icon="logos:google-icon" className="mr-3 size-5" />
              Continue with Google
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <NextLink href="/register" className="font-semibold text-primary hover:text-primary/80 hover:underline underline-offset-4">
                Sign up
              </NextLink>
            </p>

          </Form>
        </div>
      </div>
    </div>
  );
}
