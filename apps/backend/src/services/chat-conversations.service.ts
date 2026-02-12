import { prisma } from '../lib';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';
import type {
  CreateConversationInput,
  AddMessageInput,
  UpdateConversationResponseIdInput,
  DeleteConversationInput,
} from '../types/chat-conversations';

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

  return conversation;
}

/**
 * Adds a message to a conversation
 * @param input - Conversation ID, role, and content
 * @returns Created message
 */
export async function addMessage(input: AddMessageInput) {
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
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
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
