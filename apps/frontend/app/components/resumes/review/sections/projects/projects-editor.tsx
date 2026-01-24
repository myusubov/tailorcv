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
  const { control, getValues } = useFormContext<BaseResumeData>();
  const { fields, append, remove, move, insert } = useFieldArray({
    control,
    name: 'projects',
  });

  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  // REMOVED: const projects = watch('projects'); - Prevents re-renders on keystrokes

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

  /**
   * Duplicates a project entry.
   */
  const handleDuplicate = (index: number) => {
    const allProjects = getValues('projects');
    const itemToDuplicate = allProjects?.[index];
    if (!itemToDuplicate) return;

    const newItem = {
      ...itemToDuplicate,
      id: nanoid(),
      bullets:
        itemToDuplicate.bullets?.map((bullet) => ({
          ...bullet,
          id: nanoid(),
        })) || [],
    };

    insert(index + 1, newItem);
  };

  const handleMoveUp = (index: number) => {
    move(index, index - 1);
  };

  const handleMoveDown = (index: number) => {
    move(index, index + 1);
  };

  const handleDelete = () => {
    if (deleteIndex === null) return;
    // undo action
    const allProjects = getValues('projects');
    const project = allProjects?.[deleteIndex];
    
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
  // Build label for modal - fetch fresh values when modal opens
  const getDeleteLabel = () => {
    if (deleteIndex === null) return '';
    const allProjects = getValues('projects');
    const proj = allProjects?.[deleteIndex];
    if (!proj) return '';
    const parts = [proj.name, proj.role].filter(Boolean);
    return parts.length > 0 ? parts.join(' - ') : '';
  };

  const label = getDeleteLabel();

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
              onDuplicate={() => handleDuplicate(index)}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
            />
          </motion.div>
        ))}

        {/* Add button */}
        <Button
          variant="ghost"
          onPress={handleAddProject}
          className="border-default-300 text-muted-foreground hover:text-foreground w-full border border-dashed transition-colors"
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
