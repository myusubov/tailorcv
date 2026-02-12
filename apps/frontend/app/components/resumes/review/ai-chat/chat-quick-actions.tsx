'use client';

import { Chip } from '@heroui/react';
import { HorizontalScroll } from '../../../ui/horizontal-scroll';

const QUICK_ACTIONS = [
  'Add Python to skills',
  'Improve my summary',
  'Add a new project',
  'Add a work experience',
  'Check for grammar',
];

interface ChatQuickActionsProps {
  onActionClick: (action: string) => void;
}

export function ChatQuickActions({ onActionClick }: ChatQuickActionsProps) {
  return (
    <div className="border-separator shrink-0 border-t">
      <HorizontalScroll scrollClassName="px-4 py-3" className="w-full">
        {QUICK_ACTIONS.map((action) => (
          <Chip
            key={action}
            variant="secondary"
            size="sm"
            className="hover:bg-accent hover:text-accent-foreground shrink-0 cursor-pointer transition-colors"
            onClick={() => onActionClick(action)}
          >
            {action}
          </Chip>
        ))}
      </HorizontalScroll>
    </div>
  );
}
