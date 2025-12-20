'use client';

import { useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Button,
  Card,
  Chip,
  Description,
  FieldError,
  Input,
  Label,
  TextField,
  useOverlayState,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useFormState,
} from 'react-hook-form';
import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { StepHeader } from '../step-header';
import { generateUUID } from '@/lib/utils';
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
  const projectName = deleteIndex !== null ? projects?.[deleteIndex]?.name : '';

  const addProject = () => {
    append({
      id: generateUUID(),
      name: '',
      description: '',
      techStack: '',
      link: '',
      repoUrl: '',
    });
  };

  const handleMoveUp = (idx: number) => {
    move(idx, idx - 1);
  };

  const handleMoveDown = (idx: number) => {
    move(idx, idx + 1);
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    // Fix: Prevent default form submission immediately
    e.preventDefault();

    const nextSkill = skillInput.trim();
    if (!nextSkill) return;
    const currentSkills = getValues('skills') ?? [];
    if (!currentSkills.includes(nextSkill)) {
      setValue('skills', [...currentSkills, nextSkill], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    const currentSkills = getValues('skills') ?? [];
    setValue(
      'skills',
      currentSkills.filter((s) => s !== skill),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const handleDelete = () => {
    if (deleteIndex === null) return;
    setTimeout(() => {
      remove(deleteIndex);
    }, 300);
    setDeleteIndex(null);
  };

  const handleDeleteModalOpenChange = (isOpen: boolean) => {
    deleteModalState.setOpen(isOpen);
    if (!isOpen) setDeleteIndex(null);
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
              <li>
                Add at least 1 project or 1 experience with some details
                (description or tech stack)
              </li>
            </ul>
            {errors.projects?.message ? (
              <p className="text-danger text-sm">
                {String(errors.projects.message)}
              </p>
            ) : null}
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
          {fields.length === 0 && errors.projects?.message ? (
            <FieldError>{String(errors.projects.message)}</FieldError>
          ) : null}

          <AnimatePresence mode="popLayout">
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
                <Card className="mb-4">
                  <Card.Header className="flex-row items-center justify-between">
                    <Card.Title className="text-base">
                      Project #{index + 1}
                    </Card.Title>
                    <div className="flex items-center gap-1">
                      {/* Mobile Reorder Controls */}
                      <div className="flex items-center gap-1 lg:hidden">
                        <Button
                          onPress={() => handleMoveUp(index)}
                          isDisabled={index === 0}
                          isIconOnly
                          variant="ghost"
                          size="sm"
                        >
                          <Icon icon="lucide:arrow-up" />
                        </Button>
                        <Button
                          onPress={() => handleMoveDown(index)}
                          isDisabled={index === fields.length - 1}
                          isIconOnly
                          variant="ghost"
                          size="sm"
                        >
                          <Icon icon="lucide:arrow-down" />
                        </Button>
                      </div>

                      <Button
                        isIconOnly
                        variant="danger-soft"
                        size="sm"
                        onPress={() => {
                          setDeleteIndex(index);
                          deleteModalState.open();
                        }}
                      >
                        <Icon icon="lucide:trash-2" />
                      </Button>
                    </div>
                  </Card.Header>

                  <Card.Content className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Controller
                        name={`projects.${index}.name`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            className="w-full"
                            isInvalid={!!fieldState.error}
                          >
                            <Label>Project Name</Label>
                            <Input {...field} placeholder="TailorCV" />
                            {fieldState.error ? (
                              <FieldError>
                                {fieldState.error.message}
                              </FieldError>
                            ) : null}
                          </TextField>
                        )}
                      />

                      <Controller
                        name={`projects.${index}.techStack`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            className="w-full"
                            isInvalid={!!fieldState.error}
                          >
                            <Label>Tech Stack</Label>
                            <Input
                              {...field}
                              placeholder="Next.js, TypeScript, Tailwind"
                            />
                            {fieldState.error ? (
                              <FieldError>
                                {fieldState.error.message}
                              </FieldError>
                            ) : null}
                          </TextField>
                        )}
                      />
                    </div>

                    <Controller
                      name={`projects.${index}.description`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <TextField
                          className="w-full"
                          isInvalid={!!fieldState.error}
                        >
                          <Label>Description</Label>
                          <Input
                            {...field}
                            placeholder="AI-powered resume builder that helps developers..."
                          />
                          <Description>
                            Brief 1-2 sentence description
                          </Description>
                          {fieldState.error ? (
                            <FieldError>{fieldState.error.message}</FieldError>
                          ) : null}
                        </TextField>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Controller
                        name={`projects.${index}.link`}
                        control={control}
                        render={({ field }) => (
                          <TextField className="w-full">
                            <Label>Project URL</Label>
                            <Input
                              {...field}
                              placeholder="https://myproject.com"
                            />
                            <Description>Live demo link (Optional)</Description>
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
                              placeholder="github.com/username/project"
                            />
                            <Description>
                              Repository link (Optional)
                            </Description>
                          </TextField>
                        )}
                      />
                    </div>
                  </Card.Content>
                </Card>
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
              <TextField className="w-full" isInvalid={!!errors.skills}>
                <Label>Add Skills</Label>
                <Input
                  placeholder="Type a skill and press Enter..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                />
                <Description>Press Enter to add each skill</Description>
                {errors.skills?.message ? (
                  <FieldError>{String(errors.skills.message)}</FieldError>
                ) : null}
              </TextField>

              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Icon icon="lucide:sparkles" className="text-warning size-3" />
                <span>
                  Tip: Don&apos;t worry about categories. AI will organize them
                  for you.
                </span>
              </div>

              {skills.length > 0 && (
                <div>
                  <Label className="text-muted mb-2 block text-sm">
                    Your Skills:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {skills.map((skill) => (
                        <motion.div
                          key={skill}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Chip className="bg-primary/10 text-primary pr-1">
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="hover:bg-primary/20 ml-1 rounded-full p-0.5"
                            >
                              <Icon icon="lucide:x" className="size-3" />
                            </button>
                          </Chip>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
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
          <Button
            variant="ghost"
            onPress={onBack}
            className="text-muted hover:text-foreground"
          >
            <Icon icon="lucide:arrow-left" className="size-4" />
            Back
          </Button>
          <Button onPress={onNext} className="group px-6">
            Next: Education
            <Icon
              icon="lucide:arrow-right"
              className="ml-2 size-4 transition-transform group-hover:translate-x-1"
            />
          </Button>
        </motion.div>
      </div>

      <DeleteProjectModal
        isOpen={deleteModalState.isOpen}
        onOpenChange={handleDeleteModalOpenChange}
        projectNumber={deleteIndex !== null ? deleteIndex + 1 : null}
        label={projectName ? projectName : ''}
        onConfirm={handleDelete}
      />
    </>
  );
}
