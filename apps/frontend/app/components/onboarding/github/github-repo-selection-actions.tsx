'use client';

import { Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

interface GitHubRepoSelectionActionsProps {
  selectedCount: number;
  isLoading?: boolean;
  onBack: () => void;
  onAnalyze: () => void;
}

/**
 * Renders the repo-picker navigation and analyze actions.
 */
export function GitHubRepoSelectionActions({
  selectedCount,
  isLoading,
  onBack,
  onAnalyze,
}: GitHubRepoSelectionActionsProps) {
  return (
    <motion.div
      className="flex items-center justify-between gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Button
        variant="ghost"
        onPress={onBack}
        className="text-muted-foreground hover:text-foreground"
      >
        <Icon icon="lucide:arrow-left" className="size-4" />
        Back
      </Button>
      <Button
        isDisabled={selectedCount === 0}
        onPress={onAnalyze}
        isPending={isLoading}
      >
        {({ isPending }) => (
          <>
            {isPending && <Spinner color="current" size="sm" />}
            Analyze {selectedCount}{' '}
            {selectedCount === 1 ? 'Repository' : 'Repositories'}
          </>
        )}
      </Button>
    </motion.div>
  );
}
