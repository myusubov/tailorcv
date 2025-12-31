'use client';

import { useState } from 'react';
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
  useOverlayState,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { StepHeader } from '../step-header';
import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { generateUUID } from '@/lib/utils/utils';
import { DeleteExperienceModal } from '@/app/components/experience/delete-experience-modal';
import { ReorderableItem } from '@/app/components/ui/reorderable-item';

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
  const deleteModalState = useOverlayState();
  const { control, watch, setValue } = useFormContext<OnboardingFormInput>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'experiences',
  });

  const experiences = watch('experiences');
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const company =
    deleteIndex !== null ? experiences?.[deleteIndex]?.company : '';
  const title =
    deleteIndex !== null ? experiences?.[deleteIndex]?.title : '';
  const labelParts = [title, company].filter(Boolean);
  const label = labelParts.length > 0 ? labelParts.join(' at ') : '';

  const addExperience = () => {
    append({
      id: generateUUID(),
      title: '',
      company: '',
      startMonth: '',
      startYear: '',
      endMonth: '',
      endYear: '',
      isCurrent: false,
      description: '',
    });
  };

  const handleDelete = () => {
    if (deleteIndex === null) return;
    remove(deleteIndex);
    setDeleteIndex(null);
  };

  const handleDeleteModalOpenChange = (isOpen: boolean) => {
    deleteModalState.setOpen(isOpen);
    if (!isOpen) setDeleteIndex(null);
  };

  const handleNext = () => {
    if (fields.length === 0) {
      // Force clear to ensure no ghost data exists in form state
      // This fixes the issue where useFieldArray is empty but form state isn't
      setValue('experiences', []);
    }
    onNext();
  };

  const handleMoveUp = (idx: number) => {
    move(idx, idx - 1);
  };

  const handleMoveDown = (idx: number) => {
    move(idx, idx + 1);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-2xl">
        <StepHeader
          icon="lucide:briefcase"
          title="Work Experience"
          description="Add your professional work history."
        />

        <AnimatePresence mode="popLayout">
          {fields.map((field, index) => {
            return (
              <ReorderableItem
                key={field.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                layout
                isFirst={index === 0}
                isLast={index === fields.length - 1}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
              >
                <ExperienceItemContent
                  index={index}
                  isFirst={index === 0}
                  isLast={index === fields.length - 1}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  onDelete={() => {
                    setDeleteIndex(index);
                    deleteModalState.open();
                  }}
                />
              </ReorderableItem>
            );
          })}
        </AnimatePresence>

        {fields.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="mt-2">
              <Card.Content className="flex flex-col items-center justify-center px-6 py-8 text-center">
                <h3 className="text-foreground text-lg font-semibold">
                  No work experience yet?
                </h3>
                <p className="text-muted-foreground mt-2 max-w-md text-sm">
                  This step is optional. Add a job if you have one — or skip and
                  we&apos;ll still build a great resume from your projects and
                  skills.
                </p>

                <div className="mt-6 w-full max-w-sm">
                  <Button
                    variant="secondary"
                    onPress={addExperience}
                    className="w-full"
                  >
                    <Icon icon="lucide:plus" className="size-4" />
                    Add your first job
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              variant="secondary"
              onPress={addExperience}
              className="w-full"
            >
              <Icon icon="lucide:plus" className="size-4" />
              Add Another Job
            </Button>
          </motion.div>
        )}

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
            <Icon icon="lucide:arrow-left" className="size-4" />
            Back
          </Button>
          <Button onPress={handleNext} className="group px-6">
            {fields.length === 0
              ? 'Skip: Projects & Skills'
              : 'Next: Projects & Skills'}
            <Icon
              icon="lucide:arrow-right"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </Button>
        </motion.div>
      </div>

      <DeleteExperienceModal
        isOpen={deleteModalState.isOpen}
        onOpenChange={handleDeleteModalOpenChange}
        jobNumber={deleteIndex !== null ? deleteIndex + 1 : null}
        label={label}
        onConfirm={handleDelete}
      />
    </>
  );
}

interface ExperienceItemContentProps {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function ExperienceItemContent({
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
}: ExperienceItemContentProps) {
  const { control } = useFormContext<OnboardingFormInput>();
  const isCurrent = useWatch({
    control,
    name: `experiences.${index}.isCurrent`,
  });

  return (
    <Card className="mb-4 overflow-visible">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Job #{index + 1}</Card.Title>
        <div className="flex items-center gap-1">
          {/* Mobile Reorder Controls */}
          <div className="flex items-center gap-1 lg:hidden">
            <Button
              onPress={onMoveUp}
              isDisabled={isFirst}
              isIconOnly
              variant="ghost"
              size="sm"
            >
              <Icon icon="lucide:arrow-up" />
            </Button>
            <Button
              onPress={onMoveDown}
              isDisabled={isLast}
              isIconOnly
              variant="ghost"
              size="sm"
            >
              <Icon icon="lucide:arrow-down" />
            </Button>
          </div>

          <Button
            isIconOnly
            variant="danger-soft"
            size="sm"
            onPress={onDelete}
          >
            <Icon icon="lucide:trash-2" />
          </Button>
        </div>
      </Card.Header>

      <Card.Content className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name={`experiences.${index}.title`}
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
                      disabled={!!isCurrent}
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
                      disabled={!!isCurrent}
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
                Write 2-3 sentences. We&apos;ll expand this into professional
                bullet points.
              </Description>
            </TextField>
          )}
        />
      </Card.Content>
    </Card>
  );
}
