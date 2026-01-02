import { z, ZodError } from 'zod';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

// Define the schema for environment variables
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform(Number).pipe(z.number().positive()).default(8080),

  // Database
  DATABASE_URL: z.url(),
  SHADOW_DATABASE_URL: z.url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Clerk Authentication
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),

  // Gemini AI
  // GEMINI_API_KEY: z.string().min(1),
  OPENAI_ONBOARDING_SYSTEM_PROMPT: z.string().min(1),

  // OpenAI AI
  OPENAI_API_KEY: z.string().min(1),

  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_REDIRECT_URI: z
    .url()
    .default('http://localhost:8080/api/v1/auth/github/callback'),

  // JWT Secret (for OAuth state signing)
  JWT_SECRET: z.string().min(32),

  // Frontend URL (for CORS)
  FRONTEND_URL: z.url().default('http://localhost:3000'),

  // Optional: Additional configs
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Admin user IDs (comma-separated Clerk user IDs)
  ADMIN_USER_IDS: z.string().optional(),

  // Dev-only auth bypass (for local testing without Clerk tokens)
  DEV_AUTH_BYPASS: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('❌ Invalid environment variables:');
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

// Export the validated config
export const env = parseEnv();

// Export the type for use in other files
export type Env = z.infer<typeof envSchema>;

// Log loaded config (without sensitive data)
if (env.NODE_ENV === 'development') {
  console.log('✅ Environment variables loaded successfully');
  console.log(`   NODE_ENV: ${env.NODE_ENV}`);
  console.log(`   PORT: ${env.PORT}`);
  console.log(`   FRONTEND_URL: ${env.FRONTEND_URL}`);
}
