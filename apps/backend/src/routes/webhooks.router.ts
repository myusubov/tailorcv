import { Router } from 'express';
import { verifyWebhook } from '@clerk/express/webhooks';
import type { WebhookEvent } from '@clerk/express/webhooks';

import { env } from '../config/env';
import { handleClerkUserWebhook } from '../utils/clerk';

export const webhooksRouter = Router();

webhooksRouter.post('/clerk', async (req, res) => {
  try {
    const evt = (await verifyWebhook(req, {
      signingSecret: env.CLERK_WEBHOOK_SECRET,
    })) as WebhookEvent;

    await handleClerkUserWebhook(evt);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Clerk webhook verification failed', error);
    return res
      .status(400)
      .json({ success: false, message: 'Webhook verification failed' });
  }
});
