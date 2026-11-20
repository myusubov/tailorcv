import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { resumeGenerationQueue } from './resume-queue';

export const QUEUE_BOARD_PATH = '/admin/queues';

/**
 * Creates the Bull Board router for the job queues. The board shows job data
 * and has no login, so mount it in development only.
 */
export function createQueueBoardRouter() {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(QUEUE_BOARD_PATH);
  createBullBoard({
    queues: [new BullMQAdapter(resumeGenerationQueue)],
    serverAdapter,
  });
  return serverAdapter.getRouter();
}
