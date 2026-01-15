'use client';

import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button, useOverlayState } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { nanoid } from 'nanoid';
import { ProjectCard } from './project-card';
import { DeleteProjectModal } from '@/app/components/projects/delete-project-modal';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

/**
 * Compact projects editor for the review page accordion.
 * Displays projects as expandable cards with add/remove functionality.
 */
export function ProjectsEditor() {
  const deleteModalState = useOverlayState();
  const { control, watch } = useFormContext<BaseResumeData>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'projects',
  });

  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const projects = watch('projects');

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

  const handleMoveUp = (index: number) => {
    move(index, index - 1);
  };

  const handleMoveDown = (index: number) => {
    move(index, index + 1);
  };

  const handleDelete = () => {
    if (deleteIndex === null) return;
    const project = projects?.[deleteIndex];
    toast.info('Project was deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          if (project) {
            append(project);
          }
          setDeleteIndex(null);
        },
      },
    });
    remove(deleteIndex);
    setDeleteIndex(null);
  };

  const handleDeleteModalOpenChange = (isOpen: boolean) => {
    deleteModalState.setOpen(isOpen);
    if (!isOpen) setDeleteIndex(null);
  };

  // Build label for modal
  const projectName = deleteIndex !== null ? projects?.[deleteIndex]?.name : '';
  const role = deleteIndex !== null ? projects?.[deleteIndex]?.role : '';
  const labelParts = [projectName, role].filter(Boolean);
  const label = labelParts.length > 0 ? labelParts.join(' - ') : '';

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
            <ProjectCard
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
          onPress={handleAddProject}
          className="border-default-300 w-full border border-dashed"
        >
          <Icon icon="lucide:plus" className="size-4" />
          Add Project
        </Button>

        {/* Empty state */}
        {fields.length === 0 && (
          <p className="text-muted text-center text-sm">
            No projects added yet.
          </p>
        )}
      </motion.div>

      <DeleteProjectModal
        isOpen={deleteModalState.isOpen}
        onOpenChange={handleDeleteModalOpenChange}
        projectNumber={deleteIndex !== null ? deleteIndex + 1 : null}
        label={label}
        onConfirm={handleDelete}
      />
    </>
  );
}
