import React from 'react';
import { AlertCircle, ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '@heroui/react';
import { ApiRequestError } from '@/lib/http/define-query';
import { retrieveErrorMessage } from '@/lib/utils/error-toast';

interface ErrorStateProps {
  error?: { code: string; message: string } | ApiRequestError | null;
  title?: string;
  description?: string;
  onRetry?: () => void;
  onBack?: () => void;
  retryLabel?: string;
  backLabel?: string;
  className?: string;
}

export const ErrorState = ({
  error,
  title = 'Something went wrong',
  description,
  onRetry,
  onBack,
  retryLabel = 'Try Again',
  backLabel = 'Go Back',
  className = '',
}: ErrorStateProps) => {
  const errorMessage = description || (error ? retrieveErrorMessage(error) : null);

  return (
    <div className={`animate-in fade-in zoom-in flex flex-col items-center justify-center px-4 py-12 text-center duration-300 ${className}`}>
      <div className="bg-destructive/10 mb-6 rounded-full p-4">
        <AlertCircle className="text-destructive size-12" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">
        {title}
      </h3>
      {errorMessage && (
        <p className="text-muted mb-8 max-w-md">
          {errorMessage}
        </p>
      )}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="size-4" />
            {backLabel}
          </Button>
        )}
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            <RefreshCcw className="size-4" />
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
