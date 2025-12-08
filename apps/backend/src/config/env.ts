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

  // Clerk Authentication
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),

  // Anthropic AI
  ANTHROPIC_API_KEY: z.string().min(1),

  // Frontend URL (for CORS)
  FRONTEND_URL: z.url().default('http://localhost:3000'),

  // Optional: Additional configs
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
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
