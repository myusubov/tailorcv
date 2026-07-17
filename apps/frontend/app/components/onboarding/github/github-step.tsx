'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  useGithubConnectionQuery,
  useGithubReposQuery,
} from '@/lib/http/github-client';
import { analyzeGithubReposAction } from '@/lib/actions/github.actions';
import { useActionMutation } from '@/lib/hooks/use-action-mutation';
import { GlobalLoading } from '@/app/components/ui/global-loading';
import { GitHubConnectView } from './github-connect-view';
import { GitHubRepoSelectionView } from './github-repo-selection-view';
import { env } from '@/lib/config';
import { useQueryStates, parseAsString } from 'nuqs';
import GithubErrorView from './github-error-view';

interface GitHubStepProps {
  onBack: () => void;
}

/**
 * Coordinates GitHub connection, repository loading, and repository analysis.
 *
 * The component accepts the parent flow's back handler and returns the view for
 * the current GitHub onboarding state. It performs query, OAuth redirect, toast,
 * and analysis-mutation side effects; only the initial connection check blocks
 * the full viewport, while repository loading remains progressive.
 */
export function GitHubStep({ onBack }: GitHubStepProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const analyzeMutation = useActionMutation(analyzeGithubReposAction, {
    showErrorToast: true,
    onSuccess: (data) => {
      console.log({ data })
    }
  });

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
    analyzeMutation.mutate(selectedRepoIds);
  };

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
        isLoading={analyzeMutation.isPending}
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
