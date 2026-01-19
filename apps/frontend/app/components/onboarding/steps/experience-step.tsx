'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, useOverlayState } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useFormContext } from 'react-hook-form';
import { nanoid } from 'nanoid';

import { StepHeader } from '../step-header';
import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { DeleteExperienceModal } from '@/app/components/experience/delete-experience-modal';
import { ReorderableItem } from '@/app/components/ui/reorderable-item';
import { ExperienceItemContent } from './experience-item-content';
import { useStableFieldArray } from '@/lib/hooks/use-stable-field-array';

interface ExperienceStepProps {
  onNext: () => void;
  onBack: () => void;
}

/**
 * Creates a new empty experience item with default values.
 * @returns A new experience object ready to be appended to the form
 */
function createEmptyExperience() {
  return {
    id: nanoid(),
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    tech: [],
    bullets: [{ id: nanoid(), text: '' }],
  };
}

/**
 * Experience step component for the onboarding wizard.
 * Allows users to add, edit, reorder, and remove work experience entries.
 */
export function ExperienceStep({ onNext, onBack }: ExperienceStepProps) {
  const deleteModalState = useOverlayState();
  const { watch, setValue } = useFormContext<OnboardingFormInput>();
  const { fields, append, remove, move } = useStableFieldArray<
    OnboardingFormInput,
    'experiences'
  >({
    name: 'experiences',
  });

  const experiences = watch('experiences');
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // Derive delete modal label from the item being deleted
  const company =
    deleteIndex !== null ? experiences?.[deleteIndex]?.company : '';
  const title = deleteIndex !== null ? experiences?.[deleteIndex]?.title : '';
  const labelParts = [title, company].filter(Boolean);
  const label = labelParts.length > 0 ? labelParts.join(' at ') : '';

  const addExperience = () => {
    append(createEmptyExperience());
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

  const handleNext = () => {
    if (fields.length === 0) {
      setValue('experiences', []);
    }
    onNext();
  };

  const handleMoveUp = (idx: number) => {
    move(idx, idx - 1);
  };

  const handleMoveDown = (idx: number) => {
    move(idx, idx + 1);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-2xl">
        <StepHeader
          icon="lucide:briefcase"
          title="Work Experience"
          description="Add your professional work history."
        />

        <AnimatePresence mode="popLayout">
          {fields.map((field, index) => (
            <ReorderableItem
              key={field.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              layout
              isFirst={index === 0}
              isLast={index === fields.length - 1}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
            >
              <ExperienceItemContent
                index={index}
                isFirst={index === 0}
                isLast={index === fields.length - 1}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                onDelete={() => {
                  setDeleteIndex(index);
                  deleteModalState.open();
                }}
              />
            </ReorderableItem>
          ))}
        </AnimatePresence>

        {fields.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="mt-2">
              <Card.Content className="flex flex-col items-center justify-center px-6 py-8 text-center">
                <h3 className="text-foreground text-lg font-semibold">
                  No work experience yet?
                </h3>
                <p className="text-muted-foreground mt-2 max-w-md text-sm">
                  This step is optional. Add a job if you have one — or skip and
                  we&apos;ll still build a great resume from your projects and
                  skills.
                </p>

                <div className="mt-6 w-full max-w-sm">
                  <Button
                    variant="secondary"
                    onPress={addExperience}
                    className="w-full"
                  >
                    <Icon icon="lucide:plus" className="size-4" />
                    Add your first job
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              variant="secondary"
              onPress={addExperience}
              className="w-full"
            >
              <Icon icon="lucide:plus" className="size-4" />
              Add Another Job
            </Button>
          </motion.div>
        )}

        <motion.div
          className="mt-8 flex items-center justify-between gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            onPress={onBack}
            className="text-muted hover:text-foreground"
          >
            <Icon icon="lucide:arrow-left" className="size-4" />
            Back
          </Button>
          <Button onPress={handleNext} className="group px-6">
            {fields.length === 0
              ? 'Skip: Projects & Skills'
              : 'Next: Projects & Skills'}
            <Icon
              icon="lucide:arrow-right"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </Button>
        </motion.div>
      </div>

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
