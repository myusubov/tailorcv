'use client';

import { Icon } from '@iconify/react';

/**
 * Renders the empty state shown when repository search has no matches.
 */
export function GitHubRepoSelectionEmptyState() {
  return (
    <div className="col-span-full py-12 text-center">
      <Icon
        icon="lucide:search-x"
        className="text-muted mx-auto mb-3 size-12"
      />
      <p className="text-muted">No repositories match your search.</p>
    </div>
  );
}
