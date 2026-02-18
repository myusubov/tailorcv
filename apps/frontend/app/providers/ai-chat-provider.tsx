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

  // Form Integration (registered by review page)
  applyUpdate: (data: unknown) => void;
  canApplyUpdate: boolean;
  registerApplyUpdate: (fn: ((data: unknown) => void) | null) => void;

  // Conversation actions
  loadConversations: () => Promise<void>;
  createNewConversation: () => void;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => void;
  updateMessageStatus: (
    messageId: string,
    status: 'applied' | 'discarded',
  ) => Promise<void>;
  prefetchConversationDetails: (id: string) => void;
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

  // Form integration ref
  const applyUpdateRef = useRef<((data: unknown) => void) | null>(null);
  const [canApplyUpdate, setCanApplyUpdate] = useState(false);

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
  // Derive UI messages from query cache, including transient flags like isThinking
  const messages: ChatMessage[] =
    conversationDetails?.messages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.createdAt),
      proposal: msg.proposal,
      explanation: msg.explanation,
      status: msg.status,
      isThinking: msg.isThinking,
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
      conversationsCache.list.remove((c: ConversationListItem) => c.id === id);

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

        detailsCache.setData((old: ConversationDetails | undefined) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((msg: ConversationMessage) =>
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
    setConversationId(null);
    setIsTyping(false);
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

  const prefetchConversationDetails = useCallback(
    (id: string) => {
      detailsCache.prefetch({ conversationId: id });
    },
    [detailsCache],
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

      let activeConversationId = conversationId;
      let isNewConversation = false;
      const previousDetailsKey = useConversationDetailsQuery.getKey({
        id: conversationId || '',
      });

      // 1. Setup ID and optimistic state
      if (activeConversationId) {
        await queryClient.cancelQueries({ queryKey: previousDetailsKey });
      } else {
        activeConversationId = uuidv4();
        isNewConversation = true;
        setConversationId(activeConversationId);
        // Prevent refetch loop since we set data manually
        conversationJustCreated.current = true;
      }

      // New key for the active conversation
      const currentDetailsKey = useConversationDetailsQuery.getKey({
        id: activeConversationId!,
      });

      // 2. Optimistic Update (Details)
      const userMsg: ConversationMessage = {
        id: uuidv4(),
        conversationId: activeConversationId!,
        role: 'user',
        content: content,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ConversationDetails>(
        currentDetailsKey,
        (old: ConversationDetails | undefined) => {
          if (!old) {
            // Initialize new conversation structure
            return {
              id: activeConversationId!,
              userId: '', // Placeholder
              title: content.slice(0, 100),
              responseId: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              messages: [userMsg],
            };
          }
          return { ...old, messages: [...old.messages, userMsg] };
        },
      );

      // 3. Optimistic Update (List)
      if (isNewConversation) {
        conversationsCache.list.add({
          id: activeConversationId!,
          title: content.slice(0, 100),
          responseId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { messages: 1 },
        });
      } else {
        conversationsCache.setData((old) => {
          if (!old) return old;

          // 1. Find the conversation to update
          const targetIndex = old.findIndex(
            (c) => c.id === activeConversationId,
          );
          if (targetIndex === -1) return old; // Should not happen

          const target = old[targetIndex];

          // 2. Create updated object with new timestamp & count
          const updatedConv = {
            ...target,
            updatedAt: new Date().toISOString(), // Important for sorting!
            _count: { messages: target._count.messages + 1 },
          };
          // 3. Construct new array: [UpdatedConv, ...Rest]
          const others = [...old];
          others.splice(targetIndex, 1); // Remove old version
          return [updatedConv, ...others]; // Add new version at top
        });
      }

      setInput('');
      setIsInputFullscreen(false);
      setIsTyping(true);

      const idempotencyKey = uuidv4();
      const assistantMsgId = uuidv4();
      let accumulatedContent = '';
      const abortController = new AbortController();

      currentAbortController.current = abortController;

      const requestBody: AIChatRequest = {
        conversationId: activeConversationId!,
        message: content,
        resumeContext: currentResume,
        assistantMessageId: assistantMsgId,
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
              return;
            }

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
                // Optimistic Update for TEXT response:
                // When the first chunk arrives (empty accumulator), we:
                // 1. Update timestamp to now.
                // 2. Increment message count.
                // 3. Move conversation to the top of the list.
                if (accumulatedContent === '') {
                  conversationsCache.setData((old) => {
                    if (!old) return old;
                    const idx = old.findIndex(
                      (c) => c.id === activeConversationId,
                    );
                    if (idx === -1) return old;

                    const target = old[idx];
                    const updated = {
                      ...target,
                      updatedAt: new Date().toISOString(),
                      _count: { messages: target._count.messages + 1 },
                    };

                    const copy = [...old];
                    copy.splice(idx, 1);
                    return [updated, ...copy];
                  });
                }
                accumulatedContent += event.content;

                queryClient.setQueryData<ConversationDetails>(
                  currentDetailsKey,
                  (old: ConversationDetails | undefined) => {
                    if (!old) return old;
                    const hasMsg = old.messages.some(
                      (m) => m.id === assistantMsgId,
                    );
                    if (!hasMsg) {
                      const newAssistantMsg: ConversationMessage = {
                        id: assistantMsgId,
                        conversationId: activeConversationId!,
                        role: 'assistant',
                        content: accumulatedContent,
                        createdAt: new Date().toISOString(),
                        isThinking: false,
                      };
                      return {
                        ...old,
                        messages: [...old.messages, newAssistantMsg],
                      };
                    }
                    return {
                      ...old,
                      messages: old.messages.map((msg: ConversationMessage) =>
                        msg.id === assistantMsgId
                          ? { ...msg, content: accumulatedContent, isThinking: false }
                          : msg,
                      ),
                    };
                  },
                );
              } else if (event.type === 'proposal') {
                const proposalContent = event.explanation;

                // Optimistic Update for PROPOSAL response:
                // Move conversation to the top and update timestamp for edit actions.
                conversationsCache.setData((old) => {
                  if (!old) return old;
                  const idx = old.findIndex(
                    (c) => c.id === activeConversationId,
                  );
                  if (idx === -1) return old;

                  const target = old[idx];
                  const updated = {
                    ...target,
                    updatedAt: new Date().toISOString(),
                    _count: { messages: target._count.messages + 1 },
                  };

                  const copy = [...old];
                  copy.splice(idx, 1);
                  return [updated, ...copy];
                });

                queryClient.setQueryData<ConversationDetails>(
                  currentDetailsKey,
                  (old: ConversationDetails | undefined) => {
                    if (!old) return old;
                    const hasMsg = old.messages.some(
                      (m) => m.id === assistantMsgId,
                    );
                    if (!hasMsg) {
                      const newAssistantMsg: ConversationMessage = {
                        id: assistantMsgId,
                        conversationId: activeConversationId!,
                        role: 'assistant',
                        content: proposalContent,
                        createdAt: new Date().toISOString(),
                        proposal: event.data,
                        explanation: event.explanation,
                        status: 'pending',
                        isThinking: false,
                      };
                      return {
                        ...old,
                        messages: [...old.messages, newAssistantMsg],
                      };
                    }
                    return {
                      ...old,
                      messages: old.messages.map((msg: ConversationMessage) =>
                        msg.id === assistantMsgId
                          ? {
                              ...msg,
                              content: proposalContent,
                              proposal: event.data,
                              explanation: event.explanation,
                              isThinking: false,
                            }
                          : msg,
                      ),
                    };
                  },
                );
              } else if (event.type === 'thinking') {
                queryClient.setQueryData<ConversationDetails>(
                  currentDetailsKey,
                  (old) => {
                    if (!old) return old;
                    const hasMsg = old.messages.some(
                      (m) => m.id === assistantMsgId,
                    );
                    if (!hasMsg) {
                      const newAssistantMsg: ConversationMessage = {
                        id: assistantMsgId,
                        conversationId: activeConversationId!,
                        role: 'assistant',
                        content: 'Drafting changes...',
                        createdAt: new Date().toISOString(),
                        isThinking: true,
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
                              isThinking: true,
                              content: 'Drafting changes...',
                            } // Set flag + nice text
                          : msg,
                      ),
                    };
                  },
                );
              } else if (event.type === 'done') {
                setIsTyping(false);
                abortController.abort();

                // If backend returned a different ID for some reason
                if (
                  event.conversationId &&
                  event.conversationId !== activeConversationId
                ) {
                  conversationJustCreated.current = true;
                  setConversationId(event.conversationId);
                  conversationsCache.invalidate();
                } else if (isNewConversation) {
                  // Re-validate list to ensure accurate server data (e.g. title)
                  conversationsCache.invalidate();
                }
              } else if (event.type === 'error') {
                throw new Error(event.message);
              }
            } catch {
              // Skip malformed
            }
          },
          onerror(err) {
            console.error('AI Chat SSE error:', err);
            setIsTyping(false);

            const errorMessage =
              err instanceof Error
                ? err.message
                : 'Sorry, something went wrong. Please try again.';

            if (assistantMsgId) {
              queryClient.setQueryData<ConversationDetails>(
                currentDetailsKey,
                (old: ConversationDetails | undefined) => {
                  if (!old) return old;
                  return {
                    ...old,
                    messages: old.messages.map((msg: ConversationMessage) =>
                      msg.id === assistantMsgId
                        ? {
                            ...msg,
                            content:
                              accumulatedContent +
                              `\n\n[Error: ${errorMessage}]`,
                          }
                        : msg,
                    ),
                  };
                },
              );
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
        currentAbortController.current = null;
      }
    },
    [conversationId, currentResume, queryClient, conversationsCache],
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
  /**
   * Register or unregister a function to apply updates to the resume form
   */
  const registerApplyUpdate = useCallback(
    (fn: ((data: unknown) => void) | null) => {
      applyUpdateRef.current = fn;
      setCanApplyUpdate(!!fn);
    },
    [],
  );

  /**
   * Apply an update to the resume form (delegated to the registered function)
   */
  const applyUpdate = useCallback((data: unknown) => {
    if (applyUpdateRef.current) {
      applyUpdateRef.current(data);
    } else {
      console.warn(
        '[AIChatProvider] applyUpdate called but no function registered',
      );
    }
  }, []);

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
        applyUpdate,
        canApplyUpdate,
        registerApplyUpdate,
        loadConversations,
        createNewConversation,
        selectConversation,
        deleteConversation,
        updateMessageStatus,
        prefetchConversationDetails,
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
