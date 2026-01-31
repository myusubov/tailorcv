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
              variant="ghost"
              onPress={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                'size-8 rounded-full border-none transition-all active:scale-95',
                isSidebarOpen && 'bg-default/60',
              )}
              aria-label={isSidebarOpen ? 'Hide history' : 'Show history'}
            >
              <Icon
                icon={
                  isSidebarOpen
                    ? 'solar:sidebar-minimalistic-bold'
                    : 'solar:sidebar-minimalistic-linear'
                }
                width={18}
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
            <Icon icon="solar:chat-dots-bold" width={18} />
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
                variant="ghost"
                onPress={() => createNewConversation()}
                className="size-8 rounded-full border-none transition-all active:scale-95"
                aria-label="New conversation"
              >
                <Icon icon="solar:add-circle-linear" width={18} />
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
              onPress={onToggleFullscreen}
              className="size-8 rounded-full border-none transition-all active:scale-95"
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              <Icon
                icon={
                  isFullscreen
                    ? 'solar:minimize-linear'
                    : 'solar:maximize-linear'
                }
                width={18}
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
