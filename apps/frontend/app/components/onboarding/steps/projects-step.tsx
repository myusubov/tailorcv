'use client';

import { useState, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, useOverlayState } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useFormContext, useWatch } from 'react-hook-form';
import { nanoid } from 'nanoid';

import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { StepHeader } from '../step-header';
import { ReorderableItem } from '@/app/components/ui/reorderable-item';
import { DeleteProjectModal } from '@/app/components/projects/delete-project-modal';
import { ProjectItemContent } from './project-item-content';
import { useStableFieldArray } from '@/lib/hooks/use-stable-field-array';
import { OnboardingItemSection } from './onboarding-item-section';
import { TechnicalSkillsSection } from './technical-skills-section';

interface ProjectsStepProps {
  onNext: () => void;
  onBack: () => void;
}

interface RemoveSkillArgs {
  skillId: string;
}

/**
 * Creates a new empty project item with default values.
 * @returns A new project object ready to be appended to the form
 */
function createEmptyProject() {
  return {
    id: nanoid(),
    name: '',
    role: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    url: '',
    repoUrl: '',
    tech: [],
    bullets: [{ id: nanoid(), text: '' }],
  };
}

/**
 * Projects & Skills step component for the onboarding wizard.
 * Allows users to add, edit, reorder, and remove project entries,
 * as well as manage their technical skills.
 */
export function ProjectsStep({ onNext, onBack }: ProjectsStepProps) {
  const deleteModalState = useOverlayState();
  const { control, watch, setValue, getValues } =
    useFormContext<OnboardingFormInput>();
  const { fields, append, remove, move } = useStableFieldArray<
    OnboardingFormInput,
    'projects'
  >({
    name: 'projects',
  });

  const projects = watch('projects');
  const skills =
    useWatch({
      control,
      name: 'skills',
    }) ?? [];
  const [skillInput, setSkillInput] = useState('');
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const addProject = () => {
    append(createEmptyProject());
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

  /**
   * Handles Enter key press in the skills input to add a new skill
   */
  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const nextSkill = skillInput.trim();
    if (!nextSkill) return;
    const currentSkills = getValues('skills') ?? [];
    if (!currentSkills.some((s) => s.name === nextSkill)) {
      setValue(
        'skills',
        [
          ...currentSkills,
          { id: nanoid(), name: nextSkill, category: null, level: null },
        ],
        { shouldDirty: true },
      );
    }
    setSkillInput('');
  };

  /**
   * Removes a skill by its ID
   */
  const removeSkill = ({ skillId }: RemoveSkillArgs) => {
    setValue(
      'skills',
      (getValues('skills') ?? []).filter((s) => s.id !== skillId),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const clearSkills = () => {
    setValue('skills', [], { shouldDirty: true, shouldValidate: true });
  };

  const handleMoveUp = (idx: number) => {
    move(idx, idx - 1);
  };

  const handleMoveDown = (idx: number) => {
    move(idx, idx + 1);
  };

  const handleDuplicate = (idx: number) => {
    const current = getValues('projects');
    const itemToDuplicate = current?.[idx];
    if (!itemToDuplicate) return;

    const newItem = {
      ...itemToDuplicate,
      id: nanoid(),
      bullets:
        itemToDuplicate.bullets?.map((b) => ({ ...b, id: nanoid() })) || [],
    };

    const newProjects = [
      ...(current || []).slice(0, idx + 1),
      newItem,
      ...(current || []).slice(idx + 1),
    ];

    setValue('projects', newProjects);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-2xl">
        <StepHeader
          icon="lucide:rocket"
          title="Projects & Skills"
          description="Showcase your best work and technical abilities."
        />

        <Card className="mb-6">
          <Card.Content className="space-y-2">
            <p className="text-foreground text-sm font-medium">
              For a stronger generated resume:
            </p>
            <ul className="text-muted list-disc space-y-1 pl-5 text-sm">
              <li>Add at least 3 technical skills</li>
              <li>
                Add 1 project with a clear role, technologies, and impact
                details
              </li>
            </ul>
          </Card.Content>
        </Card>

        {/* Projects Section */}
        <div className="mb-8">
          <OnboardingItemSection
            addLabel="Add Project"
            addMoreLabel="Add Another Project"
            count={fields.length}
            emptyDescription="Projects are optional, but strong projects can showcase applied skills, technical judgment, and measurable impact."
            onAdd={addProject}
            singularLabel="project"
            title="Projects"
          >
            {fields.map((project, index) => (
              <ReorderableItem
                key={project.id}
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
                <ProjectItemContent
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
        </div>

        {/* Skills Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-foreground mb-4 text-lg font-semibold">
            Technical Skills
          </h3>
          <TechnicalSkillsSection
            clearSkills={clearSkills}
            skillInput={skillInput}
            skills={skills}
            onSkillKeyDown={handleSkillKeyDown}
            removeSkill={removeSkill}
            setSkillInput={setSkillInput}
          />
        </motion.div>

        {/* Navigation */}
        <motion.div
          className="mt-8 flex items-center justify-between gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            className="text-muted hover:text-foreground"
            variant="ghost"
            onPress={onBack}
          >
            <Icon icon="lucide:arrow-left" className="size-4" />
            Back
          </Button>
          <Button onPress={onNext} className="group px-6">
            Next: Education
            <Icon
              icon="lucide:arrow-right"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </Button>
        </motion.div>
      </div>

      <DeleteProjectModal
        isOpen={deleteModalState.isOpen}
        onOpenChange={handleDeleteModalOpenChange}
        projectNumber={deleteIndex !== null ? deleteIndex + 1 : null}
        label={deleteIndex !== null ? projects?.[deleteIndex]?.name || '' : ''}
        onConfirm={handleDelete}
      />
    </>
  );
}
