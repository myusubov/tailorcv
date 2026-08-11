import { Checkbox, Link } from '@heroui/react';
import { Controller, type Control } from 'react-hook-form';

import type { RegisterFormValues } from '@/lib/schemas/auth';

interface RegisterTermsFieldProps {
  control: Control<RegisterFormValues>;
}

/**
 * Renders the registration terms agreement bound to the provided form control.
 * The checkbox owns the boolean `terms` value and exposes independently
 * reachable links for the terms and privacy policy.
 *
 * @param props - React Hook Form control that owns the terms value.
 * @returns The controlled terms agreement and its validation message.
 */
export function RegisterTermsField({ control }: RegisterTermsFieldProps) {
  return (
    <div className="auth-register-terms-enter">
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
              <Checkbox.Content>
                <Checkbox.Control className="size-5">
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <span className="text-muted text-sm leading-snug">
                  I agree to the{' '}
                  <Link
                    href="#"
                    className="text-accent hover:text-accent/80 font-bold"
                  >
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="#"
                    className="text-accent hover:text-accent/80 font-bold"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </Checkbox.Content>
            </Checkbox>
            {fieldState.error ? (
              <span className="text-tiny text-danger">
                {fieldState.error.message}
              </span>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}
