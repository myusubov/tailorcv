import { Router } from 'express';
import { verifyWebhook } from '@clerk/express/webhooks';
import type { WebhookEvent } from '@clerk/express/webhooks';

import { env } from '../config/env';
import { handleClerkUserWebhook } from '../utils/clerk';
import { logger } from '../lib/logger';

export const webhooksRouter = Router();

webhooksRouter.post('/clerk', async (req, res) => {
  logger.info({ bodyType: typeof req.body, hasBody: req.body !== undefined }, 'Clerk webhook received');

  try {
    const evt = (await verifyWebhook(req, {
      signingSecret: env.CLERK_WEBHOOK_SECRET,
    })) as WebhookEvent;

    logger.info({ eventType: evt.type }, 'Clerk webhook verified');

    await handleClerkUserWebhook(evt);

    logger.info({ eventType: evt.type }, 'Clerk webhook processed');
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ err: error instanceof Error ? { message: error.message, stack: error.stack } : error }, 'Clerk webhook failed');
    return res
      .status(400)
      .json({ success: false, message: 'Webhook processing failed' });
  }
});
