import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { clerkMiddleware, requireAuth } from '@clerk/express';
import { v1Router } from './routes';
import { env } from './config/env';
import { errorHandler } from './middleware/error';
import { AppError } from './utils/AppError';
import { ErrorCode } from 'shared';

dotenv.config();

const app = express();
const PORT = env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

// Routes
app.use('/api/v1', v1Router);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TailorCV Backend API',
    version: '0.1.0',
    // endpoints: {
    //   health: '/health',
    // },
  });
});

// 404 handler
app.use((req, res, next) => {
  next(
    new AppError(`Cannot ${req.method} ${req.path}`, ErrorCode.NOT_FOUND, 404),
  );
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});
