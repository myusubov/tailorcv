'use client';

import { Tooltip, Button, cn } from '@heroui/react';
import { Icon } from '@iconify/react';

interface ChatTriggerButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function ChatTriggerButton({
  isExpanded,
  onToggle,
}: ChatTriggerButtonProps) {
  return (
    <Tooltip delay={300}>
      <Tooltip.Trigger>
        <Button
          isIconOnly
          variant="tertiary"
          onPress={onToggle}
          className={cn(
            'size-14 rounded-full shadow-xl transition-all duration-300',
            'hover:-translate-y-1 hover:shadow-2xl active:scale-95',
            isExpanded && 'pointer-events-none scale-0 opacity-0',
          )}
          aria-label="Open AI Assistant"
        >
          <Icon icon="solar:stars-bold" className="size-6" />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content placement="left">
        <p className="font-medium">AI Assistant</p>
      </Tooltip.Content>
    </Tooltip>
  );
}
