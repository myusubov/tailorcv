'use client';

import { Chip } from '@heroui/react';
import { HorizontalScroll } from '../../../ui/horizontal-scroll';

interface ChatQuickActionsProps {
  onActionClick: (action: string) => void;
  hasResumeContext: boolean;
}

export function ChatQuickActions({
  onActionClick,
  hasResumeContext,
}: ChatQuickActionsProps) {
  // Dynamically render quick actions based on whether the context contains the user's resume
  const QUICK_ACTIONS = hasResumeContext
    ? [
        'Add Python to skills',
        'Improve my summary',
        'Add a new project',
        'Add a work experience',
        'Check for grammar',
      ]
    : [
        'How to write a great summary?',
        'What skills make a resume stand out?',
        'How to describe my projects?',
        'General resume tips',
      ];
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
