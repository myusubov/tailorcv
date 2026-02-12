'use client';

import { Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { Reorder } from 'framer-motion';

/**
 * Props for the SkillItem component.
 */
interface SkillItemProps {
  /** The skill object with name and ID */
  skill: {
    id: string;
    name: string;
    _index: number;
  };
  /** Callback to remove the skill */
  onRemove: (index: number) => void;
}

/**
 * A draggable skill chip component.
 * Uses Framer Motion's Reorder.Item for drag-and-drop functionality.
 */
export function SkillItem({ skill, onRemove }: SkillItemProps) {
  return (
    <Reorder.Item value={skill} className="inline-block">
      <Chip
        variant="soft"
        className="hover:bg-default-200 cursor-grab gap-1 pr-1 transition-colors active:cursor-grabbing"
      >
        <span className="select-none">{skill.name}</span>
        <button
          type="button"
          onClick={() => onRemove(skill._index)}
          className="hover:bg-default-300/50 focus:ring-primary ml-0.5 rounded-full p-0.5 transition-colors outline-none focus:ring-1"
          aria-label={`Remove skill ${skill.name}`}
        >
          <Icon icon="lucide:x" className="size-3" />
        </button>
      </Chip>
    </Reorder.Item>
  );
}
