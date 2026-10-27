import type { Response } from 'express';
import { logger } from '../lib/logger';

/**
 * Initializes a Server-Sent Events (SSE) response
 */
export function initSseResponse(res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
}

/**
 * Formats and writes an event to the SSE stream
 */
export function writeSseEvent(res: Response, event: any): boolean {
  return res.write(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * Handles client disconnection and cleanup
 */
export function setupStreamTermination(
  req: any,
  options: {
    clerkUserId: string;
    resourceId: string;
    onTerminate: () => void;
  },
) {
  const { clerkUserId, resourceId, onTerminate } = options;

  req.on('close', () => {
    logger.info(
      { clerkUserId, resourceId },
      'Client disconnected from AI stream',
    );
    onTerminate();
  });
}
