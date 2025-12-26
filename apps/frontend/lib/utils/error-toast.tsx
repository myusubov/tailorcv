"use client";

import { toast } from 'sonner';
import { ErrorCode } from 'shared';
import { ApiRequestError } from '../http/define-query';

const FRIENDLY_ERROR_MESSAGES: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.AI_GENERATION_ERROR]:
    'Our AI is currently unavailable. Please try again shortly.',
  [ErrorCode.AI_PARSE_ERROR]:
    'AI generated an invalid response. Usually, retrying fixes this!',
  [ErrorCode.AI_TIMEOUT_ERROR]:
    'The AI took too long to respond. It might be busy.',
  [ErrorCode.NETWORK_ERROR]: 'Connectivity issue. Please check your internet.',
  [ErrorCode.VALIDATION_ERROR]: 'Please fix any errors in the form.',
};

interface ShowErrorToastOptions {
  onRetry?: (data: any) => void;
  data?: any;
}

/**
 * A centralized utility to show standardized error toasts with user-friendly messages
 * and automatic 'Retry' actions for specific error codes.
 */
export function showErrorToast(
  error: { code: string; message: string } | ApiRequestError | null | undefined,
  options?: ShowErrorToastOptions,
) {
  if (!error) return;

  const code = error.code as ErrorCode;
  const friendlyMessage = FRIENDLY_ERROR_MESSAGES[code] || error.message;

  // Automatically add "Retry" button for specific errors if onRetry is provided
  const needsRetryAction =
    [
      ErrorCode.AI_TIMEOUT_ERROR,
      ErrorCode.AI_PARSE_ERROR,
      ErrorCode.NETWORK_ERROR,
    ].includes(code) && !!options?.onRetry;

  toast.error(friendlyMessage, {
    action: needsRetryAction
      ? {
          label: 'Retry',
          onClick: () => options.onRetry?.(options.data),
        }
      : undefined,
  });
}
