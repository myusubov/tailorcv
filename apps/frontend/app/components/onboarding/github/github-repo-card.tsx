'use client';

import { Card } from '@heroui/react';
import { Icon } from '@iconify/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import type { GitHubRepo } from 'shared';
import { LANGUAGE_COLORS } from '@/lib/constants/github';

interface GitHubRepoCardProps {
  repo: GitHubRepo;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}

/**
 * Renders a selectable GitHub repository card with language, stars, forks, and update metadata.
 */
export function GitHubRepoCard({
  repo,
  isSelected,
  isDisabled,
  onToggle,
}: GitHubRepoCardProps) {
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
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      className={`focus-visible:ring-primary/70 group relative cursor-pointer rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none ${
        isSelected
          ? 'border-primary bg-primary/5 ring-primary/20 ring-1'
          : isDisabled
            ? 'cursor-not-allowed opacity-45'
            : 'hover:border-primary/40 hover:bg-surface-secondary'
      }`}
    >
      <Card.Content className="flex flex-col gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon
              icon={repo.private ? 'lucide:lock' : 'lucide:book-open'}
              className="text-muted-foreground mt-0.5 size-4 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-foreground truncate font-semibold">
                  {repo.name}
                </h3>
                {repo.fork && (
                  <span className="bg-surface-secondary text-muted-foreground shrink-0 rounded-md px-1.5 py-0.5 text-[11px]">
                    Fork
                  </span>
                )}
              </div>
            </div>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-primary flex size-5 shrink-0 items-center justify-center rounded-full"
              >
                <Icon icon="lucide:check" className="text-background size-3.5" />
              </motion.div>
            )}
          </div>

          {repo.description && (
            <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm leading-snug">
              {repo.description}
            </p>
          )}
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
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
