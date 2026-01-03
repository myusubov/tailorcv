'use client';

import { Button, Input } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { GitHubRepo, GitHubConnection } from 'shared';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { LANGUAGE_COLORS } from '@/lib/constants/github';

const MAX_REPOS = 5;

interface GitHubRepoSelectionViewProps {
  repos: GitHubRepo[];
  connection: GitHubConnection;
  onBack: () => void;
  onAnalyze: (selectedRepoIds: number[]) => void;
  isLoading?: boolean;
}

export function GitHubRepoSelectionView({
  repos,
  connection,
  onBack,
  onAnalyze,
  isLoading,
}: GitHubRepoSelectionViewProps) {
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="flex min-h-[60vh] flex-col px-4 py-8">
      <motion.div
        className="mx-auto w-full max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            className="mb-4 flex items-center justify-center gap-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Image
              src={connection.githubAvatarUrl || ''}
              alt={connection.githubUsername}
              width={48}
              height={48}
              quality={100}
              priority
              className="ring-primary/20 size-12 rounded-full ring-2"
            />
            <div className="text-left">
              <p className="text-foreground font-semibold">
                Connected as @{connection.githubUsername}
              </p>
              <p className="text-muted text-sm">
                {repos.length} repositories found
              </p>
            </div>
          </motion.div>

          <motion.h1
            className="text-foreground mb-2 text-2xl font-bold tracking-tight sm:text-3xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Select Your Hero Repositories
          </motion.h1>
          <motion.p
            className="text-muted text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Choose up to {MAX_REPOS} repositories that showcase your best work.
            We&apos;ll analyze commits and PRs to generate powerful impact
            statements.
          </motion.p>
        </div>

        {/* Search & Selection Info */}
        <motion.div
          className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative sm:max-w-xs">
            <Icon
              icon="lucide:search"
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                selectedRepos.size === MAX_REPOS ? 'text-warning' : 'text-muted'
              }`}
            >
              {selectedRepos.size}/{MAX_REPOS} selected
            </span>
            {selectedRepos.size === MAX_REPOS && (
              <span className="bg-warning/10 text-warning rounded-full px-2 py-0.5 text-xs">
                Max reached
              </span>
            )}
          </div>
        </motion.div>

        {/* Repository List */}
        <motion.div
          className="mb-6 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredRepos.map((repo, index) => {
              const isSelected = selectedRepos.has(repo.id);
              const isDisabled = !isSelected && selectedRepos.size >= MAX_REPOS;

              return (
                <motion.div
                  key={repo.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => !isDisabled && toggleRepo(repo.id)}
                  className={`group relative cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-primary/20 ring-1'
                      : isDisabled
                        ? 'border-border bg-surface cursor-not-allowed opacity-50'
                        : 'border-border bg-surface hover:border-primary/50 hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Repo Info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Icon
                          icon={
                            repo.private ? 'lucide:lock' : 'lucide:book-open'
                          }
                          className="text-muted size-4 shrink-0"
                        />
                        <h3 className="text-foreground truncate font-semibold">
                          {repo.name}
                        </h3>
                        {repo.fork && (
                          <span className="bg-surface-secondary text-muted rounded px-1.5 py-0.5 text-xs">
                            Fork
                          </span>
                        )}
                      </div>

                      {repo.description && (
                        <p className="text-muted mb-2 line-clamp-1 text-sm">
                          {repo.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {repo.language && (
                          <span className="flex items-center gap-1">
                            <span
                              className="size-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  LANGUAGE_COLORS[repo.language] || '#6e7681',
                              }}
                            />
                            <span className="text-muted">{repo.language}</span>
                          </span>
                        )}
                        <span className="text-muted flex items-center gap-1">
                          <Icon icon="lucide:star" className="size-3" />
                          {repo.stargazers_count}
                        </span>
                        <span className="text-muted flex items-center gap-1">
                          <Icon icon="lucide:git-fork" className="size-3" />
                          {repo.forks_count}
                        </span>
                        <span className="text-muted">
                          Updated{' '}
                          {formatDistanceToNow(new Date(repo.updated_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-primary flex size-6 items-center justify-center rounded-full"
                      >
                        <Icon
                          icon="lucide:check"
                          className="text-background size-4"
                        />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredRepos.length === 0 && (
            <div className="py-12 text-center">
              <Icon
                icon="lucide:search-x"
                className="text-muted mx-auto mb-3 size-12"
              />
              <p className="text-muted">No repositories match your search.</p>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex items-center justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            variant="ghost"
            onPress={onBack}
            className="text-muted hover:text-foreground"
          >
            <Icon icon="lucide:arrow-left" className="size-4" />
            Back
          </Button>
          <Button
            isDisabled={selectedRepos.size === 0}
            onPress={handleAnalyze}
            isPending={isLoading}
          >
            <Icon icon="lucide:sparkles" className="size-5" />
            Analyze {selectedRepos.size}{' '}
            {selectedRepos.size === 1 ? 'Repository' : 'Repositories'}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
