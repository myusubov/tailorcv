'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Button, Label, TextArea } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { nanoid } from 'nanoid';

/**
 * Props for the BulletsEditor component.
 */
interface BulletsEditorProps {
  /** The base path for the field array (e.g., 'experiences.0' or 'projects.1') */
  basePath: `experiences.${number}` | `projects.${number}`;
}

/**
 * Reusable bullets (achievements/responsibilities) editor for experiences and projects.
 * Displays a list of editable bullet points with add/remove functionality.
 */
export function BulletsEditor({ basePath }: BulletsEditorProps) {
  const { control } = useFormContext<BaseResumeData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${basePath}.bullets` as 'experiences.0.bullets',
  });

  /**
   * Adds a new empty bullet point.
   */
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
