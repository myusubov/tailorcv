'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { nanoid } from 'nanoid';
import { EducationCard } from './education-card';

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
