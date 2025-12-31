'use client';

import { motion } from 'framer-motion';

export function GitHubLoadingView() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header Skeleton */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="bg-surface-secondary mb-6 size-20 animate-pulse rounded-2xl" />
          <div className="bg-surface-secondary mb-4 h-4 w-32 animate-pulse rounded-full" />
          <div className="bg-surface-secondary mb-2 h-8 w-64 animate-pulse rounded-lg" />
          <div className="bg-surface-secondary h-4 w-80 animate-pulse rounded-lg" />
        </div>

        {/* Repo Cards Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="bg-surface border-border flex items-center gap-4 rounded-xl border p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="bg-surface-secondary size-10 animate-pulse rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="bg-surface-secondary h-4 w-40 animate-pulse rounded" />
                <div className="bg-surface-secondary h-3 w-64 animate-pulse rounded" />
              </div>
              <div className="bg-surface-secondary size-6 animate-pulse rounded" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
