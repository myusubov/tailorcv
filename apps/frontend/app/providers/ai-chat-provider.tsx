'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { useMutation } from '@tanstack/react-query';
import { fetchEventSource } from '@microsoft/fetch-event-source';

import type { BaseResumeData } from 'shared';
import { useActionMutation } from '@/lib/hooks/use-action-mutation';
import type {
  AIChatRequest,
  AIChatStreamEvent,
  ConversationListItem,
  ChatMessage,
} from '@/lib/types/ai-chat';
import {
  useConversationsQuery,
  useConversationDetailsQuery,
  useConversationsCache,
} from '@/lib/http/ai-chat-client';
import {
  createConversationAction,
  deleteConversationAction,
} from '@/lib/actions/ai-chat.actions';
import { toast } from 'sonner';

/**
 * Context type for AI Chat functionality
 */
interface AIChatContextType {
  // Current conversation state
  messages: ChatMessage[];
  conversationId: string | null;
  isTyping: boolean;

  // UI state
  input: string;
  isExpanded: boolean;
  isFullscreen: boolean;
  isInputFullscreen: boolean;
  isSidebarOpen: boolean;

  // Conversation list
  conversations: ConversationListItem[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  // Resume context
  currentResume: BaseResumeData | null;

  // Actions
  setInput: (value: string) => void;
  setIsExpanded: (value: boolean) => void;
  setIsFullscreen: (value: boolean) => void;
  setIsInputFullscreen: (value: boolean) => void;
  setIsSidebarOpen: (value: boolean) => void;
  setCurrentResume: (data: BaseResumeData | null) => void;
  sendMessage: (content: string) => void;
  handleQuickAction: (action: string) => void;
  toggleExpand: () => void;
  closeChat: () => void;

  // Conversation actions
  loadConversations: () => Promise<void>;
  createNewConversation: () => void;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => void;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export function AIChatProvider({ children }: { children: React.ReactNode }) {
  // UI state

  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInputFullscreen, setIsInputFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Conversation state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Resume context
  const [currentResume, setCurrentResume] = useState<BaseResumeData | null>(
    null,
  );

  // Queries
  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useConversationsQuery(undefined, {
    enabled: isExpanded,
  });

  const { data: conversationDetails, isLoading: isLoadingMessages } =
    useConversationDetailsQuery(
      conversationId ? { id: conversationId } : { id: '' },
      {
        enabled: !!conversationId,
      },
    );

  // Sync messages from query to local state when conversation loads
  useEffect(() => {
    if (conversationDetails) {
      const chatMessages: ChatMessage[] = conversationDetails.messages.map(
        (msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
        }),
      );
      setMessages(chatMessages);
    }
  }, [conversationDetails]);

  const conversationsCache = useConversationsCache();

  // Mutations
  const { mutate: createConv } =
    useActionMutation(createConversationAction, {
      onSuccess: (data) => {
        setConversationId(data.id);
        setMessages([]);
        refetchConversations();
      },
      showErrorToast: false,
    });

  const { mutate: deleteConv } = useActionMutation(deleteConversationAction, {
    onMutate: async ({ id }) => {
      // 1. Cancel outgoing fetches
      await conversationsCache.cancel();

      // 2. Snapshot current state
      const previous = conversationsCache.getData();

      // 3. Optimistically remove from list
      conversationsCache.list.remove((c) => c.id === id);

      // 4. Handle internal state instantly
      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
      }

      return { previous };
    },
    onError: (_err, _variables, ctx) => {
      if (!ctx) return;
      // Rollback on failure
      const { previous } = ctx;
      if (previous) {
        conversationsCache.rollback(previous);
      }
    },
    showErrorToast: true,
  });

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  const closeChat = () => {
    setIsExpanded(false);
    setIsFullscreen(false);
    setIsInputFullscreen(false);
  };

  /**
   * Helper to manually refresh list (compatibility)
   */
  const loadConversations = useCallback(async () => {
    await refetchConversations();
  }, [refetchConversations]);

  /**
   * Create new conversation wrapper (fire-and-forget)
   */
  const createNewConversation = useCallback(() => {
    createConv({});
  }, [createConv]);

  /**
   * Select conversation wrapper
   */
  const selectConversation = useCallback(
    async (id: string) => {
      if (conversationId === id) return;
      setConversationId(id);
      setMessages([]); // Clear while loading
      // Query will trigger automatically
    },
    [conversationId],
  );

  /**
   * Delete conversation wrapper (fire-and-forget)
   */
  const deleteConversation = useCallback(
    (id: string) => {
      deleteConv({ id });
    },
    [deleteConv],
  );

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsInputFullscreen(false);
      setIsTyping(true);

      let accumulatedContent = '';
      let assistantMsgId: string | null = null;
      const abortController = new AbortController();

      const requestBody: AIChatRequest = {
        conversationId: conversationId || '', // Backend will create if empty
        message: content,
        resumeContext: currentResume,
      };

      try {
        await fetchEventSource('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
          openWhenHidden: true,
          onmessage(ev) {
            if (!ev.data) return;
            try {
              const event = JSON.parse(ev.data) as AIChatStreamEvent;
              if (event.type === 'text') {
                accumulatedContent += event.content;

                if (!assistantMsgId) {
                  assistantMsgId = crypto.randomUUID();
                  const newAssistantMsg: ChatMessage = {
                    id: assistantMsgId,
                    role: 'assistant',
                    content: accumulatedContent,
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, newAssistantMsg]);
                  setIsTyping(false);
                } else {
                  const currentId = assistantMsgId;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === currentId
                        ? { ...msg, content: accumulatedContent }
                        : msg,
                    ),
                  );
                }
              } else if (event.type === 'done') {
                setIsTyping(false);
                abortController.abort();

                // If backend created a new conversation, update our state
                if (
                  event.conversationId &&
                  event.conversationId !== conversationId
                ) {
                  setConversationId(event.conversationId);
                }

                // Refresh title/list
                refetchConversations();
              } else if (event.type === 'error') {
                throw new Error(event.message);
              }
            } catch {
              // Skip malformed JSON
            }
          },
          onerror(err) {
            console.error('AI Chat SSE error:', err);
            setIsTyping(false);

            if (assistantMsgId) {
              const currentId = assistantMsgId;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === currentId
                    ? {
                        ...msg,
                        content:
                          accumulatedContent + '\n\n[Error: Connection lost]',
                      }
                    : msg,
                ),
              );
            } else {
              const errorMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.',
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, errorMsg]);
            }
            throw err;
          },
          onclose() {
            setIsTyping(false);
          },
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('AI Chat error:', error);
        }
        setIsTyping(false);
      }
    },
    [conversationId, currentResume, refetchConversations],
  );

  const handleQuickAction = useCallback(
    (action: string) => {
      sendMessage(action);
    },
    [sendMessage],
  );

  return (
    <AIChatContext.Provider
      value={{
        messages,
        conversationId,
        isTyping,
        input,
        isExpanded,
        isFullscreen,
        isInputFullscreen,
        isSidebarOpen,
        conversations,
        isLoadingConversations,
        isLoadingMessages,
        currentResume,
        setInput,
        setIsExpanded,
        setIsFullscreen,
        setIsInputFullscreen,
        setIsSidebarOpen,
        setCurrentResume,
        sendMessage,
        handleQuickAction,
        toggleExpand,
        closeChat,
        loadConversations,
        createNewConversation,
        selectConversation,
        deleteConversation,
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
}

export const useAIChat = () => {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
};
