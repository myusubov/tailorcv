import { isClerkAPIResponseError } from '@clerk/shared/error';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

type ClerkFlowError = {
  clerkError?: boolean;
  message?: string;
  longMessage?: string;
};

function isClerkFlowError(error: unknown): error is ClerkFlowError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'clerkError' in error &&
    'message' in error
  );
}

export function getClerkErrorMessage(error: unknown): string {
  // Check if it's a Clerk API Response Error
  if (isClerkAPIResponseError(error)) {
    // Access the first error message from the errors array
    if (error.errors && error.errors.length > 0) {
      if (error.errors[0].code === 'form_code_incorrect') {
        return 'The verification code you entered is incorrect. Please check your email and try again.';
      }
      return error.errors[0].longMessage || error.errors[0].message;
    }
  }

  if (isClerkFlowError(error)) {
    return (
      error.longMessage ||
      error.message ||
      'Something went wrong. Please try again.'
    );
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
