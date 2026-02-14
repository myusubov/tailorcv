import type { NextFunction, Request, Response } from 'express';
import type { ClerkLocals } from '../types/locals';
import type { ChatRequestBody, AIChatStreamEvent } from '../types/ai-chat';
import { streamChatResponse } from '../services/ai-chat.service';
import {
  getConversationWithMessages,
  addMessage,
  updateConversationResponseId,
  createConversation,
  ensureChatSession,
  saveAssistantResponse,
} from '../services/chat-conversations.service';

import { logger } from '../lib/logger';
import { handleResilienceError } from '../lib/resilience';
import { initSseResponse, setupStreamTermination, writeSseEvent } from 'src/utils/ai-stream-sse';

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
    const { conversationId: requestedId, message, resumeContext, assistantMessageId } = req.body;

    // 1. Idempotency Check
    if (req.isIdempotentReplay) {
      initSseResponse(res);
      writeSseEvent(res, { type: 'text', content: 'Replaying processed request.' });
      writeSseEvent(res, { type: 'done' });
      return res.end();
    }

    // 2. Orchestrate Conversation
    const { activeConversationId, previousResponseId } = await ensureChatSession({
      clerkUserId,
      conversationId: requestedId,
      initialMessage: message
    });

    await addMessage({
      conversationId: activeConversationId,
      clerkUserId,
      role: 'user',
      content: message,
    });

    // 3. Initialize SSE
    initSseResponse(res);
    let streamController: AbortController | null = null;
    let wasAborted = false;

    setupStreamTermination(req, {
      clerkUserId,
      conversationId: activeConversationId,
      onTerminate: () => {
        wasAborted = true;
        streamController?.abort();
      }
    });

    // 4. Start AI Stream
    const { stream, getResponseId, controller } = await streamChatResponse({
      input: message,
      previousResponseId,
      resumeContext,
    });
    streamController = controller;

    // 5. Accumulate and Relay
    let accumulatedText = '';
    let lastProposal: (AIChatStreamEvent & { type: 'proposal' }) | null = null;

    try {
      for await (const event of stream) {
        if (event.type === 'text') accumulatedText += event.content;
        else if (event.type === 'proposal') lastProposal = event;

        if (!writeSseEvent(res, event) || wasAborted) {
          wasAborted = true;
          streamController.abort();
          break;
        }
      }
    } catch (err) {
      wasAborted = (err as Error).name === 'AbortError';
      logger.warn({ err, conversationId: activeConversationId }, 'Stream iteration interrupted');
    }

    // 6. Finalize & Persist
    const finalResponseId = await getResponseId().catch(() => null);

    if (accumulatedText || lastProposal) {
      await saveAssistantResponse({
        conversationId: activeConversationId,
        clerkUserId,
        responseId: finalResponseId,
        id: assistantMessageId,
        content: lastProposal ? lastProposal.explanation : accumulatedText,
        metadata: lastProposal ? {
          type: 'proposal',
          proposal: lastProposal.data,
          explanation: lastProposal.explanation,
        } : undefined,
        markIdempotentCompleted: res.markIdempotentCompleted
      });
    }

    if (!wasAborted) {
      writeSseEvent(res, {
        type: 'done',
        responseId: finalResponseId,
        conversationId: activeConversationId,
      });
    }

    res.end();
  } catch (err) {
    const appError = handleResilienceError(err, 'AI Chat');
    logger.error({ err, errorCode: appError.errorCode }, 'AI chat error');

    if (!res.headersSent) next(appError);
    else {
      writeSseEvent(res, { type: 'error', message: appError.message, code: appError.errorCode });
      res.end();
    }
  }
};