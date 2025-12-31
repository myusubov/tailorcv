'use client';

import { motion } from 'framer-motion';
import {
  Button,
  Card,
  Checkbox,
  Input,
  Label,
  TextField,
  FieldError,
  cn,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { StepHeader } from '../step-header';

interface EducationStepProps {
  onFinish: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const months = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 40 }, (_, i) => String(currentYear - i));

export function EducationStep({
  onFinish,
  onBack,
  isLoading,
}: EducationStepProps) {
  const { control } = useFormContext<OnboardingFormInput>();
  const isSelfTaught = !!useWatch({
    control,
    name: 'education.isSelfTaught',
  });

  return (
    <div className="mx-auto w-full max-w-xl">
      <StepHeader
        icon="lucide:graduation-cap"
        title="Education"
        description="Almost done! Tell us about your education."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <Card.Content className="space-y-5 pt-4">
            <Controller
              name="education.degree"
              control={control}
              render={({ field, fieldState }) => (
                <TextField className="w-full" isInvalid={!!fieldState.error}>
                  <Label>Degree / Certification</Label>
                  <Input
                    {...field}
                    placeholder="Bachelor's in Computer Science"
                    disabled={isSelfTaught}
                  />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </TextField>
              )}
            />

            <Controller
              name="education.school"
              control={control}
              render={({ field, fieldState }) => (
                <TextField className="w-full" isInvalid={!!fieldState.error}>
                  <Label>School / Institution *</Label>
                  <Input
                    {...field}
                    placeholder="University of Technology"
                    disabled={isSelfTaught}
                  />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </TextField>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-foreground mb-2 block text-sm font-medium">
                  Start Date
                </Label>
                <div className="flex gap-2">
                  <Controller
                    name="education.startMonth"
                    control={control}
                    render={({ field }) => (
                      <div className="flex-1">
                        <select
                          className="bg-surface-tertiary border-divider text-foreground w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={isSelfTaught}
                        >
                          <option value="">Month</option>
                          {months.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  />

                  <Controller
                    name="education.startYear"
                    control={control}
                    render={({ field }) => (
                      <div className="flex-1">
                        <select
                          className="bg-surface-tertiary border-divider text-foreground w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={isSelfTaught}
                        >
                          <option value="">Year</option>
                          {years.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  />
                </div>
              </div>

              <div>
                <Label className="text-foreground mb-2 block text-sm font-medium">
                  Graduation Date
                </Label>
                <div className="flex gap-2">
                  <Controller
                    name="education.endMonth"
                    control={control}
                    render={({ field }) => (
                      <div className="flex-1">
                        <select
                          className="bg-surface-tertiary border-divider text-foreground w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={isSelfTaught}
                        >
                          <option value="">Month</option>
                          {months.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  />

                  <Controller
                    name="education.endYear"
                    control={control}
                    render={({ field, fieldState }) => (
                      <div className="flex-1">
                        <select
                          className={cn(
                            'bg-surface-tertiary border-divider text-foreground w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-50',
                            fieldState.error &&
                              'border-danger focus:border-danger',
                          )}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={isSelfTaught}
                        >
                          <option value="">Year</option>
                          {years.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="border-divider relative border-t pt-4">
              <span className="bg-surface text-muted absolute -top-3 left-1/2 -translate-x-1/2 px-3 text-sm">
                Or
              </span>
            </div>

            <Controller
              name="education.isSelfTaught"
              control={control}
              render={({ field }) => (
                <Checkbox
                  isSelected={!!field.value}
                  onChange={(isSelected) => field.onChange(isSelected)}
                >
                  <Checkbox.Control className="size-5">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <span className="text-sm">
                      I&apos;m self-taught / bootcamp graduate
                    </span>
                  </Checkbox.Content>
                </Checkbox>
              )}
            />
          </Card.Content>
        </Card>
      </motion.div>

      <motion.div
        className="bg-surface mt-6 rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
            <Icon icon="lucide:check-circle" className="size-4" />
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">
              You&apos;re all set!
            </p>
            <p className="text-muted mt-0.5 text-sm">
              Click the button below to generate your professional resume.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="mt-8 flex items-center justify-between gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          variant="ghost"
          onPress={onBack}
          isDisabled={isLoading}
          className="text-muted hover:text-foreground"
        >
          <Icon icon="lucide:arrow-left" className="size-4" />
          Back
        </Button>
        <Button
          variant="primary"
          onPress={onFinish}
          isPending={isLoading}
          className="px-6"
        >
          {!isLoading && (
            <Icon icon="solar:magic-stick-3-bold-duotone" className="size-5" />
          )}
          {isLoading ? 'Generating...' : 'Generate Resume!'}
        </Button>
      </motion.div>
    </div>
  );
}
