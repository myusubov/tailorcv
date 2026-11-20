import { GoogleGenAI } from '@google/genai';

import { env } from '../config/env';

// Retries here repeat only the Gemini call, not the GitHub analysis a job retry
// repeats. Few attempts and a short maximum delay keep the wait and quota use small.
export const geminiClient = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
  httpOptions: {
    timeout: 60_000,
    retryOptions: { attempts: 3, initialDelay: 2, maxDelay: 10 },
  },
});