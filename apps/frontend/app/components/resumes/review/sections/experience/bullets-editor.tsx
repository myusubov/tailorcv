'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Button, Label, TextArea, Tooltip } from '@heroui/react';
import { Reorder } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { BulletItem } from './bullet-item';

/**
 * Props for the BulletsEditor component.
 */
interface BulletsEditorProps {
  /** The base path for the field array (e.g., 'experiences.0' or 'projects.1') */
  basePath: `experiences.${number}` | `projects.${number}`;
}

/**
 * Reusable bullets (achievements/responsibilities) editor for experiences and projects.
 * Displays a list of editable bullet points with add/remove and reorder functionality.
 */
export function BulletsEditor({ basePath }: BulletsEditorProps) {
  const { control } = useFormContext<BaseResumeData>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `${basePath}.bullets` as 'experiences.0.bullets',
  });

  const handleRemove = (index: number) => {
    const field = fields[index];
    // allow undo
    toast.info('Removed bullet point', {
      action: {
        label: 'Undo',
        onClick: () => {
          append(field);
        },
      },
    });
    remove(index);
  };

  /**
   * Adds a new empty bullet point.
   */
  const handleAddBullet = () => {
    append({ id: nanoid(), text: '' });
  };

  /**
   * Handles reordering of bullets.
   * Compares the new order with the old order to find the moved item and persist the change.
   */
  const handleReorder = (newItems: typeof fields) => {
    for (let i = 0; i < newItems.length; i++) {
      if (newItems[i].id !== fields[i]?.id) {
        const movedItem = newItems[i];
        const oldIndex = fields.findIndex((f) => f.id === movedItem.id);
        if (oldIndex !== -1) {
          move(oldIndex, i);
          return;
        }
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-muted text-xs">
        Achievements / Responsibilities
      </Label>

      <Reorder.Group
        axis="y"
        values={fields}
        onReorder={handleReorder}
        className="space-y-2"
      >
        {fields.map((field, bulletIndex) => (
          <BulletItem
            key={field.id}
            field={field}
            basePath={basePath}
            bulletIndex={bulletIndex}
            onRemove={() => handleRemove(bulletIndex)}
          />
        ))}
      </Reorder.Group>

      <Button
        variant="ghost"
        size="sm"
        onPress={handleAddBullet}
        className="text-muted hover:text-foreground text-sm transition-colors"
      >
        <Icon icon="lucide:plus" className="size-4" />
        Add bullet point
      </Button>
    </div>
  );
}
