'use client';

import { useEffect, useRef } from 'react';
import { toast } from '@heroui/react';
import {
  useGithubConnectionQuery,
  useGithubReposQuery,
} from '@/lib/http/github-client';
import {
  analyzeGithubReposAction,
  initiateGithubAuthAction,
} from '@/lib/actions/github.actions';
import { useActionMutation } from '@/lib/hooks/use-action-mutation';
import { showErrorToast } from '@/lib/utils/error-toast';
import { GlobalLoading } from '@/app/components/ui/global-loading';
import { GitHubConnectView } from './github-connect-view';
import { GitHubRepoSelectionView } from './github-repo-selection-view';
import { useQueryStates, parseAsString } from 'nuqs';
import { ErrorState } from '@/app/components/ui/error-state';
import { ErrorCode } from 'shared';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config';

interface GitHubStepProps {
  onBack: () => void;
}

/**
 * Coordinates GitHub connection, repository loading, and resume creation for onboarding.
 * Only the initial connection check blocks the viewport; a created resume navigates to
 * its page. Loading errors and a required reconnect show an error page; other creation
 * errors show a toast, except an expired session, which the query provider redirects.
 */
export function GitHubStep({ onBack }: GitHubStepProps) {
  const router = useRouter();

  // A retry of the same selection must reuse the key so the backend can
  // recognise it; a different selection is a new attempt with a new key.
  const lastAttemptRef = useRef<{ key: string; repoIds: number[] }>({
    key: crypto.randomUUID(),
    repoIds: [],
  });

  const connectMutation = useActionMutation(initiateGithubAuthAction, {
    showErrorToast: true,
    onSuccess: ({ authUrl }) => {
      if (authUrl) {
        window.location.href = authUrl;
      }
    },
  });

  // Handle OAuth search params using nuqs
  const [oauthParams, setOauthParams] = useQueryStates(
    {
      status: parseAsString,
    },
    {
      history: 'replace',
      shallow: true,
    },
  );

  const {
    data: githubConnection,
    isLoading: isLoadingConnection,
    error: connectionError,
  } = useGithubConnectionQuery();

  const {
    data: githubRepos,
    isLoading: isLoadingRepos,
    error: reposError,
    refetch: refetchRepos,
  } = useGithubReposQuery(undefined, {
    enabled: !!githubConnection && !connectionError,
    retry: (failureCount, error) =>
      failureCount < 1 && (error.status >= 500 || error.status === 0),
  });

  const {
    error: analyzeError,
    mutate: analyzeMutation,
    isPending: isAnalyzePending,
  } = useActionMutation(analyzeGithubReposAction, {
    showErrorToast: false,
    onSuccess: ({ id }) => {
      router.push(`${ROUTES.RESUMES}/${id}`);
    },
    onError: (error) => {
      if (
        error.code === ErrorCode.GITHUB_CONNECTION_REQUIRED ||
        error.code === ErrorCode.UNAUTHORIZED
      ) {
        return;
      }

      // The global validation message talks about a form this step doesn't have.
      const isRequestRejected =
        error.code === ErrorCode.VALIDATION_ERROR ||
        error.code === ErrorCode.BAD_REQUEST;

      showErrorToast(
        isRequestRejected
          ? { code: ErrorCode.INTERNAL_ERROR, message: error.message }
          : error,
        {
          duration:
            error.code === ErrorCode.RATE_LIMIT_EXCEEDED ? 10000 : undefined,
        },
      );
    },
  });

  const hasHandledOauthStatus = useRef(false);
  useEffect(() => {
    if (oauthParams.status && !hasHandledOauthStatus.current) {
      hasHandledOauthStatus.current = true;

      if (oauthParams.status === 'connected') {
        toast.success('GitHub connected successfully');
      } else if (oauthParams.status === 'error') {
        toast.danger('Failed to connect to GitHub');
      }

      // Atomic cleanup using nuqs
      setOauthParams({ status: null });
    }
  }, [oauthParams, setOauthParams]);

  const handleConnect = () => {
    connectMutation.mutate();
  };

  const handleAnalyze = (selectedRepoIds: number[]) => {
    const lastAttempt = lastAttemptRef.current;
    const isNewAttempt =
      selectedRepoIds.length !== lastAttempt.repoIds.length ||
      selectedRepoIds.some((id) => !lastAttempt.repoIds.includes(id));

    if (isNewAttempt) {
      lastAttemptRef.current = {
        key: crypto.randomUUID(),
        repoIds: selectedRepoIds,
      };
    }

    analyzeMutation({
      repoIds: selectedRepoIds,
      idempotencyKey: lastAttemptRef.current.key,
    });
  };

  const renderReconnectErrorState = (error: {
    code: string;
    message: string;
  }) => (
    <ErrorState
      error={error}
      title="Reconnect your GitHub account"
      onRetry={handleConnect}
      retryLabel="Reconnect GitHub"
      onBack={onBack}
    />
  );

  // Show loading state while checking connection status
  if (isLoadingConnection) {
    return (
      <GlobalLoading
        title="Checking your GitHub connection"
        description="This should only take a moment."
      />
    );
  }

  // If connected and we have repos, show the selection view
  // Note: connectionError with 404/502 means no connection found
  if (githubConnection && !connectionError) {
    if (reposError) {
      // Only the account owner can unsuspend the app, so no retry or reconnect.
      if (reposError.code === ErrorCode.GITHUB_APP_SUSPENDED) {
        return (
          <ErrorState
            error={reposError}
            title="GitHub app is suspended"
            onBack={onBack}
          />
        );
      }

      if (reposError.code === ErrorCode.GITHUB_CONNECTION_REQUIRED) {
        return renderReconnectErrorState(reposError);
      }

      return (
        <ErrorState
          error={reposError}
          title="Failed to fetch repositories"
          onRetry={() => refetchRepos()}
          onBack={onBack}
        />
      );
    }

    if (analyzeError?.code === ErrorCode.GITHUB_CONNECTION_REQUIRED) {
      return renderReconnectErrorState(analyzeError);
    }

    return (
      <GitHubRepoSelectionView
        repos={githubRepos ?? { total_count: 0, repositories: [] }}
        onBack={onBack}
        onAnalyze={handleAnalyze}
        isLoading={isAnalyzePending}
        isReposLoading={isLoadingRepos}
      />
    );
  }

  // Show connect view if not connected
  return (
    <GitHubConnectView
      isConnecting={connectMutation.isPending}
      onConnect={handleConnect}
      onBack={onBack}
    />
  );
}
