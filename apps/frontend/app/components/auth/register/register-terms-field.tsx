import { motion } from 'framer-motion';
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
 */
export function RegisterTermsField({ control }: RegisterTermsFieldProps) {
  return (
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
              <Checkbox.Content>
                <Checkbox.Control className="size-5">
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <span className="text-muted-foreground text-sm leading-snug">
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
            {fieldState.error ? (
              <span className="text-tiny text-danger">
                {fieldState.error.message}
              </span>
            ) : null}
          </div>
        )}
      />
    </motion.div>
  );
}
