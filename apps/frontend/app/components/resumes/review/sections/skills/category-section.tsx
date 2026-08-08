'use client';

import { Icon } from '@iconify/react';
import { Reorder, useDragControls } from 'framer-motion';
import { SkillItem } from './skill-item';
import { SkillInlineInput } from './skill-inline-input';

/**
 * Props for the CategorySection component.
 */
interface CategorySectionProps {
  /** Category name */
  category: string;
  /** List of skills in this category */
  skills: any[];
  /** Whether the inline input is active for this category */
  isAdding: boolean;
  /** The value of the new skill input */
  newSkillValue: string;
  /** Callback to update the new skill input value */
  setNewSkillValue: (val: string) => void;
  /** Callback to finalize adding a skill */
  onAddSkill: () => void;
  /** Callback to cancel adding a skill */
  onCancelAdd: () => void;
  /** Callback to start adding a skill (opens input) */
  onStartAdd: () => void;
  /** Callback to remove a skill by its field array index */
  onRemoveSkill: (index: number) => void;
  /** Callback to handle reordering of skills in this category */
  onReorderSkills: (newSkills: any[]) => void;
}

/**
 * Renders a single category section with a drag handle and a horizontal reorder group for skills.
 */
export function CategorySection({
  category,
  skills,
  isAdding,
  newSkillValue,
  setNewSkillValue,
  onAddSkill,
  onCancelAdd,
  onStartAdd,
  onRemoveSkill,
  onReorderSkills,
}: CategorySectionProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={category}
      dragListener={false}
      dragControls={controls}
      className="space-y-2"
    >
      {/* Category Header with Drag Handle */}
      <div className="group flex items-center gap-1">
        <div
          onPointerDown={(e) => controls.start(e)}
          className="hover:bg-default-100 cursor-grab rounded p-0.5 transition-colors active:cursor-grabbing"
          title="Drag to reorder categories"
        >
          <Icon
            icon="lucide:grip-vertical"
            className="text-muted hover:text-foreground size-3.5 transition-colors"
          />
        </div>
        <h4 className="text-muted text-xs font-semibold tracking-wide uppercase select-none">
          {category}
        </h4>
      </div>

      {/* Horizontal Reorder Group for Skills */}
      <Reorder.Group
        axis="x"
        values={skills}
        onReorder={onReorderSkills}
        className="flex min-h-[32px] flex-wrap items-center gap-2"
      >
        {skills.map((skill) => (
          <SkillItem key={skill.id} skill={skill} onRemove={onRemoveSkill} />
        ))}

        {/* Inline Add Interaction */}
        {isAdding ? (
          <SkillInlineInput
            value={newSkillValue}
            onChange={setNewSkillValue}
            onSubmit={onAddSkill}
            onCancel={onCancelAdd}
            placeholder="Skill..."
          />
        ) : (
          <button
            type="button"
            onClick={onStartAdd}
            className="border-border-secondary text-muted hover:border-accent hover:text-accent hover:bg-accent/5 inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs transition-colors"
            aria-label={`Add skill to ${category}`}
          >
            <Icon icon="lucide:plus" className="size-3" />
          </button>
        )}
      </Reorder.Group>
    </Reorder.Item>
  );
}
