import type { GitHubRepo } from 'shared';
import { GitHubRepoCard } from './github-repo-card';
import { GitHubRepoGridSkeleton } from './github-repo-grid-skeleton';
import { GitHubRepoSelectionEmptyState } from './github-repo-selection-empty-state';

interface GitHubRepoSelectionResultsProps {
  isReposLoading: boolean;
  repos: GitHubRepo[];
  selectedRepos: ReadonlySet<number>;
  onToggleRepo: (repoId: number) => void;
  maxRepos: number;
}

/**
 * Renders the GitHub repository results region, including loading, empty, and selectable repo states.
 */
export function GitHubRepoSelectionResults({
  isReposLoading,
  repos,
  selectedRepos,
  onToggleRepo,
  maxRepos,
}: GitHubRepoSelectionResultsProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:px-6">
      {isReposLoading ? (
        <GitHubRepoGridSkeleton />
      ) : (
        <div className="grid auto-rows-fr grid-cols-1 gap-2.5 sm:grid-cols-2">
          {repos.map((repo) => {
            const isSelected = selectedRepos.has(repo.id);
            const isDisabled = !isSelected && selectedRepos.size >= maxRepos;

            return (
              <GitHubRepoCard
                key={repo.id}
                repo={repo}
                isSelected={isSelected}
                isDisabled={isDisabled}
                maxRepos={maxRepos}
                onToggle={() => onToggleRepo(repo.id)}
              />
            );
          })}

          {repos.length === 0 && <GitHubRepoSelectionEmptyState />}
        </div>
      )}
    </div>
  );
}
