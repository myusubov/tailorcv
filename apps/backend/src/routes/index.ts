import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';

const router = Router();

// Mount routes
router.use('/health', healthRouter);
router.use('/auth', authRouter);

export const v1Router = router;
