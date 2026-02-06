import { ClerkLocals } from './locals';

declare global {
  namespace Express {
    interface Request {
      isIdempotentReplay?: boolean;
    }
    interface Response {
      locals: ClerkLocals;
      markIdempotentCompleted?: () => Promise<void>;
    }
  }
}

export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
