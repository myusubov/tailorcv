'use client';

import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button, useOverlayState } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { nanoid } from 'nanoid';
import { ExperienceCard } from './experience-card';
import { DeleteExperienceModal } from '@/app/components/experience/delete-experience-modal';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

/**
 * Compact experience/work history editor for the review page accordion.
 * Displays experiences as expandable cards with add/remove functionality.
 */
export function ExperienceEditor() {
  const deleteModalState = useOverlayState();
  const { control, getValues } = useFormContext<BaseResumeData>();
  const { fields, append, remove, move, insert } = useFieldArray({
    control,
    name: 'experiences',
  });

  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  // REMOVED: const experiences = watch('experiences'); - This caused re-renders on every keystroke

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

  /**
   * Duplicates an experience entry.
   */
  const handleDuplicate = (index: number) => {
    const allExperiences = getValues('experiences');
    const itemToDuplicate = allExperiences?.[index];
    if (!itemToDuplicate) return;

    const newItem = {
      ...itemToDuplicate,
      id: nanoid(),
      bullets:
        itemToDuplicate.bullets?.map((bullet) => ({
          ...bullet,
          id: nanoid(),
        })) || [],
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
    const allExperiences = getValues('experiences');
    const experience = allExperiences?.[deleteIndex];

    toast.info('Experience was deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          if (experience) {
            append(experience);
            setDeleteIndex(null);
          }
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
    const allExperiences = getValues('experiences');
    const exp = allExperiences?.[deleteIndex];
    if (!exp) return '';
    const parts = [exp.title, exp.company].filter(Boolean);
    return parts.length > 0 ? parts.join(' at ') : '';
  };

  const label = getDeleteLabel();

  return (
    <>
      <motion.div layout className="space-y-4">
        {fields.map((field, index) => (
          <motion.div
            key={field.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ExperienceCard
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
          onPress={handleAddExperience}
          className="border-default-300 text-muted-foreground hover:text-foreground w-full border border-dashed transition-colors"
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
      </motion.div>

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
