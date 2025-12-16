import { isClerkAPIResponseError } from '@clerk/shared/error';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export function getClerkErrorMessage(error: unknown): string {
  // Check if it's a Clerk API Response Error
  if (isClerkAPIResponseError(error)) {
    // Access the first error message from the errors array
    if (error.errors && error.errors.length > 0) {
      return error.errors[0].message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

export function handleClerkError(error: unknown) {
  const message = getClerkErrorMessage(error);
  toast.error(message);
  return message;
}

export function generateUUID() {
  return uuidv4();
}