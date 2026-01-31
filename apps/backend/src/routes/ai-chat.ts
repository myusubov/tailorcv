import { Router } from 'express';
import { postChatMessage } from '../controllers/ai-chat.controller';
import {
  listConversationsController,
  getConversationController,
  createConversationController,
  deleteConversationController,
} from '../controllers/chat-conversations.controller';
import { requireClerkAuth } from '../middleware/auth';

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
aiChatRouter.post('/', requireClerkAuth, postChatMessage);

/**
 * GET /api/v1/ai/chat/conversations
 * List all conversations for the authenticated user
 */
aiChatRouter.get('/conversations', requireClerkAuth, listConversationsController);

/**
 * POST /api/v1/ai/chat/conversations
 * Create a new conversation
 */
aiChatRouter.post('/conversations', requireClerkAuth, createConversationController);

/**
 * GET /api/v1/ai/chat/conversations/:id
 * Get a conversation with all messages
 */
aiChatRouter.get('/conversations/:id', requireClerkAuth, getConversationController);

/**
 * DELETE /api/v1/ai/chat/conversations/:id
 * Delete a conversation
 */
aiChatRouter.delete('/conversations/:id', requireClerkAuth, deleteConversationController);

