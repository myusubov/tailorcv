'use client';

import { motion } from 'framer-motion';
import { parseAsString, useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';
import type { GitHubConnection, GitHubRepo } from 'shared';
import { GitHubRepoCard } from './github-repo-card';
import { GitHubRepoGridSkeleton } from './github-repo-grid-skeleton';
import { GitHubRepoSelectionActions } from './github-repo-selection-actions';
import { GitHubRepoSelectionEmptyState } from './github-repo-selection-empty-state';
import { GitHubRepoSelectionHeader } from './github-repo-selection-header';
import { GitHubRepoSelectionToolbar } from './github-repo-selection-toolbar';

const MAX_REPOS = 3;

interface GitHubRepoSelectionViewProps {
  repos: GitHubRepo[];
  connection: GitHubConnection;
  onBack: () => void;
  onAnalyze: (selectedRepoIds: number[]) => void;
  isLoading?: boolean;
  isReposLoading?: boolean;
}

interface ToggleRepoInput {
  repoId: number;
}

/**
 * Coordinates GitHub repository search, selection state, and repo analysis handoff.
 */
export function GitHubRepoSelectionView({
  repos,
  connection,
  onBack,
  onAnalyze,
  isLoading,
  isReposLoading,
}: GitHubRepoSelectionViewProps) {
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    parseAsString.withDefault('').withOptions({
      history: 'replace',
      shallow: true,
    }),
  );

  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return repos;
    const query = searchQuery.toLowerCase();
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.language?.toLowerCase().includes(query),
    );
  }, [repos, searchQuery]);

  const toggleRepo = ({ repoId }: ToggleRepoInput) => {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repoId)) {
        next.delete(repoId);
      } else if (next.size < MAX_REPOS) {
        next.add(repoId);
      }
      return next;
    });
  };

  const handleAnalyze = () => {
    onAnalyze(Array.from(selectedRepos));
  };

  const clearSelection = () => {
    setSelectedRepos(new Set());
  };

  return (
    <div className="flex min-h-[60vh] flex-col">
      <motion.div
        className="mx-auto w-full max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GitHubRepoSelectionHeader
          connection={connection}
          repositoryCount={repos.length}
          maxRepos={MAX_REPOS}
          isRepositoryCountLoading={isReposLoading}
        />

        <GitHubRepoSelectionToolbar
          searchQuery={searchQuery}
          selectedCount={selectedRepos.size}
          maxRepos={MAX_REPOS}
          onSearchChange={setSearchQuery}
          onClearSelection={clearSelection}
        />

        {isReposLoading ? (
          <GitHubRepoGridSkeleton />
        ) : (
          <motion.div
            className="mb-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {filteredRepos.map((repo) => {
              const isSelected = selectedRepos.has(repo.id);
              const isDisabled =
                !isSelected && selectedRepos.size >= MAX_REPOS;

              return (
                <GitHubRepoCard
                  key={repo.id}
                  repo={repo}
                  isSelected={isSelected}
                  isDisabled={isDisabled}
                  onToggle={() => toggleRepo({ repoId: repo.id })}
                />
              );
            })}

            {filteredRepos.length === 0 && <GitHubRepoSelectionEmptyState />}
          </motion.div>
        )}

        <GitHubRepoSelectionActions
          selectedCount={selectedRepos.size}
          isLoading={isLoading}
          onBack={onBack}
          onAnalyze={handleAnalyze}
        />
      </motion.div>
    </div>
  );
}
