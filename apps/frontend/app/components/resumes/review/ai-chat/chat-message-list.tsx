'use client';

import { Card, ScrollShadow } from '@heroui/react';
import { Icon } from '@iconify/react';
import { ChatMessage } from './types';
import { ChatMessageBubble } from './chat-message-bubble';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessageList({
  messages,
  isTyping,
  messagesEndRef,
}: ChatMessageListProps) {
  return (
    <Card.Content className="flex-1 overflow-hidden p-0">
      <ScrollShadow className="h-full space-y-3 p-4" size={30}>
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}

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
