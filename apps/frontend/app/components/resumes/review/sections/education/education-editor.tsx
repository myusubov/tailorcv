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
  const { control, getValues } = useFormContext<BaseResumeData>();
  const { fields, append, remove, move, insert } = useFieldArray({
    control,
    name: 'education',
  });

  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  // REMOVED: const education = watch('education'); - Prevents re-renders on keystrokes

  /**
   * Adds a new empty education entry.
   */
  const handleAddEducation = () => {
    append({
      id: nanoid(),
      school: '',
      degree: '',
      field: '',
      location: '',
      startDate: null,
      endDate: null,
      grade: '',
      notes: null,
      isCurrent: false,
    });
  };

  /**
   * Duplicates an education entry.
   */
  const handleDuplicate = (index: number) => {
    const allEducation = getValues('education');
    const itemToDuplicate = allEducation?.[index];
    if (!itemToDuplicate) return;

    const newItem = {
      ...itemToDuplicate,
      id: nanoid(),
    };

    insert(index + 1, newItem);
  };

  const handleMoveUp = (index: number) => {
    move(index, index - 1);
  };

  const handleMoveDown = (index: number) => {
    move(index, index + 1);
  };

  const handleDelete = () => {
    if (deleteIndex === null) return;
    // undo action
    const allEducation = getValues('education');
    const entry = allEducation?.[deleteIndex];
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
  // Build label for modal - fetch fresh values when modal opens
  const getDeleteLabel = () => {
    if (deleteIndex === null) return '';
    const allEducation = getValues('education');
    const entry = allEducation?.[deleteIndex];
    if (!entry) return '';
    const parts = [entry.school, entry.degree].filter(Boolean);
    return parts.length > 0 ? parts.join(' - ') : '';
  };

  const label = getDeleteLabel();

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
              onDuplicate={() => handleDuplicate(index)}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
            />
          </motion.div>
        ))}

        {/* Add button */}
        <Button
          variant="ghost"
          onPress={handleAddEducation}
          className="border-default-300 text-muted-foreground hover:text-foreground w-full border border-dashed transition-colors"
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
