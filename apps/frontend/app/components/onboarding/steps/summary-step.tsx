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
        description="Tell us about yourself in 2-3 sentences. What do you do? What are your key skills?"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Controller
          name="summary"
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Your Summary</Label>
              <TextArea
                {...field}
                value={field.value || ''}
                placeholder="I'm a full-stack developer with 3 years of experience building scalable web applications..."
                rows={6}
              />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
              <Description>
                Mention your role, experience level, and main technologies.
                We&apos;ll refine this later.
              </Description>
            </TextField>
          )}
        />
      </motion.div>

      <motion.div
        className="bg-surface mt-6 rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Icon icon="lucide:lightbulb" className="size-4" />
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">Need help?</p>
            <p className="text-muted mt-0.5 text-sm">
              Not sure what to write? You can skip this and we&apos;ll generate
              one based on your experience and projects.
            </p>
          </div>
        </div>
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
          <Icon icon="lucide:arrow-left" className="size-4" />
          Back
        </Button>
        <Button onPress={onNext} className="group px-6">
          Next: Experience
          <Icon
            icon="lucide:arrow-right"
            className="size-4 transition-transform group-hover:translate-x-1"
          />
        </Button>
      </motion.div>
    </div>
  );
}
