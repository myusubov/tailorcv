'use client';

import { useState, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextField, Label, Input, Description, Button, Card, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { StepHeader } from '../step-header';
import type { Project } from '../../../onboarding/types';

interface ProjectsStepProps {
  projects: Project[];
  skills: string[];
  onProjectsChange: (projects: Project[]) => void;
  onSkillsChange: (skills: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ProjectsStep({
  projects,
  skills,
  onProjectsChange,
  onSkillsChange,
  onNext,
  onBack,
}: ProjectsStepProps) {
  const [skillInput, setSkillInput] = useState('');

  const addProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      techStack: '',
      link: '',
    };
    onProjectsChange([...projects, newProject]);
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    onProjectsChange(projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const removeProject = (id: string) => {
    onProjectsChange(projects.filter((p) => p.id !== id));
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        onSkillsChange([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    onSkillsChange(skills.filter((s) => s !== skill));
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <StepHeader
        icon="lucide:rocket"
        title="Projects & Skills"
        description="Showcase your best work and technical abilities."
      />

      {/* Projects Section */}
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
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              layout
            >
              <Card className="mb-4" variant="secondary">
                <Card.Header className="flex-row items-center justify-between">
                  <Card.Title className="text-base">Project #{index + 1}</Card.Title>
                  {projects.length > 1 && (
                    <Button
                      isIconOnly
                      variant="ghost"
                      size="sm"
                      onPress={() => removeProject(project.id)}
                      className="text-danger"
                    >
                      <Icon icon="lucide:trash-2" className="size-4" />
                    </Button>
                  )}
                </Card.Header>
                <Card.Content className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField className="w-full">
                      <Label>Project Name</Label>
                      <Input
                        placeholder="TailorCV"
                        value={project.name}
                        onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                      />
                    </TextField>

                    <TextField className="w-full">
                      <Label>Tech Stack</Label>
                      <Input
                        placeholder="Next.js, TypeScript, Tailwind"
                        value={project.techStack}
                        onChange={(e) => updateProject(project.id, 'techStack', e.target.value)}
                      />
                    </TextField>
                  </div>

                  <TextField className="w-full">
                    <Label>Description</Label>
                    <Input
                      placeholder="AI-powered resume builder that helps developers..."
                      value={project.description}
                      onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                    />
                    <Description>Brief 1-2 sentence description</Description>
                  </TextField>

                  <TextField className="w-full">
                    <Label>Link</Label>
                    <Input
                      placeholder="github.com/username/project"
                      value={project.link}
                      onChange={(e) => updateProject(project.id, 'link', e.target.value)}
                    />
                    <Description>Optional</Description>
                  </TextField>
                </Card.Content>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        <Button variant="secondary" onPress={addProject} className="w-full">
          <Icon icon="lucide:plus" className="mr-2 size-4" />
          Add {projects.length > 0 ? 'Another ' : ''}Project
        </Button>
      </motion.div>

      {/* Skills Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon icon="lucide:wrench" className="size-5" />
          Technical Skills
        </h3>

        <Card variant="secondary">
          <Card.Content className="space-y-4 pt-4">
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
                <Label className="text-muted-foreground mb-2 block text-sm">Your Skills:</Label>
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
        className="mt-8 flex justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button variant="ghost" onPress={onBack}>
          <Icon icon="lucide:arrow-left" className="mr-2 size-4" />
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
  );
}
