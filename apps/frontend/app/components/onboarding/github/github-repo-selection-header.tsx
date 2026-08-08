'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { GitHubConnectionResponse } from 'shared';

interface GitHubRepoSelectionHeaderProps {
  connection: GitHubConnectionResponse;
  repositoryCount: number;
  maxRepos: number;
  isRepositoryCountLoading?: boolean;
}

/**
 * Renders the connected GitHub account identity and repo-picker guidance.
 */
export function GitHubRepoSelectionHeader({
  connection,
  repositoryCount,
  maxRepos,
  isRepositoryCountLoading,
}: GitHubRepoSelectionHeaderProps) {
  const avatarUrl = connection.githubAvatarUrl?.trim();
  const avatarInitial =
    connection.githubUsername.trim().charAt(0).toUpperCase() || '?';

  return (
    <header className="mb-8 text-center">
      <motion.div
        className="mb-4 flex items-center justify-center gap-3"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={connection.githubUsername}
            width={48}
            height={48}
            quality={100}
            priority
            className="ring-accent/20 size-12 rounded-full ring-2"
          />
        ) : (
          <div className="bg-surface-secondary ring-accent/20 text-muted flex size-12 items-center justify-center rounded-full text-sm font-semibold ring-2">
            {avatarInitial}
          </div>
        )}
        <div className="text-left">
          <p className="text-foreground font-semibold">
            Connected as{' '}
            <a
              href={`https://github.com/${connection.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              @{connection.githubUsername}
            </a>
          </p>
          {isRepositoryCountLoading ? (
            <div className="bg-surface-secondary mt-1 h-3 w-32 animate-pulse rounded-full" />
          ) : (
            <p className="text-muted text-sm">
              {repositoryCount} repositories found
            </p>
          )}
        </div>
      </motion.div>

      <motion.h1
        className="text-foreground mb-2 text-2xl font-bold tracking-tight sm:text-3xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Choose repositories to analyze
      </motion.h1>
      <motion.p
        className="text-muted mx-auto max-w-lg text-sm text-balance"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Pick up to {maxRepos} repositories that best represent your engineering
        work.
      </motion.p>
    </header>
  );
}
