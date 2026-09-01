'use client';

import { motion } from 'framer-motion';

/**
 * Renders repository-card skeletons using the same grid shape as the loaded repo picker.
 */
export function GitHubRepoGridSkeleton() {
  return (
    <motion.div
      className="mb-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <RepoCardSkeleton key={item} item={item} />
      ))}
    </motion.div>
  );
}

interface RepoCardSkeletonProps {
  item: number;
}

function RepoCardSkeleton({ item }: RepoCardSkeletonProps) {
  const hasDescription = item % 2 === 0;

  return (
    <motion.div
      className="bg-surface border-border rounded-lg border p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * item }}
    >
      <div className="flex flex-col gap-2.5">
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <div className="bg-surface-secondary mt-0.5 size-4 shrink-0 animate-pulse rounded" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="bg-surface-secondary h-4 w-32 animate-pulse rounded-full" />
              {hasDescription && (
                <div className="space-y-1.5">
                  <div className="bg-surface-secondary h-3 w-full animate-pulse rounded-full" />
                  <div className="bg-surface-secondary h-3 w-3/4 animate-pulse rounded-full" />
                </div>
              )}
            </div>
            <div className="bg-surface-secondary size-5 shrink-0 animate-pulse rounded-md" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="bg-surface-secondary h-3 w-20 animate-pulse rounded-full" />
          <div className="bg-surface-secondary h-3 w-8 animate-pulse rounded-full" />
          <div className="bg-surface-secondary h-3 w-8 animate-pulse rounded-full" />
          <div className="bg-surface-secondary h-3 w-24 animate-pulse rounded-full" />
        </div>
      </div>
    </motion.div>
  );
}
