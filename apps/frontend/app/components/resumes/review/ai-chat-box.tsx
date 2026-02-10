'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatHeader } from './ai-chat/chat-header';
import { ChatSidebar } from './ai-chat/chat-sidebar';
import { ChatMessageList } from './ai-chat/chat-message-list';
import { ChatQuickActions } from './ai-chat/chat-quick-actions';
import { ChatInputArea } from './ai-chat/chat-input-area';
import { ChatTriggerButton } from './ai-chat/chat-trigger-button';
import { useAIChat } from '@/app/providers/ai-chat-provider';

/**
 * Props for the AIChatBox component.
 */
interface AIChatBoxProps {
  /** Additional CSS classes to apply to the root container */
  className?: string;
}

/**
 * AI Chat Assistant component for resume editing.
 * Uses HeroUI v3 components with semantic color tokens.
 *
 * @param props - Component props
 * @returns The rendered chat widget
 */
export function AIChatBox({ className }: AIChatBoxProps) {
  const {
    messages,
    input,
    isExpanded,
    isFullscreen,
    isInputFullscreen,
    isSidebarOpen,
    isTyping,
    setInput,
    setIsFullscreen,
    setIsInputFullscreen,
    sendMessage,
    handleQuickAction,
    toggleExpand,
    closeChat,
    currentResume,
    isLoadingMessages,
  } = useAIChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Scrolls the message container to the bottom when new messages arrive.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  /**
   * Handle Side Effects when Chat Expands/Collapses:
   * 1. Focus input (delayed for animation)
   * 2. Lock body scroll
   */
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isExpanded]);

  /**
   * Handles sending a message from the user.
   */
  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
  };

  /**
   * Handles keyboard events in the textarea.
   * Enter sends the message, Shift+Enter creates a new line.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const contextLabel = currentResume
    ? `${currentResume.contact.firstName}'s Resume`
    : null;

  return (
    <div
      className={cn(
        'fixed right-6 bottom-6 z-50 flex flex-col items-end',
        className,
      )}
    >
      <ChatTriggerButton isExpanded={isExpanded} onToggle={toggleExpand} />

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'z-50 flex overflow-hidden',
              'bg-surface border border-border shadow-2xl',
              isFullscreen
                ? 'fixed inset-0 m-0 h-full w-full rounded-none'
                : cn(
                    'absolute right-0 bottom-0 h-130 rounded-3xl',
                    isSidebarOpen ? 'w-180' : 'w-100',
                  ),
            )}
          >
            {/* Sidebar */}
            <ChatSidebar />

            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <ChatHeader
                onClose={closeChat}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              />

              <div className="relative flex flex-1 flex-col overflow-hidden">
                <ChatMessageList
                  messages={messages}
                  isTyping={isTyping}
                  messagesEndRef={messagesEndRef}
                  isLoadingMessages={isLoadingMessages}
                />

                {messages.length <= 1 && !isTyping && !isInputFullscreen && (
                  <ChatQuickActions onActionClick={handleQuickAction} />
                )}

                <ChatInputArea
                  input={input}
                  isTyping={isTyping}
                  isInputFullscreen={isInputFullscreen}
                  contextName={contextLabel}
                  inputRef={inputRef}
                  onInputChange={setInput}
                  onSend={handleSend}
                  onKeyDown={handleKeyDown}
                  onToggleInputFullscreen={() =>
                    setIsInputFullscreen(!isInputFullscreen)
                  }
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
