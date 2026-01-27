'use client';

import { Card, Tooltip, CloseButton, Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface ChatHeaderProps {
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function ChatHeader({ onClose, isFullscreen, onToggleFullscreen }: ChatHeaderProps) {
  return (
    <Card.Header className="border-separator flex flex-row items-center justify-between border-b px-4 py-3 shrink-0">
      <div className="flex items-center gap-3">
        <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
          <Icon icon="solar:chat-dots-bold" width={18} />
        </div>
        <div className="flex flex-col gap-0">
          <Card.Title className="text-sm font-semibold">AI Assistant</Card.Title>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip delay={300}>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              variant="tertiary"
              onPress={onToggleFullscreen}
              className="size-8 rounded-full transition-all active:scale-90"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <Icon 
                icon={isFullscreen ? "solar:minimize-linear" : "solar:maximize-linear"} 
                width={18} 
              />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content showArrow>
            <Tooltip.Arrow />
            <p className="text-xs font-medium">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</p>
          </Tooltip.Content>
        </Tooltip>

        <Tooltip delay={300}>
          <Tooltip.Trigger>
            <CloseButton
              onPress={onClose}
              className="hover:bg-default size-8 rounded-full transition-all active:scale-90"
              aria-label="Close chat"
            />
          </Tooltip.Trigger>
          <Tooltip.Content showArrow>
            <Tooltip.Arrow />
            <p className="text-xs font-medium">Close Assistant</p>
          </Tooltip.Content>
        </Tooltip>
      </div>
    </Card.Header>
  );
}
