import { Controller, type Control } from 'react-hook-form';
import { FieldError, Input, Label, TextField } from '@heroui/react';

import type { RegisterFormValues } from '@/lib/schemas/auth';

interface RegisterFieldsProps {
  control: Control<RegisterFormValues>;
}

/**
 * Renders the email and password fields bound to the registration form.
 *
 * @param props - React Hook Form control that owns the registration values.
 * @returns The three validated registration fields with staggered CSS targets.
 */
export function RegisterFields({ control }: RegisterFieldsProps) {
  return (
    <>
      <div className="auth-register-email-enter">
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
              {fieldState.error ? (
                <FieldError>{fieldState.error.message}</FieldError>
              ) : null}
            </TextField>
          )}
        />
      </div>

      <div className="auth-register-password-enter">
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
              {fieldState.error ? (
                <FieldError>{fieldState.error.message}</FieldError>
              ) : null}
            </TextField>
          )}
        />
      </div>

      <div className="auth-register-confirm-password-enter">
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              className="w-full"
              isRequired
              isInvalid={!!fieldState.error}
            >
              <Label className="text-base">Confirm password</Label>
              <Input
                {...field}
                aria-label="Confirm password"
                type="password"
                placeholder="Re-enter your password"
              />
              {fieldState.error ? (
                <FieldError>{fieldState.error.message}</FieldError>
              ) : null}
            </TextField>
          )}
        />
      </div>
    </>
  );
}
