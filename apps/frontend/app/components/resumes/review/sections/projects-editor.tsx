'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import {
  Button,
  TextField,
  Label,
  Input,
  Checkbox,
  FieldError,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { nanoid } from 'nanoid';
import { BulletsEditor } from './experience-editor';

/**
 * Compact projects editor for the review page accordion.
 * Displays projects as expandable cards with add/remove functionality.
 */
export function ProjectsEditor() {
  const { control } = useFormContext<BaseResumeData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'projects',
  });

  /**
   * Adds a new empty project entry.
   */
  const handleAddProject = () => {
    append({
      id: nanoid(),
      name: '',
      role: null,
      startDate: null,
      endDate: null,
      isCurrent: false,
      url: null,
      repoUrl: null,
      tech: null,
      bullets: [],
    });
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <ProjectCard
          key={field.id}
          index={index}
          onRemove={() => remove(index)}
        />
      ))}

      {/* Add button */}
      <Button
        variant="ghost"
        onPress={handleAddProject}
        className="border-default-300 w-full border border-dashed"
      >
        <Icon icon="lucide:plus" className="size-4" />
        Add Project
      </Button>

      {/* Empty state */}
      {fields.length === 0 && (
        <p className="text-muted text-center text-sm">No projects added yet.</p>
      )}
    </div>
  );
}

interface ProjectCardProps {
  index: number;
  onRemove: () => void;
}

/**
 * Individual project card with inline editing.
 */
function ProjectCard({ index, onRemove }: ProjectCardProps) {
  const { control, watch } = useFormContext<BaseResumeData>();
  const basePath = `projects.${index}` as const;
  const isCurrent = watch(`${basePath}.isCurrent`);

  return (
    <div className="border-default-200 space-y-3 rounded-lg border p-4">
      {/* Header with remove button */}
      <div className="flex items-start justify-between gap-2">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <Controller
            name={`${basePath}.name`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField className="w-full" isInvalid={!!fieldState.error}>
                <Label>Project Name *</Label>
                <Input {...field} placeholder="Project name" />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </TextField>
            )}
          />

          <Controller
            name={`${basePath}.role`}
            control={control}
            render={({ field }) => (
              <TextField className="w-full">
                <Label>Your Role</Label>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="Lead Developer"
                />
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

      {/* URLs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name={`${basePath}.url`}
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>Live URL</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="https://..."
              />
            </TextField>
          )}
        />

        <Controller
          name={`${basePath}.repoUrl`}
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>Repository URL</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="github.com/..."
              />
            </TextField>
          )}
        />
      </div>

      {/* Dates */}
      <div className="grid items-end gap-3 sm:grid-cols-3">
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
              <Label>End Date</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder={isCurrent ? 'Present' : 'YYYY-MM'}
                disabled={!!isCurrent}
              />
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
              <span className="text-sm">Active project</span>
            </Checkbox>
          )}
        />
      </div>

      {/* Bullets */}
      <BulletsEditor basePath={basePath} />
    </div>
  );
}
