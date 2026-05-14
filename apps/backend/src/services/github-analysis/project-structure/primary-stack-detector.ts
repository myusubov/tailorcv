import { buildEntryIndex } from './project-structure-entry-index';
import {
  addCandidateScore,
  createScoreCandidates,
} from './project-structure-score-candidates';
import type { RepoTreeEntry } from './project-structure-analyzer.types';

type StackName =
  | 'Docker'
  | 'Express'
  | 'Next.js'
  | 'Node.js/TypeScript'
  | 'PostgreSQL'
  | 'Prisma'
  | 'React'
  | 'Turborepo'
  | 'Vite';

const STACK_NAMES: readonly StackName[] = [
  'Docker',
  'Express',
  'Next.js',
  'Node.js/TypeScript',
  'PostgreSQL',
  'Prisma',
  'React',
  'Turborepo',
  'Vite',
];

const NEXT_APP_PATH_PREFIXES = ['app', 'pages'] as const;

const NEXT_MONOREPO_APP_PATH_PATTERN = /^apps\/[^/]+\/(app|pages)(\/|$)/;

function createStackCandidates() {
  return createScoreCandidates({ names: STACK_NAMES });
}

function addStackScore({
  candidates,
  stack,
  score,
}: {
  candidates: ReturnType<typeof createStackCandidates>;
  stack: StackName;
  score: number;
}): void {
  addCandidateScore({ candidates, name: stack, score });
}

/**
 * Detects a conservative primary stack list from config-like paths and folder conventions.
 * It does not read dependency contents, so it intentionally omits uncertain stack guesses.
 */
export function detectPrimaryStack({
  entries,
  projectShape,
}: {
  entries: RepoTreeEntry[];
  projectShape: string;
}): string[] {
  const index = buildEntryIndex({ entries });
  const candidates = createStackCandidates();

  if (index.hasFileNameMatching({ pattern: /^next\.config\./ })) {
    addStackScore({ candidates, stack: 'Next.js', score: 4 });
  }
  if (
    NEXT_APP_PATH_PREFIXES.some((prefix) =>
      index.hasPathStartingWith({ prefix }),
    ) ||
    index.hasPathMatching({ pattern: NEXT_MONOREPO_APP_PATH_PATTERN })
  ) {
    addStackScore({ candidates, stack: 'Next.js', score: 2 });
  }
  if (index.hasFileNameMatching({ pattern: /^vite\.config\./ })) {
    addStackScore({ candidates, stack: 'Vite', score: 4 });
  }
  if (index.hasPathMatching({ pattern: /^src\/(app|main)\.(tsx|jsx)$/ })) {
    addStackScore({ candidates, stack: 'React', score: 3 });
  }
  if (
    index.hasDirectoryNamed({ name: 'routes' }) &&
    index.hasDirectoryNamed({ name: 'controllers' }) &&
    index.hasDirectoryNamed({ name: 'services' })
  ) {
    addStackScore({ candidates, stack: 'Express', score: 3 });
  }
  if (index.hasPathMatching({ pattern: /(^|\/)prisma\/schema\.prisma$/ })) {
    addStackScore({ candidates, stack: 'Prisma', score: 4 });
  }
  if (index.hasPathMatching({ pattern: /postgres|postgresql/ })) {
    addStackScore({ candidates, stack: 'PostgreSQL', score: 3 });
  }
  if (
    index.hasFileName({ name: 'dockerfile' }) ||
    index.hasFileNameMatching({ pattern: /^docker-compose\./ })
  ) {
    addStackScore({ candidates, stack: 'Docker', score: 3 });
  }
  if (index.hasFileName({ name: 'turbo.json' })) {
    addStackScore({ candidates, stack: 'Turborepo', score: 4 });
  }

  const hasTypeScript =
    index.extensions.has('ts') ||
    index.extensions.has('tsx') ||
    index.hasFileName({ name: 'tsconfig.json' });

  if (
    projectShape !== 'unknown' &&
    index.hasFileName({ name: 'package.json' }) &&
    hasTypeScript
  ) {
    addStackScore({ candidates, stack: 'Node.js/TypeScript', score: 3 });
  }

  return [...candidates.values()]
    .filter((candidate) => candidate.score >= 2)
    .map((candidate) => candidate.name)
    .sort((a, b) => a.localeCompare(b));
}
