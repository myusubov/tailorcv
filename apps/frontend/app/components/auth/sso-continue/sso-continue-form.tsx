import { Form, TextField, Label, Input, Button, FieldError, Spinner } from '@heroui/react';
import { Control, Controller } from 'react-hook-form';

import { AnimatedError } from '@/app/components/ui';
import { SSOContinueFormValues } from '@/lib/schemas/auth';

interface SSOContinueFormProps {
  control: Control<SSOContinueFormValues>;
  isSubmitting: boolean;
  globalError: string;
  onSubmit: () => void;
}

export function SSOContinueForm({
  control,
  isSubmitting,
  globalError,
  onSubmit,
}: SSOContinueFormProps) {
  return (
    <Form className="space-y-6" onSubmit={onSubmit}>
      <div>
        <h2 className="text-foreground text-3xl font-bold tracking-tight">
          Complete your profile
        </h2>
        <p className="text-muted mt-3 text-lg">
          We need a few more details to finish creating your account.
        </p>
      </div>

      <Controller
        name="firstName"
        control={control}
        render={({ field, fieldState }) => (
          <TextField className="w-full" isRequired isInvalid={!!fieldState.error}>
            <Label className="text-base">First name</Label>
            <Input {...field} type="text" placeholder="John" />
            {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
          </TextField>
        )}
      />

      <Controller
        name="lastName"
        control={control}
        render={({ field, fieldState }) => (
          <TextField className="w-full" isRequired isInvalid={!!fieldState.error}>
            <Label className="text-base">Last name</Label>
            <Input {...field} type="text" placeholder="Doe" />
            {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
          </TextField>
        )}
      />

      <AnimatedError message={globalError} />

      <Button type="submit" isDisabled={isSubmitting} className="w-full font-semibold">
        {isSubmitting ? (
          <>
            <Spinner color="current" size="sm" />
            Saving…
          </>
        ) : (
          'Continue'
        )}
      </Button>
    </Form>
  );
}
