import { useSignUp } from '@clerk/nextjs';
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
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';

import { AnimatedError } from '@/app/components/ui';
import { registerSchema, RegisterFormValues } from '@/lib/schemas/auth';
import { getClerkErrorMessage } from '@/lib/utils/utils';
import { config } from '@/lib/config';
import { RegistrationVerification } from '@/app/components/auth/registration-verification';
const RegisterForm = () => {
  const [globalError, setGlobalError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const { isLoaded, signUp, setActive } = useSignUp();
  const [verifying, setVerifying] = useState(false);

  const handleGoBack = () => {
    setVerifying(false);
    setValue('email', '');
  };

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
    reset,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      terms: false,
    },
    mode: 'onSubmit',
  });

  const email = useWatch({ control, name: 'email' });
  // Handle submission of the sign-up form
  const onSubmit = async (data: RegisterFormValues) => {
    if (!isLoaded || !signUp) return;
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
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Something went wrong');
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded || !signUp) return;
    try {
      setGoogleLoading(true);
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: config.auth.afterSignUpUrl,
      });
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Oauth failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    if (!isLoaded || !signUp) return;
    try {
      setAppleLoading(true);
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_apple',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: config.auth.afterSignUpUrl,
      });
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const clerkError = getClerkErrorMessage(err);
      setGlobalError(clerkError || 'Oauth failed');
    } finally {
      setAppleLoading(false);
    }
  };

  return verifying ? (
    <RegistrationVerification
      resetForm={reset}
      setActive={setActive}
      onGoBack={handleGoBack}
      isLoaded={isLoaded}
      signUp={signUp}
      email={email}
    />
  ) : (
    <Form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                isRequired
                isInvalid={!!fieldState.error}
              >
                <Label className="text-base">First name</Label>
                <Input {...field} type="text" placeholder="John" />
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
                isRequired
                isInvalid={!!fieldState.error}
              >
                <Label className="text-base">Last name</Label>
                <Input {...field} type="text" placeholder="Doe" />
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
            <TextField
              className="w-full"
              isRequired
              isInvalid={!!fieldState.error}
            >
              <Label className="text-base">Email</Label>
              <Input {...field} type="email" placeholder="john@example.com" />
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
            <TextField
              className="w-full"
              isRequired
              isInvalid={!!fieldState.error}
            >
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
          render={({ field: { value, onChange, ...field }, fieldState }) => (
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
                  <span className="text-muted text-sm leading-snug">
                    I agree to the{' '}
                    <Link
                      href="#"
                      className="text-primary hover:text-primary/80 font-bold"
                    >
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="#"
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

      <AnimatedError message={globalError} />

      <div id="clerk-captcha" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <Button
          type="submit"
          isDisabled={isSubmitting || googleLoading || appleLoading}
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
          <span className="bg-background text-muted px-4 font-medium">Or</span>
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
          isDisabled={googleLoading || isSubmitting || appleLoading}
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.9 }}
      >
        <Button
          type="button"
          variant="tertiary"
          isDisabled={appleLoading || isSubmitting || googleLoading}
          className="w-full font-medium"
          onPress={handleAppleSignUp}
        >
          {appleLoading ? (
            <>
              <Spinner color="current" size="sm" />
              Signing up with Apple...
            </>
          ) : (
            <>
              <Icon icon="logos:apple" className="size-5 fill-current" />
              Continue with Apple
            </>
          )}
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.0 }}
        className="text-muted text-center text-sm"
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
  );
};

export default RegisterForm;
