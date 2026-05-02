import { Button, cn, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { formatDistanceToNow } from 'date-fns';
import type { ConversationListItem } from '@/lib/types/ai-chat';

type ConversationItemProps = {
  conversation: ConversationListItem;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMouseEnter: () => void;
};

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onMouseEnter,
}: ConversationItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={cn(
        'group relative flex cursor-pointer flex-col gap-1 rounded-xl px-3 py-2.5 transition-colors',
        'hover:bg-default/50',
        isActive && 'bg-primary/10 border-primary/20 border',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'line-clamp-2 block flex-1 text-sm font-medium',
            !conversation.title && 'text-muted-foreground italic',
            isActive && 'text-foreground',
            !isActive && 'text-muted-foreground group-hover:text-foreground',
          )}
        >
          {conversation.title || 'New conversation'}
        </span>
        <Tooltip delay={300}>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              size="sm"
              variant="danger-soft"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Delete conversation"
            >
              <Icon icon="solar:trash-bin-trash-linear" className="size-4" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content showArrow>
            <Tooltip.Arrow />
            <p className="text-xs font-medium">Delete conversation</p>
          </Tooltip.Content>
        </Tooltip>
      </div>
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <span>
          {formatDistanceToNow(new Date(conversation.updatedAt), {
            addSuffix: true,
          })}
        </span>

        <span className="text-muted/50">•</span>
        <span>{conversation._count.messages} messages</span>
      </div>
    </div>
  );
}
