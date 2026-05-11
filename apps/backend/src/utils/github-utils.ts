import { ErrorCode } from 'shared';

import { AppError } from './AppError';
import type {
  RepoTreeEntry,
  RepoTreeEntryType,
} from '../services/github-analysis/project-structure/project-structure-analyzer';

/**
 * Raw GitHub tree entry from the Git Trees API.
 */
export interface GitHubTreeApiEntry {
  path: string;
  type: 'blob' | 'tree' | 'commit' | string;
  size?: number;
}

/**
 * Raw GitHub recursive tree response used by the analysis pipeline.
 */
export interface GitHubTreeApiResponse {
  tree: GitHubTreeApiEntry[];
  truncated: boolean;
}

function mapTreeEntryType({
  type,
}: {
  type: GitHubTreeApiEntry['type'];
}): RepoTreeEntryType | null {
  if (type === 'blob') return 'file';
  if (type === 'tree') return 'directory';
  if (type === 'commit') return 'submodule';
  return null;
}

function normalizeTreeEntry({
  entry,
}: {
  entry: GitHubTreeApiEntry;
}): RepoTreeEntry | null {
  const type = mapTreeEntryType({ type: entry.type });
  if (!type) return null;

  const parts = entry.path.split('/');
  const name = parts[parts.length - 1] ?? entry.path;
  const extensionMatch = name.match(/\.([^.]+)$/);

  return {
    path: entry.path,
    name,
    type,
    depth: parts.length - 1,
    parentPath: parts.length > 1 ? parts.slice(0, -1).join('/') : null,
    extension: extensionMatch?.[1] ?? null,
    sizeBytes: entry.size ?? null,
  };
}

/**
 * Splits a GitHub repository full name into owner and repository name.
 * GitHub repo APIs need these values as separate URL path segments.
 */
export function splitRepositoryFullName({
  repositoryFullName,
}: {
  repositoryFullName: string;
}): { owner: string; repo: string } {
  const [owner, repo] = repositoryFullName.split('/');
  if (!owner || !repo) {
    throw new AppError(
      'Invalid GitHub repository full name',
      ErrorCode.BAD_REQUEST,
      400,
    );
  }

  return { owner, repo };
}

/**
 * Converts raw GitHub tree entries into the analyzer's normalized tree entry shape.
 * Unknown Git tree entry types are ignored because the project structure analyzer cannot use them.
 */
export function normalizeTreeEntries({
  entries,
}: {
  entries: GitHubTreeApiEntry[];
}): RepoTreeEntry[] {
  return entries
    .map((entry) => normalizeTreeEntry({ entry }))
    .filter((entry): entry is RepoTreeEntry => Boolean(entry));
}
