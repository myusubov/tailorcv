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

    // Track if client disconnected (user clicked stop)
    let clientDisconnected = false;
    let streamController: AbortController | null = null;

    req.on('close', () => {
      clientDisconnected = true;
      // Abort the OpenAI stream immediately
      if (streamController) {
        streamController.abort();
      }
      logger.info(
        { clerkUserId, conversationId: activeConversationId },
        'Client disconnected from AI chat stream (user stopped response)',
      );
    });

    // Start streaming with the conversation's stored responseId
    const { stream, getResponseId, controller } = await streamChatResponse({
      input: message,
      previousResponseId,
      resumeContext,
    });

    // Store reference for abort
    streamController = controller;

    // Collect the full response for saving
    let fullResponse = '';

    // Stream text chunks to client
    try {
      for await (const chunk of stream) {
        fullResponse += chunk;

        // Try to write the chunk - if it fails, client disconnected
        const writeSuccessful = res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);

        if (!writeSuccessful || res.writableEnded) {
          // Client disconnected (user clicked stop)
          clientDisconnected = true;
          logger.info(
            { clerkUserId, conversationId: activeConversationId, partialLength: fullResponse.length },
            'Client disconnected mid-stream, aborting OpenAI request',
          );
          // Abort the OpenAI stream immediately
          if (streamController) {
            streamController.abort();
          }
          break;
        }
      }
    } catch (streamError) {
      // If stream breaks (OpenAI error, abort, network issue), log and save what we got
      clientDisconnected = (streamError as Error).name === 'AbortError';
      logger.warn(
        { err: streamError, clerkUserId, conversationId: activeConversationId, partialLength: fullResponse.length },
        'Stream interrupted during iteration',
      );
    }

    // Get the new responseId from OpenAI (or null if stream broke early)
    const newResponseId = await getResponseId().catch(() => null);

    // Save partial response even if user stopped mid-stream
    if (fullResponse.length > 0) {
      const savePromises: Promise<unknown>[] = [
        addMessage({
          conversationId: activeConversationId,
          clerkUserId,
          role: 'assistant',
          content: fullResponse,
        }),
      ];

      // Only update responseId if we got one (stream completed normally)
      if (newResponseId) {
        savePromises.push(
          updateConversationResponseId({
            conversationId: activeConversationId,
            clerkUserId,
            responseId: newResponseId,
          }),
        );
      }

      // Mark as completed in idempotency layer
      if (res.markIdempotentCompleted) {
        savePromises.push(res.markIdempotentCompleted());
      }

      await Promise.all(savePromises);
    }

    // Send final event only if client is still connected
    if (!clientDisconnected) {
      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          responseId: newResponseId,
          conversationId: activeConversationId,
        })}\n\n`,
      );
    }

    res.end();

    logger.info(
      {
        clerkUserId,
        conversationId: activeConversationId,
        newResponseId,
        wasAborted: clientDisconnected,
        responseLength: fullResponse.length,
      },
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