'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, useOverlayState } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useFormContext } from 'react-hook-form';
import { nanoid } from 'nanoid';

import { StepHeader } from '../step-header';
import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { DeleteExperienceModal } from '@/app/components/experience/delete-experience-modal';
import { ReorderableItem } from '@/app/components/ui/reorderable-item';
import { ExperienceItemContent } from './experience-item-content';
import { useStableFieldArray } from '@/lib/hooks/use-stable-field-array';
import { OnboardingItemSection } from './onboarding-item-section';

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
  const { watch, setValue, getValues } = useFormContext<OnboardingFormInput>();
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

  const handleDuplicate = (idx: number) => {
    const current = getValues('experiences');
    const itemToDuplicate = current?.[idx];
    if (!itemToDuplicate) return;

    const newItem = {
      ...itemToDuplicate,
      id: nanoid(),
      bullets:
        itemToDuplicate.bullets?.map((b) => ({ ...b, id: nanoid() })) || [],
    };

    const newExperiences = [
      ...(current || []).slice(0, idx + 1),
      newItem,
      ...(current || []).slice(idx + 1),
    ];

    setValue('experiences', newExperiences);
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

        <OnboardingItemSection
          addLabel="Add Experience"
          addMoreLabel="Add Another Experience"
          count={fields.length}
          emptyDescription="Experience is optional. Add work history if it strengthens your resume, or continue with projects and skills."
          onAdd={addExperience}
          singularLabel="experience"
          title="Experience"
        >
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
                onDuplicate={() => handleDuplicate(index)}
              />
            </ReorderableItem>
          ))}
        </OnboardingItemSection>

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
