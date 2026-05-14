import type { RepoTreeEntry } from './project-structure-analyzer.types';
import { normalizePath } from './project-structure-path-utils';

/**
 * Lookup structure for normalized repository tree entries.
 * It keeps path/name matching logic in one place so analyzers can stay rule-focused.
 */
export interface EntryIndex {
  paths: string[];
  fileNames: Set<string>;
  directoryPaths: Set<string>;
  extensions: Set<string>;
  hasPath: (input: { path: string }) => boolean;
  hasPathStartingWith: (input: { prefix: string }) => boolean;
  hasPathMatching: (input: { pattern: RegExp }) => boolean;
  hasFileName: (input: { name: string }) => boolean;
  hasFileNameMatching: (input: { pattern: RegExp }) => boolean;
  hasDirectory: (input: { path: string }) => boolean;
  hasDirectoryNamed: (input: { name: string }) => boolean;
}

/**
 * Builds path and filename lookup helpers from normalized GitHub tree entries.
 * This has no side effects and does not read file contents.
 */
export function buildEntryIndex({
  entries,
}: {
  entries: RepoTreeEntry[];
}): EntryIndex {
  const paths = entries.map((entry) => normalizePath({ path: entry.path }));
  const pathSet = new Set(paths);
  const fileNames = new Set(entries.map((entry) => entry.name.toLowerCase()));
  const directoryPaths = new Set(
    entries
      .filter((entry) => entry.type === 'directory')
      .map((entry) => normalizePath({ path: entry.path })),
  );
  const extensions = new Set(
    entries.flatMap((entry) =>
      entry.extension ? [entry.extension.toLowerCase()] : [],
    ),
  );

  return {
    paths,
    fileNames,
    directoryPaths,
    extensions,
    hasPath: ({ path }) => pathSet.has(normalizePath({ path })),
    hasPathStartingWith: ({ prefix }) => {
      const normalizedPrefix = normalizePath({ path: prefix });
      return paths.some(
        (path) =>
          path === normalizedPrefix || path.startsWith(`${normalizedPrefix}/`),
      );
    },
    hasPathMatching: ({ pattern }) => paths.some((path) => pattern.test(path)),
    hasFileName: ({ name }) => fileNames.has(name.toLowerCase()),
    hasFileNameMatching: ({ pattern }) =>
      [...fileNames].some((fileName) => pattern.test(fileName)),
    hasDirectory: ({ path }) => directoryPaths.has(normalizePath({ path })),
    hasDirectoryNamed: ({ name }) => {
      const normalizedName = name.toLowerCase();
      return [...directoryPaths].some((path) =>
        path.split('/').includes(normalizedName),
      );
    },
  };
}
