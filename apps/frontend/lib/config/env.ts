import { Route } from 'next';
import { z } from 'zod';

// Define the schema for environment variables
// Note: In Next.js, only NEXT_PUBLIC_ prefixed vars are available on the client
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Backend API URL (Server-only preferred)
  API_URL: z.url().optional(),

  // Clerk Authentication (Public - available on client)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),

  // Clerk Authentication (Server-only)
  CLERK_SECRET_KEY: z.string().min(1).optional(),

  // Clerk Redirect URLs (Public - available on client)
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/login'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/register'),
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z
    .string()
    .default('/dashboard'),
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z
    .string()
    .default('/dashboard'),

  // After auth redirect URLs
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/dashboard'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default('/dashboard'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL: z.string().default('/login'),

  // Backend API URL
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),

  // App URL
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

// Type for the environment
export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
const parseEnv = (): Env => {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL:
      process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL,
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:
      process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:
      process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    parsed.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });

    // In development, throw error. In production, you might want different behavior
    if (process.env.NODE_ENV === 'development') {
      throw new Error('Invalid environment variables');
    }
  }

  return parsed.data as Env;
};

// Export the validated config
export const env = parseEnv();

// Helper to check if we're on the server
export const isServer = typeof window === 'undefined';

// Export commonly used values for convenience
export const config = {
  // Environment
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  // URLs
  apiUrl: env.API_URL ?? env.NEXT_PUBLIC_API_URL,
  appUrl: env.NEXT_PUBLIC_APP_URL,

  // Auth routes (cast to Route for Next.js router compatibility)
  auth: {
    signInUrl: env.NEXT_PUBLIC_CLERK_SIGN_IN_URL as Route,
    signUpUrl: env.NEXT_PUBLIC_CLERK_SIGN_UP_URL as Route,
    afterSignInUrl: env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL as Route,
    afterSignUpUrl: env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL as Route,
    afterSignOutUrl: env.NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL as Route,
    signInFallbackUrl:
      env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL as Route,
    signUpFallbackUrl:
      env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL as Route,
  },

  // Clerk
  clerk: {
    publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
} as const;
