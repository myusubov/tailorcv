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
              <TextField className="w-full" isRequired isInvalid={!!fieldState.error}>
                <Label className="text-base">First name</Label>
                <Input {...field} type="text" placeholder="John" />
                {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
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
              <TextField className="w-full" isRequired isInvalid={!!fieldState.error}>
                <Label className="text-base">Last name</Label>
                <Input {...field} type="text" placeholder="Doe" />
                {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
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
        transition={{ duration: 0.4, delay: 0.5 }}
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
    </>
  );
}
