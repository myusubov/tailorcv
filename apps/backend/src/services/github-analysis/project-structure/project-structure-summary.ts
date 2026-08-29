import { detectLanguages } from './language-detector';
import { detectPrimaryStack } from './primary-stack-detector';
import { detectProjectShape } from './project-shape-detector';
import { detectRootManifests } from './root-manifest-detector';
import type {
  ProjectStructureSummary,
  RepoTreeEntry,
} from './project-structure-analyzer.types';

/**
 * Builds the high-level structure summary for one repository tree.
 * This is the first cheap pass before deeper analyzers inspect contents.
 */
export function buildProjectStructureSummary({
  entries,
  isTruncated,
}: {
  entries: RepoTreeEntry[];
  isTruncated: boolean;
}): ProjectStructureSummary {
  const files = entries.filter((entry) => entry.type === 'file');
  const topLevelFolders = entries
    .filter((entry) => entry.type === 'directory' && entry.depth === 0)
    .map((entry) => entry.path)
    .sort();
  const maxDepth = entries
    .filter((entry) => entry.type !== 'submodule')
    .reduce((max, entry) => Math.max(max, entry.depth), 0);
  const projectShape = detectProjectShape({ entries });
  const inferredStack = detectPrimaryStack({ entries, projectShape });
  const detectedLanguages = detectLanguages(entries);
  const rootManifests = detectRootManifests(entries);

  return {
    projectShape,
    inferredStack,
    totalFiles: files.length,
    topLevelFolders,
    maxDepth,
    isTreeTruncated: isTruncated,
    detectedLanguages,
    rootManifests,
  };
}
