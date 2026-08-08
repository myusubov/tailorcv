'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useFormContext } from 'react-hook-form';
import { nanoid } from 'nanoid';

import { StepHeader } from '../step-header';
import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { ReorderableItem } from '@/app/components/ui/reorderable-item';
import { EducationItemContent } from './education-item-content';
import { useStableFieldArray } from '@/lib/hooks/use-stable-field-array';

interface EducationStepProps {
  onFinish: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

/**
 * Creates a new empty education item with default values.
 */
function createEmptyEducation() {
  return {
    id: nanoid(),
    school: '',
    degree: '',
    field: '',
    location: '',
    startDate: '',
    endDate: '',
    grade: '',
    notes: '',
    isCurrent: false,
  };
}

export function EducationStep({
  onFinish,
  onBack,
  isLoading,
}: EducationStepProps) {
  const { setValue, getValues } = useFormContext<OnboardingFormInput>();
  const { fields, append, remove, move } = useStableFieldArray<
    OnboardingFormInput,
    'education'
  >({
    name: 'education',
  });

  const addEducation = () => {
    append(createEmptyEducation());
  };

  const handleDelete = (index: number) => {
    remove(index);
  };

  const handleDuplicate = (idx: number) => {
    const current = getValues('education');
    const itemToDuplicate = current?.[idx];
    if (!itemToDuplicate) return;

    const newItem = {
      ...itemToDuplicate,
      id: nanoid(),
    };

    const newEducation = [
      ...(current || []).slice(0, idx + 1),
      newItem,
      ...(current || []).slice(idx + 1),
    ];

    setValue('education', newEducation);
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
          icon="lucide:graduation-cap"
          title="Education"
          description="Tell us about your educational background and certifications."
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
              <EducationItemContent
                index={index}
                isFirst={index === 0}
                isLast={index === fields.length - 1}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                onDelete={() => handleDelete(index)}
                onDuplicate={() => handleDuplicate(index)}
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
              <Card.Content className="flex flex-col items-center justify-center px-5 py-5 text-center">
                <p className="text-muted text-sm text-balance">
                  Education is optional. Add schools, bootcamps, or
                  certifications if they strengthen your resume.
                </p>

                <div className="mt-4 w-full max-w-sm">
                  <Button
                    variant="secondary"
                    onPress={addEducation}
                    className="w-full"
                  >
                    <Icon icon="lucide:plus" className="size-4" />
                    Add Education
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
              onPress={addEducation}
              className="w-full"
            >
              <Icon icon="lucide:plus" className="size-4" />
              Add Another Education
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
            isDisabled={isLoading}
            className="text-muted hover:text-foreground"
          >
            <Icon icon="lucide:arrow-left" className="size-4" />
            Back
          </Button>
          <Button
            variant="primary"
            onPress={onFinish}
            isPending={isLoading}
            className="px-6"
          >
            {!isLoading && (
              <Icon
                icon="solar:magic-stick-3-bold-duotone"
                className="size-5"
              />
            )}
            {isLoading ? 'Generating...' : 'Generate Resume!'}
          </Button>
        </motion.div>
      </div>
    </>
  );
}
