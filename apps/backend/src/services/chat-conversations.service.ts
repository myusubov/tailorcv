import { logger, prisma } from '../lib';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';
import type {
  CreateConversationInput,
  AddMessageInput,
  UpdateConversationResponseIdInput,
  DeleteConversationInput,
} from '../types/chat-conversations';
import { InputJsonValue, JsonValue } from 'prisma/generated/client/runtime/client';

/**
 * Creates a new chat conversation for a user
 * @param input - User ID and optional title
 * @returns Created conversation record
 */
export async function createConversation(input: CreateConversationInput) {
  return prisma.chatConversation.create({
    data: {
      userId: input.clerkUserId,
      title: input.title,
      responseId: input.responseId,
    },
    select: {
      id: true,
      title: true,
      responseId: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { messages: true },
      },
    },
  });
}

/**
 * Lists all conversations for a user, ordered by most recent
 * @param clerkUserId - User's Clerk ID
 * @returns Array of conversations with message count
 */
export async function listConversations(clerkUserId: string) {
  return prisma.chatConversation.findMany({
    where: { userId: clerkUserId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      responseId: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { messages: true },
      },
    },
  });
}

/**
 * Gets a single conversation with all its messages
 * @param id - Conversation ID
 * @param clerkUserId - User's Clerk ID (for ownership check)
 * @returns Conversation with messages
 */
export async function getConversationWithMessages(
  id: string,
  clerkUserId: string,
) {
  const conversation = await prisma.chatConversation.findFirst({
    where: { id, userId: clerkUserId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation) {
    throw new AppError('Conversation not found', ErrorCode.CONVERSATION_NOT_FOUND, 404);
  }

  // Map messages to include proposal fields from metadata
  const mappedMessages = conversation.messages.map((msg) => {
    const metadata = msg.metadata as Record<string, unknown> | null;

    return {
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      createdAt: msg.createdAt,
      proposal: metadata?.proposal ?? null,
      explanation: metadata?.explanation ?? null,
      status: (metadata?.status as string) || (metadata?.proposal ? 'pending' : null),
    };
  });

  return {
    ...conversation,
    messages: mappedMessages,
  };
}

/**
 * Adds a message to a conversation
 * @param input - Conversation ID, role, and content
 * @returns Created message
 */
export async function addMessage(input: AddMessageInput & { id?: string }) {
  // Verify ownership
  const conversation = await prisma.chatConversation.findFirst({
    where: { id: input.conversationId, userId: input.clerkUserId },
    select: { id: true, title: true },
  });

  if (!conversation) {
    throw new AppError('Conversation not found', ErrorCode.CONVERSATION_NOT_FOUND, 404);
  }

  // If this is the first user message and no title, set it
  const shouldUpdateTitle = !conversation.title && input.role === 'user';

  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        ...(input.id ? { id: input.id } : {}),
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        metadata: input.metadata as InputJsonValue,
      },
    }),
    prisma.chatConversation.update({
      where: { id: input.conversationId },
      data: {
        updatedAt: new Date(),
        ...(shouldUpdateTitle && {
          title: input.content.slice(0, 100),
        }),
      },
    }),
  ]);

  return message;
}

/**
 * Updates the responseId for a conversation (after AI responds)
 * @param input - Conversation ID and new responseId
 */
export async function updateConversationResponseId(
  input: UpdateConversationResponseIdInput,
) {
  const conversation = await prisma.chatConversation.findFirst({
    where: { id: input.conversationId, userId: input.clerkUserId },
    select: { id: true },
  });

  if (!conversation) {
    throw new AppError('Conversation not found', ErrorCode.CONVERSATION_NOT_FOUND, 404);
  }

  return prisma.chatConversation.update({
    where: { id: input.conversationId },
    data: { responseId: input.responseId },
  });
}

/**
 * Deletes a conversation and all its messages
 * @param id - Conversation ID
 * @param clerkUserId - User's Clerk ID (for ownership check)
 */
export async function deleteConversation({
  id,
  clerkUserId,
}: DeleteConversationInput) {
  const conversation = await prisma.chatConversation.findFirst({
    where: { id, userId: clerkUserId },
    select: { id: true },
  });

  if (!conversation) {
    throw new AppError('Conversation not found', ErrorCode.CONVERSATION_NOT_FOUND, 404);
  }

  await prisma.chatConversation.delete({ where: { id } });
}

/**
 * Updates the status of a message (e.g., for AI proposals)
 */
export async function updateMessageStatus({
  messageId,
  clerkUserId,
  status,
}: {
  messageId: string;
  clerkUserId: string;
  status: 'pending' | 'applied' | 'discarded';
}) {

  logger.info({ messageId, clerkUserId, status }, 'Updating message status');

  // Verify the message belongs to the user
  const message = await prisma.chatMessage.findFirst({
    where: {
      id: messageId,
      conversation: {
        userId: clerkUserId,
      },
    },
  });

  if (!message) {
    throw new AppError('Message not found', ErrorCode.CONVERSATION_NOT_FOUND, 404);
  }

  const currentMetadata = (message.metadata as Record<string, unknown>) || {};

  await prisma.chatMessage.update({
    where: { id: messageId },
    data: {
      metadata: {
        ...currentMetadata,
        status,
      } as InputJsonValue,
    },
  });
}

/**
 * Ensures a chat session exists and returns the conversation ID and last response ID
 */
export async function ensureChatSession({
  clerkUserId,
  conversationId,
  initialMessage,
}: {
  clerkUserId: string;
  conversationId?: string;
  initialMessage: string;
}) {
  let activeConversationId = conversationId;
  let previousResponseId: string | null = null;

  if (!activeConversationId) {
    const conversation = await createConversation({
      clerkUserId,
      title: initialMessage.slice(0, 100),
    });
    activeConversationId = conversation.id;
  } else {
    const conversation = await getConversationWithMessages(activeConversationId, clerkUserId);
    previousResponseId = conversation.responseId;
  }

  return { activeConversationId, previousResponseId };
}

/**
 * Persists the assistant's response and updates conversation context
 */
export async function saveAssistantResponse({
  conversationId,
  clerkUserId,
  responseId,
  content,
  metadata,
  id,
  markIdempotentCompleted,
}: {
  conversationId: string;
  clerkUserId: string;
  responseId: string | null;
  content: string;
  metadata?: JsonValue;
  id?: string;
  markIdempotentCompleted?: () => Promise<void>;
}) {
  const savePromises: Promise<unknown>[] = [
    addMessage({
      ...(id ? { id } : {}),
      conversationId,
      clerkUserId,
      role: 'assistant',
      content,
      metadata: metadata as Record<string, unknown>, // Cast for matching prisma input
    }),
  ];


  // Only update the conversation's responseId if:
  // 1. We have a valid responseId (not null/empty)
  // 2. It's not an edit-* placeholder
  // 3. It's not a proposal/tool call (which would cause "No tool output found" errors)
  const isProposal = metadata && typeof metadata === 'object' && 'type' in metadata && metadata.type === 'proposal';

  if (responseId && !responseId.startsWith('edit-') && !isProposal) {
    savePromises.push(
      updateConversationResponseId({
        conversationId,
        clerkUserId,
        responseId,
      }),
    );
  }

  if (markIdempotentCompleted) {
    savePromises.push(markIdempotentCompleted());
  }

  await Promise.all(savePromises);
}
