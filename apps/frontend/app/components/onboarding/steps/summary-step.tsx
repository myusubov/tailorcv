'use client';

import { motion } from 'framer-motion';
import {
  TextField,
  Label,
  TextArea,
  Description,
  Button,
  FieldError,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { StepHeader } from '../step-header';
import { Controller, useFormContext } from 'react-hook-form';
import type { OnboardingFormInput } from '@/lib/schemas/onboarding';

interface SummaryStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function SummaryStep({ onNext, onBack }: SummaryStepProps) {
  const { control } = useFormContext<OnboardingFormInput>();

  return (
    <div className="mx-auto w-full max-w-xl">
      <StepHeader
        icon="lucide:file-text"
        title="Professional Summary"
        description="Write 2-3 sentences about what you do, what you are strong at, and where you create impact."
      />

      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Controller
          name="summary"
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Professional Summary</Label>
              <TextArea
                {...field}
                value={field.value || ''}
                placeholder="I'm a full-stack developer with 3 years of experience building scalable web applications…"
                rows={7}
              />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
              <Description className="text-balance">
                Include role, seniority, technologies, and one measurable
                strength. You can leave this blank. TailorCV can generate a
                draft later.
              </Description>
            </TextField>
          )}
        />
      </motion.div>

      <motion.div
        className="mt-8 flex items-center justify-between gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          variant="ghost"
          onPress={onBack}
          className="text-muted hover:text-foreground"
        >
          <Icon icon="lucide:arrow-left" className="size-4" aria-hidden />
          Back
        </Button>
        <Button onPress={onNext} className="group px-6">
          Next: Experience
          <Icon
            icon="lucide:arrow-right"
            className="size-4 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </Button>
      </motion.div>
    </div>
  );
}
