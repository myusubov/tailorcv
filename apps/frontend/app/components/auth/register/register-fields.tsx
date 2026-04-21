import { motion } from 'framer-motion';
import { Controller, type Control } from 'react-hook-form';
import { FieldError, Input, Label, TextField } from '@heroui/react';

import type { RegisterFormValues } from '@/lib/schemas/auth';

interface RegisterFieldsProps {
  control: Control<RegisterFormValues>;
}

export function RegisterFields({ control }: RegisterFieldsProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isRequired isInvalid={!!fieldState.error}>
              <Label className="text-base">Email</Label>
              <Input {...field} type="email" placeholder="john@example.com" />
              {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
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
            <TextField className="w-full" isRequired isInvalid={!!fieldState.error}>
              <Label className="text-base">Password</Label>
              <Input {...field} type="password" placeholder="Min. 8 characters" />
              {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
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
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isRequired isInvalid={!!fieldState.error}>
              <Label className="text-base">Confirm password</Label>
              <Input
                {...field}
                aria-label="Confirm password"
                type="password"
                placeholder="Re-enter your password"
              />
              {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
            </TextField>
          )}
        />
      </motion.div>
    </>
  );
}
