'use client';

import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { Form, TextField, Label, Input, Button, Checkbox, Link, Separator, FieldError } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { registerSchema, RegisterFormValues } from '@/lib/schemas/auth';


export default function RegisterPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [globalError, setGlobalError] = useState('');
  const router = useRouter();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      terms: false
    },
    mode: "onSubmit"
  });

  // Handle submission of the sign-up form
  const onSubmit = async (data: RegisterFormValues) => {
    if (!isLoaded) return;
    setGlobalError('');

    try {
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // Send the user an email with the verification code
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      setVerifying(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setGlobalError(err.errors?.[0]?.message || 'Something went wrong');
    }
  };

  // Handle the submission of the verification form
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status !== 'complete') {
        console.log(JSON.stringify(completeSignUp, null, 2));
      }

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setGlobalError(err.errors?.[0]?.message || 'Verification failed');
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err: any) {
      console.error(err);
      setGlobalError('Oauth failed')
    }
  }

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-content1 p-10 shadow-xl">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-foreground">Verify your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a code to your email.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleVerification}>
            <input type="hidden" name="remember" value="true" />
            <div className="-space-y-px rounded-md shadow-sm">
              <TextField>
                <Label>Verification Code</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="bg-default-100 text-lg tracking-widest"
                />
              </TextField>
            </div>

            {globalError && <p className="text-center text-sm text-danger">{globalError}</p>}

            <div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Verify & Create Account
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
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
              <Icon icon="lucide:file-text" className="h-6 w-6 text-white" />
            </div>
            TailorCV
          </NextLink>

          <div className="mt-24 max-w-lg">
            <h1 className="text-5xl font-bold tracking-tight leading-tight lg:text-6xl">
              Tailor your CV <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                in 30 seconds
              </span>
            </h1>
            <p className="mt-8 text-xl leading-relaxed text-slate-300">
              Stop sending generic resumes. Our AI analyzes the job description and customizes your CV to match perfectly.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-12 space-y-6">
          {[
            "AI-powered customization",
            "ATS-friendly templates",
            "Instant PDF download"
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-4 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30 transition-colors group-hover:bg-indigo-500/30 group-hover:text-indigo-200">
                <Icon icon="lucide:check" className="h-4 w-4" />
              </div>
              <span className="text-lg font-medium text-slate-200">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full flex-col justify-center bg-background p-6 lg:w-[55%] lg:px-24 lg:py-12">
        <div className="mx-auto w-full max-w-[440px] space-y-10">

          {/* Mobile Logo - Centered */}
          <div className="flex justify-center lg:hidden mb-8">
            <NextLink href="/" className="flex items-center gap-2.5 text-2xl font-bold text-foreground transition-opacity hover:opacity-80">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon icon="lucide:file-text" className="h-5 w-5" />
              </div>
              TailorCV
            </NextLink>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Create account</h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Start building your resume for free.
            </p>
          </div>

          <Form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="firstName"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField className="w-full" isInvalid={!!fieldState.error}>
                    <Label className="text-base">First Name</Label>
                    <Input
                      {...field}
                      placeholder="John"
                    />
                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                  </TextField>
                )}
              />

              <Controller
                name="lastName"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField className="w-full" isInvalid={!!fieldState.error}>
                    <Label className="text-base">Last Name</Label>
                    <Input
                      {...field}
                      placeholder="Doe"
                    />
                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                  </TextField>
                )}
              />
            </div>

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
                  <Label className="text-base">Password</Label>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Min. 8 characters"
                  />
                  {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                </TextField>
              )}
            />

            <Controller
              name="terms"
              control={control}
              render={({ field: { value, onChange, ...field }, fieldState }) => (
                <div className="flex flex-col gap-1">
                  <Checkbox
                    className="flex items-start pt-1"
                    isSelected={value}
                    onChange={onChange}
                    isInvalid={!!fieldState.error}
                    {...field}
                  >
                    <Checkbox.Control className='size-5'>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Content>
                      <span className="text-sm text-muted-foreground leading-snug">
                        I agree to the <Link href="/terms" className="text-primary hover:text-primary/80 font-bold">Terms</Link> and <Link href="/privacy" className="text-primary hover:text-primary/80 font-bold">Privacy Policy</Link>
                      </span>
                    </Checkbox.Content>
                  </Checkbox>
                  {fieldState.error && <span className="text-tiny text-danger">{fieldState.error.message}</span>}
                </div>
              )}
            />


            {globalError && (
              <div className="flex items-center gap-2 rounded-lg bg-danger-50 px-4 py-3 text-sm font-medium text-danger">
                <Icon icon="lucide:alert-circle" className="h-4 w-4 shrink-0" />
                {globalError}
              </div>
            )}

            <Button type="submit" isPending={isSubmitting} className="w-full bg-primary font-semibold text-primary-foreground shadow-sm group hover:bg-primary/90">
              Create Account
              <Icon icon="lucide:arrow-right" className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-all" />
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
              onPress={handleGoogleSignUp}
            >
              <Icon icon="logos:google-icon" className="mr-3 h-5 w-5" />
              Continue with Google
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <NextLink href="/login" className="font-semibold text-primary hover:text-primary/80 hover:underline underline-offset-4">
                Log in
              </NextLink>
            </p>

          </Form>
        </div>
      </div>
    </div>
  );
}
