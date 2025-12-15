'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  TextField,
  Label,
  Input,
  TextArea,
  Description,
  Button,
  Checkbox,
  Card,
  FieldError,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import { StepHeader } from '../step-header';
import type { OnboardingFormInput } from '@/lib/schemas/onboarding';

interface ExperienceStepProps {
  onNext: () => void;
  onBack: () => void;
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
const years = Array.from({ length: 30 }, (_, i) => String(currentYear - i));

export function ExperienceStep({ onNext, onBack }: ExperienceStepProps) {
  const { control, watch } = useFormContext<OnboardingFormInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'experiences',
  });

  const experiences = watch('experiences');

  const addExperience = () => {
    append({
      id: crypto.randomUUID(),
      jobTitle: '',
      company: '',
      startMonth: '',
      startYear: '',
      endMonth: '',
      endYear: '',
      isCurrent: false,
      description: '',
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <StepHeader
        icon="lucide:briefcase"
        title="Work Experience"
        description="Add your professional work history."
      />

      <AnimatePresence mode="popLayout">
        {fields.map((field, index) => {
          const isCurrent = !!experiences?.[index]?.isCurrent;

          return (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              layout
            >
              <Card className="mb-4" variant="secondary">
                <Card.Header className="flex-row items-center justify-between">
                  <Card.Title className="text-base">Job #{index + 1}</Card.Title>
                  {fields.length > 1 && (
                    <Button
                      isIconOnly
                      variant="ghost"
                      size="sm"
                      onPress={() => remove(index)}
                      className="text-danger"
                    >
                      <Icon icon="lucide:trash-2" className="size-4" />
                    </Button>
                  )}
                </Card.Header>

                <Card.Content className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Controller
                      name={`experiences.${index}.jobTitle`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <TextField className="w-full" isInvalid={!!fieldState.error}>
                          <Label>Job Title *</Label>
                          <Input {...field} placeholder="Frontend Developer" />
                          {fieldState.error ? (
                            <FieldError>{fieldState.error.message}</FieldError>
                          ) : null}
                        </TextField>
                      )}
                    />

                    <Controller
                      name={`experiences.${index}.company`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <TextField className="w-full" isInvalid={!!fieldState.error}>
                          <Label>Company *</Label>
                          <Input {...field} placeholder="Acme Inc." />
                          {fieldState.error ? (
                            <FieldError>{fieldState.error.message}</FieldError>
                          ) : null}
                        </TextField>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-foreground mb-2 block text-sm font-medium">
                        Start Date *
                      </Label>
                      <div className="flex gap-2">
                        <Controller
                          name={`experiences.${index}.startMonth`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <div className="flex-1">
                              <select
                                className="bg-surface-tertiary border-divider text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                              >
                                <option value="">Month</option>
                                {months.map((m) => (
                                  <option key={m.value} value={m.value}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>
                              {fieldState.error ? (
                                <p className="text-danger mt-1 text-xs">
                                  {fieldState.error.message}
                                </p>
                              ) : null}
                            </div>
                          )}
                        />

                        <Controller
                          name={`experiences.${index}.startYear`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <div className="flex-1">
                              <select
                                className="bg-surface-tertiary border-divider text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                              >
                                <option value="">Year</option>
                                {years.map((y) => (
                                  <option key={y} value={y}>
                                    {y}
                                  </option>
                                ))}
                              </select>
                              {fieldState.error ? (
                                <p className="text-danger mt-1 text-xs">
                                  {fieldState.error.message}
                                </p>
                              ) : null}
                            </div>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-foreground mb-2 block text-sm font-medium">
                        End Date
                      </Label>
                      <div className="flex gap-2">
                        <Controller
                          name={`experiences.${index}.endMonth`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <div className="flex-1">
                              <select
                                className="bg-surface-tertiary border-divider text-foreground w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={isCurrent}
                              >
                                <option value="">Month</option>
                                {months.map((m) => (
                                  <option key={m.value} value={m.value}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>
                              {fieldState.error ? (
                                <p className="text-danger mt-1 text-xs">
                                  {fieldState.error.message}
                                </p>
                              ) : null}
                            </div>
                          )}
                        />

                        <Controller
                          name={`experiences.${index}.endYear`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <div className="flex-1">
                              <select
                                className="bg-surface-tertiary border-divider text-foreground w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={isCurrent}
                              >
                                <option value="">Year</option>
                                {years.map((y) => (
                                  <option key={y} value={y}>
                                    {y}
                                  </option>
                                ))}
                              </select>
                              {fieldState.error ? (
                                <p className="text-danger mt-1 text-xs">
                                  {fieldState.error.message}
                                </p>
                              ) : null}
                            </div>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <Controller
                    name={`experiences.${index}.isCurrent`}
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        isSelected={!!field.value}
                        onChange={(selected) => field.onChange(selected)}
                      >
                        <Checkbox.Control className="size-5">
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Content>
                          <span className="text-sm">I currently work here</span>
                        </Checkbox.Content>
                      </Checkbox>
                    )}
                  />

                  <Controller
                    name={`experiences.${index}.description`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField className="w-full" isInvalid={!!fieldState.error}>
                        <Label>What did you do? *</Label>
                        <TextArea
                          {...field}
                          placeholder="Led frontend development, built React dashboards, mentored junior devs..."
                          rows={3}
                        />
                        {fieldState.error ? (
                          <FieldError>{fieldState.error.message}</FieldError>
                        ) : null}
                        <Description>
                          Write 2-3 sentences. We&apos;ll expand this into
                          professional bullet points.
                        </Description>
                      </TextField>
                    )}
                  />
                </Card.Content>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <motion.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button variant="secondary" onPress={addExperience} className="w-full">
          <Icon icon="lucide:plus" className="mr-2 size-4" />
          Add {fields.length > 0 ? 'Another ' : ''}Job
        </Button>

        {fields.length === 0 && (
          <Button
            variant="ghost"
            onPress={onNext}
            className="text-muted w-full"
          >
            Skip - I don&apos;t have work experience yet
          </Button>
        )}
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
          className="text-muted hover:text-foreground"
        >
          <Icon icon="lucide:arrow-left" className="mr-2 size-4" />
          Back
        </Button>
        <Button onPress={onNext} className="group px-6">
          Next: Projects & Skills
          <Icon
            icon="lucide:arrow-right"
            className="ml-2 size-4 transition-transform group-hover:translate-x-1"
          />
        </Button>
      </motion.div>
    </div>
  );
}
