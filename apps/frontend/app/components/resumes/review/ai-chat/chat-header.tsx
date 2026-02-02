'use client';

import { Card, Tooltip, CloseButton, Button, cn } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useAIChat } from '@/app/providers/ai-chat-provider';

interface ChatHeaderProps {
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function ChatHeader({
  onClose,
  isFullscreen,
  onToggleFullscreen,
}: ChatHeaderProps) {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    createNewConversation,
    conversationId,
  } = useAIChat();

  return (
    <Card.Header className="border-separator flex shrink-0 flex-row items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-2">
        {/* Sidebar toggle */}
        <Tooltip delay={300}>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                isSidebarOpen && 'bg-default/60',
                !isSidebarOpen && 'text-muted-foreground hover:text-foreground',
              )}
              aria-label={isSidebarOpen ? 'Hide history' : 'Show history'}
            >
              <Icon
                icon={
                  isSidebarOpen
                    ? 'solar:sidebar-minimalistic-bold'
                    : 'solar:sidebar-minimalistic-linear'
                }
                className="size-4"
              />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content showArrow>
            <Tooltip.Arrow />
            <p className="text-xs font-medium">
              {isSidebarOpen ? 'Hide history' : 'Chat history'}
            </p>
          </Tooltip.Content>
        </Tooltip>

        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
            <Icon icon="solar:chat-dots-bold" className="size-4" />
          </div>
          <div className="flex flex-col gap-0">
            <Card.Title className="text-sm font-semibold">
              AI Assistant
            </Card.Title>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* New conversation - Only show if we're in an existing conversation */}
        {conversationId && (
          <Tooltip delay={300}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => createNewConversation()}
                className={cn('text-muted-foreground hover:text-foreground')}
                aria-label="New conversation"
              >
                <Icon icon="solar:add-circle-linear" className="size-4" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow>
              <Tooltip.Arrow />
              <p className="text-xs font-medium">New conversation</p>
            </Tooltip.Content>
          </Tooltip>
        )}

        <Tooltip delay={300}>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={onToggleFullscreen}
              className={cn('text-muted-foreground hover:text-foreground')}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              <Icon
                icon={
                  isFullscreen
                    ? 'solar:minimize-linear'
                    : 'solar:maximize-linear'
                }
                className="size-4"
              />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content showArrow>
            <Tooltip.Arrow />
            <p className="text-xs font-medium">
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </p>
          </Tooltip.Content>
        </Tooltip>

        <Tooltip delay={300}>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={onClose}
              className={cn('text-muted-foreground hover:text-foreground')}
              aria-label="Close chat"
            >
              <Icon icon="solar:close-circle-linear" className="size-4" />
            </Button>
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
