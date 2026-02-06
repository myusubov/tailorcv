import type { NextFunction, Request, Response } from 'express';
import type { ClerkLocals } from '../types/locals';
import type { ChatRequestBody } from '../types/ai-chat';
import { streamChatResponse } from '../services/ai-chat.service';
import {
  getConversationWithMessages,
  addMessage,
  updateConversationResponseId,
  createConversation,
} from '../services/chat-conversations.service';

import { logger } from '../lib/logger';
import { handleResilienceError } from '../lib/resilience';

/**
 * Handles POST /api/v1/ai/chat
 * Streams AI responses using Server-Sent Events (SSE)
 * Saves messages to the database for persistence
 */
export const postChatMessage = async (
  req: Request<unknown, unknown, ChatRequestBody>,
  res: Response<unknown, ClerkLocals>,
  next: NextFunction,
) => {
  try {
    const { clerkUserId } = res.locals;
    const { conversationId: requestedId, message, resumeContext } = req.body;

    let activeConversationId = requestedId;
    let previousResponseId: string | null = null;

    logger.info(
      { clerkUserId, conversationId: requestedId, hasResumeContext: !!resumeContext },
      'AI chat request received',
    );

    // Handle idempotent replay
    if (req.isIdempotentReplay) {
      logger.info({ clerkUserId, conversationId: requestedId }, 'Replaying idempotent chat request');
      // For now, we'll just return a success message indicating it was already processed.
      // In a more advanced version, we could fetch the last message from the DB and stream it back.
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(`data: ${JSON.stringify({ type: 'text', content: 'This request was already processed successfully.' })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      return res.end();
    }

    if (!activeConversationId) {
      // Create a new conversation if none provided
      const conversation = await createConversation({
        clerkUserId,
        title: message.slice(0, 100),
      });
      activeConversationId = conversation.id;
      logger.info(
        { clerkUserId, conversationId: activeConversationId },
        'Created new conversation for chat session',
      );
    } else {
      // Verify existing conversation
      const conversation = await getConversationWithMessages(
        activeConversationId,
        clerkUserId,
      );
      previousResponseId = conversation.responseId;
    }

    // Save user message to DB
    await addMessage({
      conversationId: activeConversationId,
      clerkUserId,
      role: 'user',
      content: message,
    });

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // Start streaming with the conversation's stored responseId
    const { stream, getResponseId } = await streamChatResponse({
      input: message,
      previousResponseId,
      resumeContext,
    });

    // Collect the full response for saving
    let fullResponse = '';

    // Stream text chunks to client
    for await (const chunk of stream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
    }

    // Get the new responseId from OpenAI
    const newResponseId = await getResponseId();

    // Parallelize: Save assistant message AND update conversation responseId
    await Promise.all([
      addMessage({
        conversationId: activeConversationId,
        clerkUserId,
        role: 'assistant',
        content: fullResponse,
      }),
      updateConversationResponseId({
        conversationId: activeConversationId,
        clerkUserId,
        responseId: newResponseId,
      }),
      // Mark as completed in idempotency layer
      res.markIdempotentCompleted?.(),
    ]);

    // Send final event
    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        responseId: newResponseId,
        conversationId: activeConversationId,
      })}\n\n`,
    );
    res.end();

    logger.info(
      { clerkUserId, conversationId: activeConversationId, newResponseId },
      'AI chat response completed',
    );
  } catch (err) {
    const appError = handleResilienceError(err, 'AI Chat');
    logger.error({ err, errorCode: appError.errorCode }, 'AI chat error');

    if (!res.headersSent) {
      next(appError);
    } else {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: appError.message,
          code: appError.errorCode,
        })}\n\n`,
      );
      res.end();
    }
  }
};