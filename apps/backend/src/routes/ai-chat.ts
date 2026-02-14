import { Router } from 'express';
import { postChatMessage } from '../controllers/ai-chat.controller';
import {
  listConversationsController,
  getConversationController,
  createConversationController,
  deleteConversationController,
  patchMessageStatusController,
} from '../controllers/chat-conversations.controller';
import { requireClerkAuth } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { aiChatRateLimiter, aiConversationCrudRateLimiter } from '../middleware/rateLimiter';

export const aiChatRouter = Router();

/**
 * POST /api/v1/ai/chat
 * Stream a chat response from the AI assistant
 *
 * Body:
 * - conversationId: string (required for persistence)
 * - message: string (required)
 * - resumeContext: BaseResumeData | null (optional)
 */
aiChatRouter.post('/', aiChatRateLimiter, requireClerkAuth, idempotency(), postChatMessage);

/**
 * GET /api/v1/ai/chat/conversations
 * List all conversations for the authenticated user
 */
aiChatRouter.get('/conversations', aiConversationCrudRateLimiter, requireClerkAuth, listConversationsController);

/**
 * POST /api/v1/ai/chat/conversations
 * Create a new conversation
 */
aiChatRouter.post('/conversations', aiConversationCrudRateLimiter, requireClerkAuth, createConversationController);

/**
 * GET /api/v1/ai/chat/conversations/:id
 * Get a conversation with all messages
 */
aiChatRouter.get('/conversations/:id', aiConversationCrudRateLimiter, requireClerkAuth, getConversationController);

/**
 * DELETE /api/v1/ai/chat/conversations/:id
 * Delete a conversation
 */
aiChatRouter.delete('/conversations/:id', aiConversationCrudRateLimiter, requireClerkAuth, deleteConversationController);

/**
 * PATCH /api/v1/ai/chat/messages/:id/status
 * Update the status of a message (e.g., for AI proposals)
 */
aiChatRouter.patch('/messages/:id/status', aiConversationCrudRateLimiter, requireClerkAuth, patchMessageStatusController);


