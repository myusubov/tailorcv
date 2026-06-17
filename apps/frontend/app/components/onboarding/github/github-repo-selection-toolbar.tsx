'use client';

import { Button, Input, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

interface GitHubRepoSelectionToolbarProps {
  searchQuery: string;
  selectedCount: number;
  maxRepos: number;
  onSearchChange: (value: string) => void;
  onClearSelection: () => void;
}

/**
 * Renders repository search, selected count, max-selection status, and clear action.
 */
export function GitHubRepoSelectionToolbar({
  searchQuery,
  selectedCount,
  maxRepos,
  onSearchChange,
  onClearSelection,
}: GitHubRepoSelectionToolbarProps) {
  const isMaxSelected = selectedCount === maxRepos;
  const hasSelection = selectedCount > 0;
  const selectedCountClassName = isMaxSelected
    ? 'text-warning'
    : 'text-muted-foreground';

  return (
    <>
      <motion.div
        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="relative w-full sm:max-w-xs">
          <Icon
            icon="lucide:search"
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full pl-10"
          />
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className={`text-sm font-medium ${selectedCountClassName}`}>
            {selectedCount}/{maxRepos} selected
          </span>
          {isMaxSelected && (
            <span className="bg-warning/10 text-warning rounded-full px-2 py-0.5 text-xs">
              Max reached
            </span>
          )}
          {hasSelection && (
            <ClearSelectionButton onClearSelection={onClearSelection} />
          )}
        </div>
      </motion.div>

      <div className="mb-4 flex items-center justify-between gap-3 text-xs sm:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <span className={selectedCountClassName}>
            {selectedCount}/{maxRepos} repositories selected
          </span>
          {isMaxSelected && (
            <span className="bg-warning/10 text-warning rounded-full px-2 py-0.5">
              Max reached
            </span>
          )}
        </div>
        {hasSelection && (
          <ClearSelectionButton
            onClearSelection={onClearSelection}
            className="shrink-0"
          />
        )}
      </div>
    </>
  );
}

interface ClearSelectionButtonProps {
  onClearSelection: () => void;
  className?: string;
}

function ClearSelectionButton({
  onClearSelection,
  className,
}: ClearSelectionButtonProps) {
  return (
    <Tooltip delay={300}>
      <Tooltip.Trigger>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          onPress={onClearSelection}
          aria-label="Clear repository selection"
          className={`text-muted-foreground hover:text-foreground ${className ?? ''}`}
        >
          <Icon icon="lucide:x" className="size-4" />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content showArrow>Clear selection</Tooltip.Content>
    </Tooltip>
  );
}
