import { useState } from 'react';
import { Button, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIChat } from '@/app/providers/ai-chat-provider';
import { ConversationItem } from './conversation-item';
import { ConversationSkeleton } from './conversation-skeleton';
import { DeleteDialog } from '@/app/components/ui/delete-dialog';

/**
 * Sidebar component for listing and managing chat conversations
 */
export function ChatSidebar() {
  const {
    conversations,
    conversationId,
    isLoadingConversations,
    isSidebarOpen,
    isCreatingConv,
    selectConversation,
    createNewConversation,
    deleteConversation,
  } = useAIChat();

  // State for delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteConversation(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-content1 border-separator flex h-full shrink-0 flex-col overflow-hidden border-r"
          >
            {/* Header */}
            <div className="h-ai-header border-separator flex items-center justify-between border-b px-3">
              <h3 className="text-foreground text-sm font-semibold">
                Conversations
              </h3>
              <div className="flex items-center gap-1">
                <Tooltip delay={300}>
                  <Tooltip.Trigger>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      onPress={() => createNewConversation()}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="New conversation"
                      isDisabled={isCreatingConv}
                    >
                      <Icon icon="solar:add-circle-linear" className="size-4" />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content showArrow>
                    <Tooltip.Arrow />
                    <p className="text-xs font-medium">New conversation</p>
                  </Tooltip.Content>
                </Tooltip>
                {/* <Tooltip delay={300}>
                  <Tooltip.Trigger>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      onPress={() => setIsSidebarOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Close sidebar"
                    >
                      <Icon
                        icon="solar:alt-arrow-left-linear"
                        className="size-4"
                      />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content showArrow>
                    <Tooltip.Arrow />
                    <p className="text-xs font-medium">Close sidebar</p>
                  </Tooltip.Content>
                </Tooltip> */}
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 space-y-1 overflow-y-auto p-2">
              {isLoadingConversations ? (
                <>
                  <ConversationSkeleton />
                  <ConversationSkeleton />
                  <ConversationSkeleton />
                </>
              ) : conversations.length === 0 ? (
                <div className="text-muted flex flex-col items-center justify-center gap-2 py-8 text-center text-sm">
                  <Icon
                    icon="solar:chat-dots-linear"
                    className="size-8 opacity-50"
                  />
                  <p>No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === conversationId}
                    onSelect={() => selectConversation(conv.id)}
                    onDelete={() => setDeleteId(conv.id)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <DeleteDialog
        isOpen={!!deleteId}
        onOpenChange={(isOpen) => !isOpen && setDeleteId(null)}
        title="Delete conversation?"
        description={
          <p>
            This will permanently delete this conversation and all its messages.
            This action cannot be undone.
          </p>
        }
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
