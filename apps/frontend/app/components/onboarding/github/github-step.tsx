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

interface GitHubStepProps {
  onBack: () => void;
}

/**
 * Coordinates GitHub connection, repository loading, and analysis for onboarding.
 * Connecting redirects the browser to GitHub. Only the initial connection check
 * blocks the full viewport. Loading errors and a required reconnect show an error
 * page; other analysis errors show a toast.
 */
export function GitHubStep({ onBack }: GitHubStepProps) {
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
    retry: 1, // Retry once automatically before showing error
  });

  const {
    error: analyzeError,
    mutate: analyzeMutation,
    isPending: isAnalyzePending,
  } = useActionMutation(analyzeGithubReposAction, {
    showErrorToast: false,
    onSuccess: ({ failedRepoIds, summaries }) => {
      if (failedRepoIds.length > 0 && summaries.length > 0) {
        const failedRepoNames = githubRepos?.repositories
          .filter((repo) => failedRepoIds.includes(repo.id))
          .map((repo) => repo.full_name)
          .join(', ');
        toast.warning(
          `Analysis completed, but the following repositories failed: ${failedRepoNames}`,
          {
            timeout: 10000,
          },
        );
      } else if (failedRepoIds.length > 0 && summaries.length === 0) {
        toast.danger(
          'None of the selected repositories could be analyzed. Please reselect your repositories and try again.',
          {
            timeout: 10000,
          },
        );
      }
    },
    onError: (error) => {
      if (error.code !== ErrorCode.GITHUB_CONNECTION_REQUIRED) {
        showErrorToast(error, {
          duration:
            error.code === ErrorCode.RATE_LIMIT_EXCEEDED ? 10000 : undefined,
        });
      }
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
    analyzeMutation({ repoIds: selectedRepoIds });
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
