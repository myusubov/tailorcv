'use client';

import { cn } from '@heroui/react';
import { ChatMessage } from './types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex w-full',
        message.role === 'user' ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'wrap-break-words max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          message.role === 'user'
            ? 'bg-accent text-accent-foreground'
            : 'bg-default text-default-foreground',
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
