import React from 'react';
import { ApiRequestError } from '@/lib/http/define-query';
import { ErrorState } from '../../../components/ui/error-state';

interface GithubErrorViewProps {
  error: ApiRequestError;
  onRetry: () => void;
  goBack: () => void;
}

const GithubErrorView = ({ error, onRetry, goBack }: GithubErrorViewProps) => {
  return (
      <ErrorState
        error={error}
        title="Failed to fetch repositories"
        onRetry={onRetry}
        onBack={goBack}
      />
  );
};

export default GithubErrorView;
