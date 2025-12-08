import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { webhooksRouter } from './webhooks';

const router = Router();

// Mount routes
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/webhooks', webhooksRouter);

export const v1Router = router;
