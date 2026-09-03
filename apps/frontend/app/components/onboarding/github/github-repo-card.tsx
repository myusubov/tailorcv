'use client';

import { Card, Checkbox } from '@heroui/react';
import { Icon } from '@iconify/react';
import { formatDistanceToNow } from 'date-fns';
import type { GitHubRepo } from 'shared';
import { LANGUAGE_COLORS } from '@/lib/constants/github';

interface GitHubRepoCardProps {
  repo: GitHubRepo;
  isSelected: boolean;
  isDisabled: boolean;
  maxRepos: number;
  onToggle: () => void;
}

/**
 * Renders a selectable GitHub repository card with language, stars, forks, and update metadata.
 *
 * Selection is conveyed by a persistent square checkbox indicator (not card color alone) and
 * exposed to assistive tech through `role="checkbox"` + `aria-checked` so the control reads as a
 * multi-select toggle. `isDisabled` is only ever true for unselected cards once `maxRepos` is
 * reached; a selected card always stays interactive so it can be deselected.
 */
export function GitHubRepoCard({
  repo,
  isSelected,
  isDisabled,
  maxRepos,
  onToggle,
}: GitHubRepoCardProps) {
  const stateClassName = isSelected
    ? 'border-accent bg-accent/5 shadow-sm hover:bg-accent/10'
    : isDisabled
      ? 'border-border cursor-not-allowed opacity-45'
      : 'border-border hover:border-accent/40 hover:bg-surface-secondary';

  return (
    <Card
      onClick={() => {
        if (!isDisabled) onToggle();
      }}
      onKeyDown={(event) => {
        if (isDisabled) return;

        if (event.key === 'Enter') {
          onToggle();
          return;
        }

        if (event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
          onToggle();
        }
      }}
      role="checkbox"
      tabIndex={isDisabled ? -1 : 0}
      aria-checked={isSelected}
      aria-disabled={isDisabled}
      title={
        isDisabled ? `You can select up to ${maxRepos} repositories` : undefined
      }
      className={`focus-visible:ring-accent/70 group focus-visible:ring-offset-background relative cursor-default border transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${stateClassName}`}
    >
      <Card.Content className="flex flex-col gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon
              icon={repo.private ? 'lucide:lock' : 'lucide:book-open'}
              className="text-muted mt-0.5 size-4 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-foreground truncate font-semibold">
                  {repo.name}
                </h3>
                {repo.fork && (
                  <span className="bg-surface-secondary text-muted shrink-0 rounded-md px-1.5 py-0.5 text-[11px]">
                    Fork
                  </span>
                )}
              </div>
            </div>
            <span inert>
              <Checkbox
                isReadOnly
                excludeFromTabOrder
                aria-hidden="true"
                className="pointer-events-none"
                isSelected={isSelected}
                variant="secondary"
              >
                <Checkbox.Content>
                  <Checkbox.Control className="size-5">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox.Content>
              </Checkbox>
            </span>
          </div>

          {repo.description && (
            <p className="text-muted mt-1.5 line-clamp-2 text-sm leading-snug">
              {repo.description}
            </p>
          )}
        </div>

        <div className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          {repo.language && (
            <span className="flex items-center gap-1">
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor: LANGUAGE_COLORS[repo.language] || '#6e7681',
                }}
              />
              <span>{repo.language}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Icon icon="lucide:star" className="size-3" />
            {repo.stargazers_count}
          </span>
          <span className="flex items-center gap-1">
            <Icon icon="lucide:git-fork" className="size-3" />
            {repo.forks_count}
          </span>
          <span>
            Updated{' '}
            {formatDistanceToNow(new Date(repo.updated_at), {
              addSuffix: true,
            })}
          </span>
        </div>
      </Card.Content>
    </Card>
  );
}
