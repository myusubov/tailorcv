import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { ErrorCode } from 'shared';

import { ApiResult } from '@/lib/api';
import { showErrorToast } from '@/lib/utils/error-toast';

export class ActionError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: ErrorCode,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'ActionError';
  }
}

/**
 * A centralized hook to handle mutations for server actions defined via `defineAction`.
 */
export function useActionMutation<TInput, TOutput>(
  action: (input: TInput) => Promise<ApiResult<TOutput>>,
  options?: UseMutationOptions<TOutput, ActionError, TInput> & {
    successMessage?: string | ((data: TOutput) => string);
    showErrorToast?: boolean;
    form?: UseFormReturn<any>;
  },
) {
  const showToast = options?.showErrorToast !== false;

  const mutation = useMutation({
    ...options,
    mutationFn: async (input: TInput) => {
      const result = await action(input);

      if (!result.ok) {
        throw new ActionError(
          result.error.message,
          result.error.code,
          result.error.details,
        );
      }

      return result.data;
    },
    onSuccess: (data: TOutput, variables: TInput, context: unknown) => {
      if (options?.successMessage) {
        const message =
          typeof options.successMessage === 'function'
            ? options.successMessage(data)
            : options.successMessage;
        toast.success(message);
      }
      // @ts-ignore
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error: ActionError, variables: TInput, context: unknown) => {
      // 1. Automatic Validation Mapping
      if (
        error.code === ErrorCode.VALIDATION_ERROR &&
        options?.form &&
        Array.isArray(error.details)
      ) {
        error.details.forEach((issue: any) => {
          const fieldName = issue.path.join('.');
          options.form?.setError(fieldName, {
            type: 'server',
            message: issue.message,
          });
        });
      }

      // 2. Specialized Toast logic via centralized utility
      if (showToast) {
        showErrorToast(error, {
          onRetry: () => mutation.mutate(variables),
          data: variables,
        });
      }

      // 3. Component-level callback
      // @ts-ignore
      options?.onError?.(error, variables, context);
    },
  });

  return mutation;
}

