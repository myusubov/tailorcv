'use client';

import { Button, Tooltip, SearchField, Label } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import type { KeyboardEvent } from 'react';

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
    : 'text-muted';

  const handleEscapeKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onSearchChange('');
    }
  };

  return (
    <>
      <motion.div
        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <SearchField name="repository-search"
        >
          <Label className="sr-only">Search repositories</Label>

          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input onKeyDown={(event) => {
              handleEscapeKey(event);
            }} value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search..." />
            <SearchField.ClearButton onPress={() => onSearchChange('')} />
          </SearchField.Group>
        </SearchField>

        <div className="hidden items-center gap-2 sm:flex">
          <span className={`text-sm font-medium ${selectedCountClassName}`}>
            {selectedCount}/{maxRepos} selected
          </span>
          {isMaxSelected && (
            <span className="bg-warning-soft text-warning-soft-foreground rounded-full px-2 py-0.5 text-xs">
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
            <span className="bg-warning-soft text-warning-soft-foreground rounded-full px-2 py-0.5">
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
          className={`text-muted hover:text-foreground ${className ?? ''}`}
        >
          <Icon icon="lucide:x" className="size-4" />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content showArrow>Clear selection</Tooltip.Content>
    </Tooltip>
  );
}
