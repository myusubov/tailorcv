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

interface GitHubStepProps {
  onBack: () => void;
}

export function GitHubStep({ onBack }: GitHubStepProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const {
    data: githubConnection,
    isLoading: isLoadingConnection,
    error: connectionError,
  } = useGithubConnectionQuery();

  const { data: githubRepos, isLoading: isLoadingRepos } =
    useGithubReposQuery();

  // Handle URL status parameters from OAuth callback
  useEffect(() => {
    const url = new URL(window.location.href);
    const status = url.searchParams.get('status');
    const message = url.searchParams.get('message');

    if (status === 'connected') {
      toast.success('GitHub connected successfully');
    } else if (status === 'error') {
      toast.error(message || 'Failed to connect to GitHub');
    }

    // Clean up ONLY status and message parameters after handling
    if (status) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('status');
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, '', newUrl.pathname + newUrl.search);
    }
  }, []);

  const handleConnect = () => {
    setIsConnecting(true);
    window.location.href = `${env.NEXT_PUBLIC_API_URL}/api/v1/auth/github`;
  };

  const handleAnalyze = (selectedRepoIds: number[]) => {
    // TODO: Implement the analyze action
    console.log('Analyzing repos:', selectedRepoIds);
    toast.info(
      `Starting analysis of ${selectedRepoIds.length} repositories...`,
    );
  };

  // Show loading state while checking connection status
  if (isLoadingConnection) {
    return <GitHubLoadingView />;
  }

  // If connected and we have repos, show the selection view
  // Note: connectionError with 404/502 means no connection found
  if (githubConnection && !connectionError) {
    if (isLoadingRepos || !githubRepos) {
      return <GitHubLoadingView />;
    }

    return (
      <GitHubRepoSelectionView
        repos={githubRepos}
        connection={githubConnection}
        onBack={onBack}
        onAnalyze={handleAnalyze}
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
