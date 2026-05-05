'use client';

import { motion } from 'framer-motion';
import { GitHubRepoGridSkeleton } from './github-repo-grid-skeleton';

/**
 * Renders a skeleton that mirrors the GitHub repository selection layout.
 */
export function GitHubLoadingView() {
  return (
    <div className="flex min-h-[60vh] flex-col">
      <motion.div
        className="mx-auto w-full max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 text-center">
          <motion.div
            className="mb-4 flex items-center justify-center gap-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-surface-secondary ring-primary/10 size-12 animate-pulse rounded-full ring-2" />
            <div className="space-y-2 text-left">
              <div className="bg-surface-secondary h-4 w-40 animate-pulse rounded-full" />
              <div className="bg-surface-secondary h-3 w-28 animate-pulse rounded-full" />
            </div>
          </motion.div>

          <motion.div
            className="bg-surface-secondary mx-auto mb-2 h-8 w-72 max-w-full animate-pulse rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          />
          <motion.div
            className="bg-surface-secondary mx-auto h-4 w-full max-w-lg animate-pulse rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          />
        </div>

        <motion.div
          className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-surface-secondary h-10 w-full animate-pulse rounded-lg sm:max-w-xs" />
          <div className="hidden items-center gap-2 sm:flex">
            <div className="bg-surface-secondary h-4 w-24 animate-pulse rounded-full" />
            <div className="bg-surface-secondary size-8 animate-pulse rounded-lg" />
          </div>
        </motion.div>

        <div className="mb-4 flex items-center justify-between gap-3 text-xs sm:hidden">
          <div className="bg-surface-secondary h-3 w-36 animate-pulse rounded-full" />
          <div className="bg-surface-secondary size-7 animate-pulse rounded-lg" />
        </div>

        <GitHubRepoGridSkeleton />

        <motion.div
          className="flex items-center justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="bg-surface-secondary h-10 w-20 animate-pulse rounded-lg" />
          <div className="bg-surface-secondary h-10 w-44 animate-pulse rounded-lg" />
        </motion.div>
      </motion.div>
    </div>
  );
}
