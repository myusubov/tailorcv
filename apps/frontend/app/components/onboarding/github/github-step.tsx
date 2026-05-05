'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  useGithubConnectionQuery,
  useGithubReposQuery,
} from '@/lib/http/github-client';
import { GitHubConnectView } from './github-connect-view';
import { GitHubLoadingView } from './github-loading-view';
import { GitHubRepoSelectionView } from './github-repo-selection-view';
import { env } from '@/lib/config';
import { useQueryStates, parseAsString } from 'nuqs';
import GithubErrorView from './github-error-view';

interface GitHubStepProps {
  onBack: () => void;
}

export function GitHubStep({ onBack }: GitHubStepProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle OAuth search params using nuqs
  const [oauthParams, setOauthParams] = useQueryStates(
    {
      status: parseAsString,
      message: parseAsString,
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

  // Show toasts and clear params immediately after mount
  useEffect(() => {
    if (oauthParams.status) {
      if (oauthParams.status === 'connected') {
        toast.success('GitHub connected successfully');
      } else if (oauthParams.status === 'error') {
        toast.error('Failed to connect to GitHub');
      }

      // Atomic cleanup using nuqs
      setOauthParams({ status: null, message: null });
    }
  }, [oauthParams, setOauthParams]);

  const handleConnect = () => {
    setIsConnecting(true);
    window.location.href = `${env.NEXT_PUBLIC_API_URL}/api/v1/auth/github`;
  };

  const handleAnalyze = (selectedRepoIds: number[]) => {
    toast.info(
      `GitHub analysis is not implemented yet. ${selectedRepoIds.length} ${selectedRepoIds.length === 1 ? 'repository' : 'repositories'
      } selected.`,
    );
  };

  // Show loading state while checking connection status
  if (isLoadingConnection) {
    return <GitHubLoadingView />;
  }

  // If connected and we have repos, show the selection view
  // Note: connectionError with 404/502 means no connection found
  if (githubConnection && !connectionError) {
    if (reposError) {
      return (
        <GithubErrorView
          error={reposError}
          onRetry={() => refetchRepos()}
          goBack={onBack}
        />
      );
    }

    return (
      <GitHubRepoSelectionView
        repos={githubRepos ?? []}
        connection={githubConnection}
        onBack={onBack}
        onAnalyze={handleAnalyze}
        isLoading={false}
        isReposLoading={isLoadingRepos}
      />
    );
  }

  // Show connect view if not connected
  return (
    <GitHubConnectView
      isConnecting={isConnecting}
      onConnect={handleConnect}
      onBack={onBack}
    />
  );
}
