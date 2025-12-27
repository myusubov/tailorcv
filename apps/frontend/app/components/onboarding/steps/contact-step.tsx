'use client';

import { motion } from 'framer-motion';
import {
  TextField,
  Label,
  Input,
  Description,
  Button,
  FieldError,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { StepHeader } from '../step-header';
import { Controller, useFormContext } from 'react-hook-form';
import type { OnboardingFormInput } from '@/lib/schemas/onboarding';

interface ContactStepProps {
  onNext: () => void;
  onBack: () => void;
}

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.1 + i * 0.05, duration: 0.3 },
  }),
};

export function ContactStep({ onNext, onBack }: ContactStepProps) {
  const { control } = useFormContext<OnboardingFormInput>();

  return (
    <div className="mx-auto w-full max-w-xl">
      <StepHeader
        icon="lucide:user"
        title="Contact Information"
        description="Let's start with the basics."
      />

      <motion.div
        className="space-y-5"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div custom={0} variants={fieldVariants}>
            <Controller
              name="contact.firstName"
              control={control}
              render={({ field, fieldState }) => (
                <TextField className="w-full" isInvalid={!!fieldState.error}>
                  <Label>First Name *</Label>
                  <Input {...field} placeholder="John" />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </TextField>
              )}
            />
          </motion.div>

          <motion.div custom={1} variants={fieldVariants}>
            <Controller
              name="contact.lastName"
              control={control}
              render={({ field, fieldState }) => (
                <TextField className="w-full" isInvalid={!!fieldState.error}>
                  <Label>Last Name *</Label>
                  <Input {...field} placeholder="Doe" />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </TextField>
              )}
            />
          </motion.div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div custom={2} variants={fieldVariants}>
            <Controller
              name="contact.email"
              control={control}
              render={({ field, fieldState }) => (
                <TextField className="w-full" isInvalid={!!fieldState.error}>
                  <Label>Email Address *</Label>
                  <Input
                    {...field}
                    type="email"
                    placeholder="john@example.com"
                  />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </TextField>
              )}
            />
          </motion.div>

          <motion.div custom={3} variants={fieldVariants}>
            <Controller
              name="contact.phone"
              control={control}
              render={({ field }) => (
                <TextField className="w-full">
                  <Label>Phone Number</Label>
                  <Input {...field} placeholder="+1 (555) 123-4567" />
                  <Description>Optional</Description>
                </TextField>
              )}
            />
          </motion.div>
        </div>

        <motion.div custom={4} variants={fieldVariants}>
          <Controller
            name="contact.location"
            control={control}
            render={({ field, fieldState }) => (
              <TextField className="w-full" isInvalid={!!fieldState.error}>
                <Label>Location *</Label>
                <Input {...field} placeholder="San Francisco, CA" />
                {fieldState.error ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </TextField>
            )}
          />
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div custom={5} variants={fieldVariants}>
            <Controller
              name="contact.githubUrl"
              control={control}
              render={({ field }) => (
                <TextField className="w-full">
                  <Label>GitHub URL</Label>
                  <Input {...field} placeholder="github.com/username" />
                </TextField>
              )}
            />
          </motion.div>

          <motion.div custom={6} variants={fieldVariants}>
            <Controller
              name="contact.linkedinUrl"
              control={control}
              render={({ field }) => (
                <TextField className="w-full">
                  <Label>LinkedIn URL</Label>
                  <Input {...field} placeholder="linkedin.com/in/username" />
                </TextField>
              )}
            />
          </motion.div>
        </div>

        <motion.div custom={7} variants={fieldVariants}>
          <Controller
            name="contact.websiteUrl"
            control={control}
            render={({ field }) => (
              <TextField className="w-full">
                <Label>Portfolio / Website</Label>
                <Input {...field} placeholder="yourwebsite.com" />
                <Description>Optional</Description>
              </TextField>
            )}
          />
        </motion.div>
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
          Next: Professional Summary
          <Icon
            icon="lucide:arrow-right"
            className="size-4 transition-transform group-hover:translate-x-1"
          />
        </Button>
      </motion.div>
    </div>
  );
}
