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

/**
 * Compact experience/work history editor for the review page accordion.
 * Displays experiences as expandable cards with add/remove functionality.
 */
export function ExperienceEditor() {
  const deleteModalState = useOverlayState();
  const { control, watch } = useFormContext<BaseResumeData>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'experiences',
  });

  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const experiences = watch('experiences');

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

  const handleMoveUp = (index: number) => {
    move(index, index - 1);
  };

  const handleMoveDown = (index: number) => {
    move(index, index + 1);
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

  // Build label for modal
  const company =
    deleteIndex !== null ? experiences?.[deleteIndex]?.company : '';
  const title = deleteIndex !== null ? experiences?.[deleteIndex]?.title : '';
  const labelParts = [title, company].filter(Boolean);
  const label = labelParts.length > 0 ? labelParts.join(' at ') : '';

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
              isFirst={index === 0}
              isLast={index === fields.length - 1}
            />
          </motion.div>
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
