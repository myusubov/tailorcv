'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { nanoid } from 'nanoid';
import { ProjectCard } from './project-card';

/**
 * Compact projects editor for the review page accordion.
 * Displays projects as expandable cards with add/remove functionality.
 */
export function ProjectsEditor() {
  const { control } = useFormContext<BaseResumeData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'projects',
  });

  /**
   * Adds a new empty project entry.
   */
  const handleAddProject = () => {
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
      bullets: [],
    });
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <ProjectCard
          key={field.id}
          index={index}
          onRemove={() => remove(index)}
        />
      ))}

      {/* Add button */}
      <Button
        variant="ghost"
        onPress={handleAddProject}
        className="border-default-300 w-full border border-dashed"
      >
        <Icon icon="lucide:plus" className="size-4" />
        Add Project
      </Button>

      {/* Empty state */}
      {fields.length === 0 && (
        <p className="text-muted text-center text-sm">No projects added yet.</p>
      )}
    </div>
  );
}
