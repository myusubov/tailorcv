'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Button, TextField, Label, Input, FieldError } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { nanoid } from 'nanoid';

/**
 * Compact education editor for the review page accordion.
 * Displays education entries as cards with add/remove functionality.
 */
export function EducationEditor() {
  const { control } = useFormContext<BaseResumeData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'education',
  });

  /**
   * Adds a new empty education entry.
   */
  const handleAddEducation = () => {
    append({
      id: nanoid(),
      school: '',
      degree: null,
      field: null,
      location: null,
      startDate: null,
      endDate: null,
      grade: null,
      notes: null,
      isSelfTaught: false,
    });
  };

  return (
    <div className="space-y-4">
      {fields?.map((field, index) => (
        <EducationCard
          key={field.id}
          index={index}
          onRemove={() => remove(index)}
        />
      ))}

      {/* Add button */}
      <Button
        variant="ghost"
        onPress={handleAddEducation}
        className="border-default-300 w-full border border-dashed"
      >
        <Icon icon="lucide:plus" className="size-4" />
        Add Education
      </Button>

      {/* Empty state */}
      {(!fields || fields.length === 0) && (
        <p className="text-muted text-center text-sm">
          No education added yet. This is optional.
        </p>
      )}
    </div>
  );
}

interface EducationCardProps {
  index: number;
  onRemove: () => void;
}

/**
 * Individual education entry card.
 */
function EducationCard({ index, onRemove }: EducationCardProps) {
  const { control } = useFormContext<BaseResumeData>();
  const basePath = `education.${index}` as const;

  return (
    <div className="border-default-200 space-y-3 rounded-lg border p-4">
      {/* Header with remove button */}
      <div className="flex items-start justify-between gap-2">
        <Controller
          name={`${basePath}.school`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="flex-1" isInvalid={!!fieldState.error}>
              <Label>School / University *</Label>
              <Input {...field} placeholder="University name" />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />

        <Button
          variant="ghost"
          size="sm"
          onPress={onRemove}
          className="text-danger mt-6"
        >
          <Icon icon="lucide:trash-2" className="size-4" />
        </Button>
      </div>

      {/* Degree and Field */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name={`${basePath}.degree`}
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>Degree</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="Bachelor of Science"
              />
            </TextField>
          )}
        />

        <Controller
          name={`${basePath}.field`}
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>Field of Study</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="Computer Science"
              />
            </TextField>
          )}
        />
      </div>

      {/* Location */}
      <Controller
        name={`${basePath}.location`}
        control={control}
        render={({ field }) => (
          <TextField className="w-full">
            <Label>Location</Label>
            <Input
              {...field}
              value={field.value || ''}
              placeholder="City, Country"
            />
          </TextField>
        )}
      />

      {/* Dates */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name={`${basePath}.startDate`}
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>Start Date</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="YYYY-MM"
              />
            </TextField>
          )}
        />

        <Controller
          name={`${basePath}.endDate`}
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>End Date / Expected</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="YYYY-MM"
              />
            </TextField>
          )}
        />
      </div>

      {/* Grade */}
      <Controller
        name={`${basePath}.grade`}
        control={control}
        render={({ field }) => (
          <TextField className="w-full">
            <Label>Grade / GPA</Label>
            <Input
              {...field}
              value={field.value || ''}
              placeholder="3.8/4.0 or First Class Honours"
            />
          </TextField>
        )}
      />
    </div>
  );
}
