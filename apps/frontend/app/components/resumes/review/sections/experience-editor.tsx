'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import {
  Button,
  TextField,
  Label,
  Input,
  TextArea,
  Checkbox,
  FieldError,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { nanoid } from 'nanoid';

/**
 * Compact experience/work history editor for the review page accordion.
 * Displays experiences as expandable cards with add/remove functionality.
 */
export function ExperienceEditor() {
  const { control } = useFormContext<BaseResumeData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'experiences',
  });

  /**
   * Adds a new empty experience entry.
   */
  const handleAddExperience = () => {
    append({
      id: nanoid(),
      company: '',
      title: '',
      location: null,
      startDate: '',
      endDate: null,
      isCurrent: false,
      tech: null,
      bullets: [],
    });
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <ExperienceCard
          key={field.id}
          index={index}
          onRemove={() => remove(index)}
        />
      ))}

      {/* Add button */}
      <Button
        variant="ghost"
        onPress={handleAddExperience}
        className="border-default-300 w-full border border-dashed"
      >
        <Icon icon="lucide:plus" className="size-4" />
        Add Experience
      </Button>

      {/* Empty state */}
      {fields.length === 0 && (
        <p className="text-muted text-center text-sm">
          No work experience added yet.
        </p>
      )}
    </div>
  );
}

interface ExperienceCardProps {
  index: number;
  onRemove: () => void;
}

/**
 * Individual experience card with inline editing.
 */
function ExperienceCard({ index, onRemove }: ExperienceCardProps) {
  const { control, watch } = useFormContext<BaseResumeData>();
  const basePath = `experiences.${index}` as const;
  const isCurrent = watch(`${basePath}.isCurrent`);

  return (
    <div className="border-default-200 space-y-3 rounded-lg border p-4">
      {/* Header with remove button */}
      <div className="flex items-start justify-between gap-2">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <Controller
            name={`${basePath}.company`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField className="w-full" isInvalid={!!fieldState.error}>
                <Label>Company *</Label>
                <Input {...field} placeholder="Company name" />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </TextField>
            )}
          />

          <Controller
            name={`${basePath}.title`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField className="w-full" isInvalid={!!fieldState.error}>
                <Label>Title *</Label>
                <Input {...field} placeholder="Job title" />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </TextField>
            )}
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onPress={onRemove}
          className="text-danger"
        >
          <Icon icon="lucide:trash-2" className="size-4" />
        </Button>
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
      <div className="grid items-end gap-3 sm:grid-cols-3">
        <Controller
          name={`${basePath}.startDate`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Start Date *</Label>
              <Input {...field} placeholder="YYYY-MM" />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />

        <Controller
          name={`${basePath}.endDate`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>End Date</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder={isCurrent ? 'Present' : 'YYYY-MM'}
                disabled={!!isCurrent}
              />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />

        <Controller
          name={`${basePath}.isCurrent`}
          control={control}
          render={({ field }) => (
            <Checkbox
              isSelected={!!field.value}
              onChange={(isChecked) => field.onChange(isChecked)}
              className="pb-2"
            >
              <span className="text-sm">Current role</span>
            </Checkbox>
          )}
        />
      </div>

      {/* Bullets */}
      <BulletsEditor basePath={basePath} />
    </div>
  );
}

interface BulletsEditorProps {
  basePath: `experiences.${number}` | `projects.${number}`;
}

/**
 * Reusable bullets (achievements) editor for experiences and projects.
 */
export function BulletsEditor({ basePath }: BulletsEditorProps) {
  const { control } = useFormContext<BaseResumeData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${basePath}.bullets` as 'experiences.0.bullets',
  });

  const handleAddBullet = () => {
    append({ id: nanoid(), text: '' });
  };

  return (
    <div className="space-y-2">
      <Label className="text-muted text-xs">
        Achievements / Responsibilities
      </Label>

      {fields.map((field, bulletIndex) => (
        <div key={field.id} className="flex items-start gap-2">
          <span className="text-muted mt-2.5">•</span>
          <Controller
            name={
              `${basePath}.bullets.${bulletIndex}.text` as 'experiences.0.bullets.0.text'
            }
            control={control}
            render={({ field: inputField }) => (
              <TextArea
                {...inputField}
                placeholder="Describe an achievement or responsibility..."
                className="min-h-[60px] flex-1"
              />
            )}
          />
          <Button
            variant="ghost"
            size="sm"
            onPress={() => remove(bulletIndex)}
            className="text-danger mt-1"
          >
            <Icon icon="lucide:x" className="size-4" />
          </Button>
        </div>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onPress={handleAddBullet}
        className="text-sm"
      >
        <Icon icon="lucide:plus" className="size-3" />
        Add bullet point
      </Button>
    </div>
  );
}
