'use client';

import { motion } from 'framer-motion';
import { parseAsString, useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';
import type { GitHubConnectionResponse, GitHubRepo } from 'shared';
import { GitHubRepoSelectionActions } from './github-repo-selection-actions';
import { GitHubRepoSelectionHeader } from './github-repo-selection-header';
import { GitHubRepoSelectionResults } from './github-repo-selection-results';
import { GitHubRepoSelectionToolbar } from './github-repo-selection-toolbar';

const MAX_REPOS = 3;

interface GitHubRepoSelectionViewProps {
  repos: GitHubRepo[];
  connection: GitHubConnectionResponse;
  onBack: () => void;
  onAnalyze: (selectedRepoIds: number[]) => void;
  isLoading?: boolean;
  isReposLoading: boolean;
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

  const toggleRepo = (repoId: number) => {
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
    <div className="flex max-h-dvh min-h-0 flex-col py-8">
      <motion.div
        className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="shrink-0 px-4 sm:px-6">
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
        </div>
        <GitHubRepoSelectionResults
          isReposLoading={isReposLoading}
          repos={filteredRepos}
          selectedRepos={selectedRepos}
          onToggleRepo={toggleRepo}
          maxRepos={MAX_REPOS}
        />

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
