import { Card, ScrollShadow } from '@heroui/react';
import { Icon } from '@iconify/react';
import { ChatMessage } from '@/lib/types/ai-chat';
import { ChatMessageBubble } from './chat-message-bubble';
import { ChatMessageSkeleton } from './chat-message-skeleton';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isLoadingMessages: boolean;
}

export function ChatMessageList({
  messages,
  isTyping,
  messagesEndRef,
  isLoadingMessages,
}: ChatMessageListProps) {
  return (
    <Card.Content className="relative flex flex-1 flex-col overflow-hidden p-0">
      <ScrollShadow className="h-full space-y-3 p-4" size={30}>
        {isLoadingMessages ? (
          <ChatMessageSkeleton />
        ) : messages.length === 0 && !isTyping ? (
          <div className="flex h-full flex-col items-center justify-center space-y-4 px-8 text-center">
            <div className="bg-default-100 flex size-20 items-center justify-center rounded-3xl">
              <Icon
                icon="solar:magic-stick-3-bold-duotone"
                className="text-primary size-10"
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-foreground text-lg font-semibold">
                Your AI Resume Coach
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed text-balance">
                I can help you polish your summary, optimize bullet points, and
                structure your experience. What would you like to improve?
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))
        )}

        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="bg-accent/10 text-accent flex size-7 shrink-0 items-center justify-center rounded-full">
              <Icon icon="solar:chat-dots-bold" width={14} />
            </div>
            <div className="bg-default flex items-center gap-1.5 rounded-2xl px-4 py-3">
              <span className="bg-accent size-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
              <span className="bg-accent size-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
              <span className="bg-accent size-2 animate-bounce rounded-full" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </ScrollShadow>
    </Card.Content>
  );
}
