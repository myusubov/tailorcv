'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, cn } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ai-chat/types';
import { ChatHeader } from './ai-chat/chat-header';
import { ChatMessageList } from './ai-chat/chat-message-list';
import { ChatQuickActions } from './ai-chat/chat-quick-actions';
import { ChatInputArea } from './ai-chat/chat-input-area';
import { ChatTriggerButton } from './ai-chat/chat-trigger-button';

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
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInputFullscreen, setIsInputFullscreen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi! I'm your AI resume assistant. Ask me to update your summary, add skills, or rephrase bullet points.",
      timestamp: new Date(),
    },
  ]);

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
   * Focus the input when the chat expands.
   */
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isExpanded]);

  /**
   * Handles input changes and triggers auto-expansion of textarea if threshold is met.
   */
  const handleInputChange = (value: string) => {
    setInput(value);
  };

  /**
   * Handles sending a message from the user.
   * Currently uses mock AI responses for demonstration.
   */
  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsInputFullscreen(false);
    setIsTyping(true);

    // Simulate AI response with typing delay
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I'll help you with "${userMsg.content}". This feature is coming soon!`,
        timestamp: new Date(),
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, aiMsg]);
    }, 1500);
  };

  /**
   * Handles clicking a quick action chip.
   * @param action - The quick action text to send
   */
  const handleQuickAction = (action: string) => {
    handleInputChange(action);
    setTimeout(() => handleSend(), 100);
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

  const toggleExpand = () => setIsExpanded(!isExpanded);
  const closeChat = () => {
    setIsExpanded(false);
    setIsFullscreen(false);
    setIsInputFullscreen(false);
  };

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
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'z-50 flex flex-col overflow-hidden',
              'bg-surface/90 border border-white/10 shadow-2xl backdrop-blur-xl',
              isFullscreen
                ? 'fixed inset-0 m-0 h-full w-full rounded-none'
                : 'absolute right-0 bottom-0 h-[520px] w-[380px] rounded-3xl',
            )}
          >
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
              />

              {messages.length <= 2 && !isTyping && !isInputFullscreen && (
                <ChatQuickActions onActionClick={handleQuickAction} />
              )}

              <ChatInputArea
                input={input}
                isTyping={isTyping}
                isInputFullscreen={isInputFullscreen}
                inputRef={inputRef}
                onInputChange={handleInputChange}
                onSend={handleSend}
                onKeyDown={handleKeyDown}
                onToggleInputFullscreen={() =>
                  setIsInputFullscreen(!isInputFullscreen)
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
