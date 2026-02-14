'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEventSource } from '@microsoft/fetch-event-source';

import type { BaseResumeData } from 'shared';
import { useActionMutation } from '@/lib/hooks/use-action-mutation';
import type {
  AIChatRequest,
  AIChatStreamEvent,
  ConversationListItem,
  ChatMessage,
  ConversationDetails,
  ConversationMessage,
} from '@/lib/types/ai-chat';
import {
  useConversationsQuery,
  useConversationDetailsQuery,
  useConversationsCache,
  useConversationDetailsCache,
} from '@/lib/http/ai-chat-client';
import {
  createConversationAction,
  deleteConversationAction,
  updateMessageStatusAction,
} from '@/lib/actions/ai-chat.actions';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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
  isCreatingConv: boolean;

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

  // Stop response
  canStopResponse: boolean;
  stopResponse: () => void;

  // Conversation actions
  loadConversations: () => Promise<void>;
  createNewConversation: () => void;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => void;
  updateMessageStatus: (
    messageId: string,
    status: 'applied' | 'discarded',
  ) => Promise<void>;
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
  const queryClient = useQueryClient();

  // Track if we created this conversation during streaming (to prevent refetch)
  const conversationJustCreated = useRef(false);

  // Track current AbortController for stopping responses
  const currentAbortController = useRef<AbortController | null>(null);

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
      { id: conversationId || '' },
      {
        // Only fetch if we have a conversationId AND we didn't just create it during streaming
        enabled: !!conversationId && !conversationJustCreated.current,
      },
    );

  // Derive UI messages from query cache
  const messages: ChatMessage[] =
    conversationDetails?.messages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.createdAt),
      proposal: msg.proposal,
      explanation: msg.explanation,
      status: msg.status,
    })) || [];

  const conversationsCache = useConversationsCache();
  const detailsCache = useConversationDetailsCache(conversationId || '');

  // Mutations
  const { mutate: createConv, isPending: isCreatingConv } = useActionMutation(
    createConversationAction,
    {
      onMutate: async () => {
        const toastId = uuidv4();
        const previous = conversationsCache.getData();
        toast.loading('Creating new conversation...', {
          id: toastId,
        });
        return { previous, toastId };
      },
      onSuccess: (data, _variables, ctx) => {
        setConversationId(data.id);
        conversationsCache.list.add(data);
        toast.dismiss(ctx?.toastId);
      },
      onError: (_err, _variables, ctx) => {
        if (!ctx) return;
        const { previous, toastId } = ctx;
        if (previous) {
          conversationsCache.rollback(previous);
        }
        toast.error(_err.message || 'Failed to create conversation', {
          id: toastId,
        });
      },
      showErrorToast: false,
    },
  );

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

  const { mutate: mutateMessageStatus } = useActionMutation(
    updateMessageStatusAction,
    {
      onMutate: async ({ messageId, status }) => {
        await detailsCache.cancel();
        const previous = detailsCache.getData();

        detailsCache.setData((old) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((msg) =>
              msg.id === messageId ? { ...msg, status } : msg,
            ),
          };
        });

        return { previous };
      },
      onError: (_err, _variables, ctx) => {
        if (ctx?.previous) {
          detailsCache.setData(() => ctx.previous);
        }
        toast.error('Failed to save choice. Please try again.');
      },
    },
  );

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
      conversationJustCreated.current = false; // Reset flag when switching conversations
      setConversationId(id);
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
   * Stop the current AI response mid-stream
   */
  const stopResponse = useCallback(() => {
    if (currentAbortController.current) {
      currentAbortController.current.abort();
      setIsTyping(false);
      currentAbortController.current = null;
    }
  }, []);

  /**
   * Can stop response if we're currently streaming
   */
  const canStopResponse = isTyping && currentAbortController.current !== null;

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      if (conversationId) {
        await detailsCache.cancel();
      }

      const userMsg: ConversationMessage = {
        id: uuidv4(),
        conversationId: conversationId || '',
        role: 'user',
        content: content,
        createdAt: new Date().toISOString(),
      };

      if (conversationId) {
        detailsCache.setData((old) => {
          if (!old) return old;
          return { ...old, messages: [...old.messages, userMsg] };
        });
      }

      setInput('');
      setIsInputFullscreen(false);
      setIsTyping(true);

      const idempotencyKey = uuidv4();
      const assistantMsgId = uuidv4(); // Generate ID upfront
      let accumulatedContent = '';
      const abortController = new AbortController();

      // Store reference for stopResponse function
      currentAbortController.current = abortController;

      const requestBody: AIChatRequest = {
        conversationId: conversationId || '', // Backend will create if empty
        message: content,
        resumeContext: currentResume,
        assistantMessageId: assistantMsgId, // Tell backend what ID to use
      };

      try {
        await fetchEventSource('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            'x-idempotency-key': idempotencyKey,
          },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
          openWhenHidden: true,
          async onopen(response) {
            if (
              response.ok &&
              response.headers
                .get('content-type')
                ?.includes('text/event-stream')
            ) {
              return; // smooth sailing
            }

            // If we got an error (like 429), parse the JSON message
            const data = await response.json().catch(() => ({}));
            const errorMessage =
              data.message ||
              data.error?.message ||
              `Error ${response.status}: ${response.statusText}`;

            throw new Error(errorMessage);
          },
          onmessage(ev) {
            if (!ev.data) return;
            try {
              const event = JSON.parse(ev.data) as AIChatStreamEvent;
              if (event.type === 'text') {
                accumulatedContent += event.content;

                if (conversationId) {
                  detailsCache.setData((old) => {
                    if (!old) return old;
                    const hasMsg = old.messages.some(
                      (m) => m.id === assistantMsgId,
                    );
                    if (!hasMsg) {
                      const newAssistantMsg: ConversationMessage = {
                        id: assistantMsgId,
                        conversationId: conversationId || '',
                        role: 'assistant',
                        content: accumulatedContent,
                        createdAt: new Date().toISOString(),
                      };
                      return {
                        ...old,
                        messages: [...old.messages, newAssistantMsg],
                      };
                    }
                    return {
                      ...old,
                      messages: old.messages.map((msg) =>
                        msg.id === assistantMsgId
                          ? { ...msg, content: accumulatedContent }
                          : msg,
                      ),
                    };
                  });
                }
              } else if (event.type === 'proposal') {
                const proposalContent = event.explanation;

                if (conversationId) {
                  detailsCache.setData((old) => {
                    if (!old) return old;
                    const hasMsg = old.messages.some(
                      (m) => m.id === assistantMsgId,
                    );
                    if (!hasMsg) {
                      const newAssistantMsg: ConversationMessage = {
                        id: assistantMsgId,
                        conversationId: conversationId || '',
                        role: 'assistant',
                        content: proposalContent,
                        createdAt: new Date().toISOString(),
                        proposal: event.data,
                        explanation: event.explanation,
                        status: 'pending',
                      };
                      return {
                        ...old,
                        messages: [...old.messages, newAssistantMsg],
                      };
                    }
                    return {
                      ...old,
                      messages: old.messages.map((msg) =>
                        msg.id === assistantMsgId
                          ? {
                              ...msg,
                              content: proposalContent,
                              proposal: event.data,
                              explanation: event.explanation,
                            }
                          : msg,
                      ),
                    };
                  });
                }
              } else if (event.type === 'done') {
                setIsTyping(false);
                abortController.abort();

                // If backend created a new conversation, update our state
                if (
                  event.conversationId &&
                  event.conversationId !== conversationId
                ) {
                  // Mark that we just created this conversation (don't refetch)
                  conversationJustCreated.current = true;
                  setConversationId(event.conversationId);
                }

                // Refresh conversation list to show the new title
                conversationsCache.invalidate();
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

            const errorMessage =
              err instanceof Error
                ? err.message
                : 'Sorry, something went wrong. Please try again.';

            if (assistantMsgId && conversationId) {
              detailsCache.setData((old) => {
                if (!old) return old;
                return {
                  ...old,
                  messages: old.messages.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          content:
                            accumulatedContent + `\n\n[Error: ${errorMessage}]`,
                        }
                      : msg,
                  ),
                };
              });
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
      } finally {
        // Clear the abort controller reference
        currentAbortController.current = null;
      }
    },
    [conversationId, currentResume],
  );

  const handleQuickAction = useCallback(
    (action: string) => {
      sendMessage(action);
    },
    [sendMessage],
  );

  /**
   * Update message status (applied/discarded)
   */
  const updateMessageStatus = useCallback(
    async (messageId: string, status: 'applied' | 'discarded') => {
      mutateMessageStatus({ messageId, status });
    },
    [mutateMessageStatus],
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
        isCreatingConv,
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
        canStopResponse,
        stopResponse,
        loadConversations,
        createNewConversation,
        selectConversation,
        deleteConversation,
        updateMessageStatus,
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
