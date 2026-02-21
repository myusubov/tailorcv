import type { NextFunction, Request, Response } from 'express';
import type { ClerkLocals } from '../types/locals';
import { successResponse } from '../utils/response';
import {
    listConversations,
    getConversationWithMessages,
    createConversation,
    deleteConversation,
    updateMessageStatus,
} from '../services/chat-conversations.service';

/**
 * GET /api/v1/ai/chat/conversations
 * Lists all conversations for the authenticated user
 */
export const listConversationsController = async (
    _req: Request,
    res: Response<unknown, ClerkLocals>,
    next: NextFunction,
) => {
    try {
        const { clerkUserId } = res.locals;
        const conversations = await listConversations(clerkUserId);
        return successResponse(res, conversations, 200);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/v1/ai/chat/conversations/:id
 * Gets a single conversation with all messages
 */
export const getConversationController = async (
    req: Request<{ id: string }>,
    res: Response<unknown, ClerkLocals>,
    next: NextFunction,
) => {
    try {
        const { clerkUserId } = res.locals;
        const conversation = await getConversationWithMessages(
            req.params.id,
            clerkUserId,
        );
        return successResponse(res, conversation, 200);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/v1/ai/chat/conversations
 * Creates a new conversation
 */
export const createConversationController = async (
    req: Request<unknown, unknown, { title?: string }>,
    res: Response<unknown, ClerkLocals>,
    next: NextFunction,
) => {
    try {
        const { clerkUserId } = res.locals;
        const conversation = await createConversation({
            clerkUserId,
            title: req.body.title,
        });
        return successResponse(res, conversation, 201);
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/v1/ai/chat/conversations/:id
 * Deletes a conversation and all its messages
 */
export const deleteConversationController = async (
    req: Request<{ id: string }>,
    res: Response<unknown, ClerkLocals>,
    next: NextFunction,
) => {
    try {
        const { clerkUserId } = res.locals;
        await deleteConversation({ id: req.params.id, clerkUserId });
        return successResponse(res, null, 204);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/v1/ai/chat/messages/:id/status
 * Updates the status of a message
 */
export const patchMessageStatusController = async (
    req: Request<{ id: string }, unknown, { status: 'applied' | 'discarded' }>,
    res: Response<unknown, ClerkLocals>,
    next: NextFunction,
) => {
    try {
        const { clerkUserId } = res.locals;
        await updateMessageStatus({
            messageId: req.params.id,
            clerkUserId,
            status: req.body.status,
        });
        return successResponse(res, { success: true }, 200);
    } catch (err) {
        next(err);
    }
};
