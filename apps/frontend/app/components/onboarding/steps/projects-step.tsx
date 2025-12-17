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
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { StepHeader } from '../step-header';
import { generateUUID } from '@/lib/utils';
import { DeleteProjectModal } from '@/app/components/projects/delete-project-modal';

interface ProjectsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ProjectsStep({ onNext, onBack }: ProjectsStepProps) {
  const deleteModalState = useOverlayState();
  const { control, watch, setValue } = useFormContext<OnboardingFormInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'projects',
  });

  const projects = watch('projects');
  const skills = watch('skills') ?? [];
  const [skillInput, setSkillInput] = useState('');
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const projectName =
    deleteIndex !== null ? projects?.[deleteIndex]?.name : '';

  const addProject = () => {
    append({
      id: generateUUID(),
      name: '',
      description: '',
      techStack: '',
      link: '',
    });
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const nextSkill = skillInput.trim();
    if (!nextSkill) return;

    e.preventDefault();
    if (!skills.includes(nextSkill)) {
      setValue('skills', [...skills, nextSkill], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setValue(
      'skills',
      skills.filter((s) => s !== skill),
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
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              layout
            >
                <Card className="mb-4">
                  <Card.Header className="flex-row items-center justify-between">
                    <Card.Title className="text-base">
                      Project #{index + 1}
                    </Card.Title>
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
                            <FieldError>{fieldState.error.message}</FieldError>
                          ) : null}
                        </TextField>
                      )}
                    />

                    <Controller
                      name={`projects.${index}.techStack`}
                      control={control}
                      render={({ field }) => (
                        <TextField className="w-full">
                          <Label>Tech Stack</Label>
                          <Input
                            {...field}
                            placeholder="Next.js, TypeScript, Tailwind"
                          />
                        </TextField>
                      )}
                    />
                  </div>

                  <Controller
                    name={`projects.${index}.description`}
                    control={control}
                    render={({ field }) => (
                      <TextField className="w-full">
                        <Label>Description</Label>
                        <Input
                          {...field}
                          placeholder="AI-powered resume builder that helps developers..."
                        />
                        <Description>
                          Brief 1-2 sentence description
                        </Description>
                      </TextField>
                    )}
                  />

                  <Controller
                    name={`projects.${index}.link`}
                    control={control}
                    render={({ field }) => (
                      <TextField className="w-full">
                        <Label>Link</Label>
                        <Input
                          {...field}
                          placeholder="github.com/username/project"
                        />
                        <Description>Optional</Description>
                      </TextField>
                    )}
                  />
                </Card.Content>
              </Card>
            </motion.div>
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
