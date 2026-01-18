'use client';

import { useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Button,
  Card,
  Chip,
  Checkbox,
  Description,
  FieldError,
  Input,
  Label,
  TextArea,
  TextField,
  useOverlayState,
  DateField,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';
import { nanoid } from 'nanoid';
import { parseDate } from '@internationalized/date';

import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { StepHeader } from '../step-header';
import { ReorderableItem } from '@/app/components/ui/reorderable-item';
import { DeleteProjectModal } from '@/app/components/projects/delete-project-modal';

interface ProjectsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ProjectsStep({ onNext, onBack }: ProjectsStepProps) {
  const deleteModalState = useOverlayState();
  const { control, watch, setValue, getValues } =
    useFormContext<OnboardingFormInput>();
  const { errors } = useFormState({ control });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'projects',
  });

  const projects = watch('projects');
  const skills = watch('skills') ?? [];
  const [skillInput, setSkillInput] = useState('');
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const addProject = () => {
    append({
      id: nanoid(),
      name: '',
      role: null,
      startDate: null,
      endDate: null,
      isCurrent: false,
      url: null,
      repoUrl: null,
      tech: null,
      bullets: [{ id: nanoid(), text: '' }],
    });
  };

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

  const removeSkill = (skillId: string) => {
    setValue(
      'skills',
      (getValues('skills') ?? []).filter((s) => s.id !== skillId),
      { shouldDirty: true },
    );
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
              Before we generate your resume:
            </p>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              <li>Add at least 3 skills</li>
              <li>Add at least 1 project or 1 experience with some details</li>
            </ul>
          </Card.Content>
        </Card>

        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
            <Icon icon="lucide:folder-code" className="size-5" />
            Projects
          </h3>
          <AnimatePresence mode="popLayout">
            {fields.map((project, index) => (
              <ReorderableItem
                key={project.id}
                isFirst={index === 0}
                isLast={index === fields.length - 1}
                onMoveUp={() => move(index, index - 1)}
                onMoveDown={() => move(index, index + 1)}
              >
                <ProjectCard
                  index={index}
                  onDelete={() => {
                    setDeleteIndex(index);
                    deleteModalState.open();
                  }}
                />
              </ReorderableItem>
            ))}
          </AnimatePresence>
          <Button variant="secondary" onPress={addProject} className="w-full">
            <Icon icon="lucide:plus" className="size-4" />
            Add {fields.length > 0 ? 'Another ' : ''}Project
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
            <Icon icon="lucide:wrench" className="size-5" />
            Technical Skills
          </h3>
          <Card>
            <Card.Content className="space-y-4">
              <TextField className="w-full">
                <Label>Add Skills</Label>
                <Input
                  placeholder="Type a skill and press Enter..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                />
                <Description>Press Enter to add each skill</Description>
              </TextField>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Chip
                      key={skill.id}
                      className="bg-primary/10 text-primary pr-1"
                    >
                      {skill.name}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill.id)}
                        className="hover:bg-primary/20 ml-1 rounded-full p-0.5"
                      >
                        <Icon icon="lucide:x" className="size-3" />
                      </button>
                    </Chip>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        </motion.div>

        <motion.div
          className="mt-8 flex items-center justify-between gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button variant="ghost" onPress={onBack}>
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
        onOpenChange={(o) => deleteModalState.setOpen(o)}
        projectNumber={deleteIndex !== null ? deleteIndex + 1 : null}
        label={deleteIndex !== null ? projects?.[deleteIndex]?.name || '' : ''}
        onConfirm={() => {
          if (deleteIndex !== null) {
            remove(deleteIndex);
            setDeleteIndex(null);
          }
        }}
      />
    </>
  );
}

function ProjectCard({
  index,
  onDelete,
}: {
  index: number;
  onDelete: () => void;
}) {
  const { control, setValue } = useFormContext<OnboardingFormInput>();
  const isCurrent = useWatch({ control, name: `projects.${index}.isCurrent` });
  const tech = useWatch({ control, name: `projects.${index}.tech` });

  return (
    <Card className="mb-4">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Project #{index + 1}</Card.Title>
        <Button isIconOnly variant="danger-soft" size="sm" onPress={onDelete}>
          <Icon icon="lucide:trash-2" />
        </Button>
      </Card.Header>
      <Card.Content className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name={`projects.${index}.name`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField className="w-full" isInvalid={!!fieldState.error}>
                <Label>Project Name *</Label>
                <Input {...field} placeholder="TailorCV" />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </TextField>
            )}
          />
          <TextField className="w-full">
            <Label>Tech Stack</Label>
            <Input
              value={Array.isArray(tech) ? tech.join(', ') : ''}
              onChange={(e) => {
                const arr = e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean);
                setValue(`projects.${index}.tech`, arr.length ? arr : null);
              }}
              placeholder="React, TypeScript"
            />
            <Description>Comma-separated</Description>
          </TextField>
        </div>
        <Controller
          name={`projects.${index}.bullets.0.text`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Description *</Label>
              <TextArea
                {...field}
                value={field.value || ''}
                placeholder="AI-powered resume builder..."
                rows={3}
              />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name={`projects.${index}.url`}
            control={control}
            render={({ field }) => (
              <TextField className="w-full">
                <Label>Project URL</Label>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="https://..."
                />
              </TextField>
            )}
          />
          <Controller
            name={`projects.${index}.repoUrl`}
            control={control}
            render={({ field }) => (
              <TextField className="w-full">
                <Label>GitHub URL</Label>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="github.com/..."
                />
              </TextField>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name={`projects.${index}.startDate`}
            control={control}
            render={({ field, fieldState }) => (
              <DateField
                label="Start Date"
                value={field.value ? parseDate(`${field.value}-01`) : null}
                onChange={(date) =>
                  field.onChange(date ? date.toString().slice(0, 7) : null)
                }
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name={`projects.${index}.endDate`}
            control={control}
            render={({ field, fieldState }) => (
              <DateField
                label="End Date"
                value={field.value ? parseDate(`${field.value}-01`) : null}
                onChange={(date) =>
                  field.onChange(date ? date.toString().slice(0, 7) : null)
                }
                isDisabled={!!isCurrent}
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            )}
          />
        </div>
        <Controller
          name={`projects.${index}.isCurrent`}
          control={control}
          render={({ field }) => (
            <Checkbox
              isSelected={!!field.value}
              onChange={(s) => {
                field.onChange(s);
                if (s) setValue(`projects.${index}.endDate`, null);
              }}
            >
              <Checkbox.Control className="size-5">
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <span className="text-sm">I am currently working on this</span>
              </Checkbox.Content>
            </Checkbox>
          )}
        />
      </Card.Content>
    </Card>
  );
}
