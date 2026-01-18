'use client';

import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button, useOverlayState } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { nanoid } from 'nanoid';
import { EducationCard } from './education-card';
import { DeleteEducationModal } from '@/app/components/education/delete-education-modal';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

/**
 * Compact education editor for the review page accordion.
 * Displays education entries as cards with add/remove functionality.
 */
export function EducationEditor() {
  const deleteModalState = useOverlayState();
  const { control, watch } = useFormContext<BaseResumeData>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'education',
  });

  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const education = watch('education');

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
      isCurrent: false,
    });
  };

  const handleMoveUp = (index: number) => {
    move(index, index - 1);
  };

  const handleMoveDown = (index: number) => {
    move(index, index + 1);
  };

  const handleDelete = () => {
    if (deleteIndex === null) return;
    const entry = education?.[deleteIndex];
    toast.info('Education was deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          if (entry) {
            append(entry);
          }
          setDeleteIndex(null);
        },
      },
    });
    remove(deleteIndex);
    setDeleteIndex(null);
  };

  const handleDeleteModalOpenChange = (isOpen: boolean) => {
    deleteModalState.setOpen(isOpen);
    if (!isOpen) setDeleteIndex(null);
  };

  // Build label for modal
  const school = deleteIndex !== null ? education?.[deleteIndex]?.school : '';
  const degree = deleteIndex !== null ? education?.[deleteIndex]?.degree : '';
  const labelParts = [school, degree].filter(Boolean);
  const label = labelParts.length > 0 ? labelParts.join(' - ') : '';

  return (
    <>
      <motion.div layout className="space-y-4">
        {fields?.map((field, index) => (
          <motion.div
            key={field.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <EducationCard
              index={index}
              onRemove={() => {
                setDeleteIndex(index);
                deleteModalState.open();
              }}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
            />
          </motion.div>
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
      </motion.div>

      <DeleteEducationModal
        isOpen={deleteModalState.isOpen}
        onOpenChange={handleDeleteModalOpenChange}
        educationNumber={deleteIndex !== null ? deleteIndex + 1 : null}
        label={label}
        onConfirm={handleDelete}
      />
    </>
  );
}
