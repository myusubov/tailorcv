'use client';

import { motion } from 'framer-motion';
import {
  Button,
  Card,
  Input,
  Label,
  TextField,
  FieldError,
  DateField,
  DateInputGroup,
  Checkbox,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { Icon } from '@iconify/react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { nanoid } from 'nanoid';
import { useEffect } from 'react';

import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { StepHeader } from '../step-header';

interface EducationStepProps {
  onFinish: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function EducationStep({
  onFinish,
  onBack,
  isLoading,
}: EducationStepProps) {
  const { control, setValue, getValues } =
    useFormContext<OnboardingFormInput>();

  // Initialize education array with one entry if empty
  useEffect(() => {
    const edu = getValues('education');
    if (!edu || edu.length === 0) {
      setValue('education', [
        {
          id: nanoid(),
          school: '',
          degree: null,
          field: null,
          location: null,
          startDate: null,
          endDate: null,
          grade: null,
          notes: null,
          isCurrent: null,
        },
      ]);
    }
  }, [getValues, setValue]);

  const isCurrent = useWatch({ control, name: 'education.0.isCurrent' });

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
              name="education.0.degree"
              control={control}
              render={({ field, fieldState }) => (
                <TextField className="w-full" isInvalid={!!fieldState.error}>
                  <Label>Degree / Certification</Label>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="Bachelor's in Computer Science"
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </TextField>
              )}
            />

            <Controller
              name="education.0.school"
              control={control}
              render={({ field, fieldState }) => (
                <TextField className="w-full" isInvalid={!!fieldState.error}>
                  <Label>School / Institution *</Label>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="University of Technology"
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </TextField>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="education.0.startDate"
                control={control}
                render={({ field, fieldState }) => (
                  <DateField
                    className="w-full"
                    isInvalid={!!fieldState.error}
                    value={field.value ? parseDate(`${field.value}-01`) : null}
                    onChange={(date) =>
                      field.onChange(date ? date.toString().slice(0, 7) : null)
                    }
                  >
                    <Label>Start Date</Label>
                    <DateInputGroup>
                      <DateInputGroup.Input>
                        {(segment) => (
                          <DateInputGroup.Segment segment={segment} />
                        )}
                      </DateInputGroup.Input>
                    </DateInputGroup>
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </DateField>
                )}
              />

              <Controller
                name="education.0.endDate"
                control={control}
                render={({ field, fieldState }) => (
                  <DateField
                    className="w-full"
                    isInvalid={!!fieldState.error}
                    isDisabled={!!isCurrent}
                    value={field.value ? parseDate(`${field.value}-01`) : null}
                    onChange={(date) =>
                      field.onChange(date ? date.toString().slice(0, 7) : null)
                    }
                  >
                    <Label>Graduation Date</Label>
                    <DateInputGroup>
                      <DateInputGroup.Input>
                        {(segment) => (
                          <DateInputGroup.Segment segment={segment} />
                        )}
                      </DateInputGroup.Input>
                    </DateInputGroup>
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </DateField>
                )}
              />
            </div>

            <Controller
              name="education.0.isCurrent"
              control={control}
              render={({ field }) => (
                <Checkbox
                  isSelected={!!field.value}
                  onChange={(isChecked) => {
                    field.onChange(isChecked);
                    if (isChecked) {
                      setValue('education.0.endDate', null);
                    }
                  }}
                >
                  <Checkbox.Control className="size-5">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <span className="text-sm">I am currently studying here</span>
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
