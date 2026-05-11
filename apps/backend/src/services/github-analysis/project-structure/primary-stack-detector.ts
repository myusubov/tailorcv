import { buildEntryIndex } from './project-structure-entry-index';
import type { RepoTreeEntry } from './project-structure-analyzer.types';

interface StackCandidate {
  stack: string;
  score: number;
}

function createCandidates(): Map<string, StackCandidate> {
  return new Map(
    [
      'Docker',
      'Express',
      'Next.js',
      'Node.js/TypeScript',
      'PostgreSQL',
      'Prisma',
      'React',
      'Turborepo',
      'Vite',
    ].map((stack) => [stack, { stack, score: 0 }]),
  );
}

function addScore({
  candidates,
  stack,
  score,
}: {
  candidates: Map<string, StackCandidate>;
  stack: string;
  score: number;
}): void {
  const candidate = candidates.get(stack);
  if (!candidate) return;
  candidate.score += score;
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
  const candidates = createCandidates();

  if (index.hasFileNameMatching({ pattern: /^next\.config\./ })) {
    addScore({ candidates, stack: 'Next.js', score: 4 });
  }
  if (
    index.hasPathStartingWith({ prefix: 'app' }) ||
    index.hasPathStartingWith({ prefix: 'pages' }) ||
    index.hasPathStartingWith({ prefix: 'apps/frontend/app' }) ||
    index.hasPathStartingWith({ prefix: 'apps/frontend/pages' })
  ) {
    addScore({ candidates, stack: 'Next.js', score: 2 });
  }
  if (index.hasFileNameMatching({ pattern: /^vite\.config\./ })) {
    addScore({ candidates, stack: 'Vite', score: 4 });
  }
  if (index.hasPathMatching({ pattern: /^src\/(app|main)\.(tsx|jsx)$/ })) {
    addScore({ candidates, stack: 'React', score: 3 });
  }
  if (
    index.hasDirectoryNamed({ name: 'routes' }) &&
    index.hasDirectoryNamed({ name: 'controllers' }) &&
    index.hasDirectoryNamed({ name: 'services' })
  ) {
    addScore({ candidates, stack: 'Express', score: 3 });
  }
  if (index.hasPathMatching({ pattern: /(^|\/)prisma\/schema\.prisma$/ })) {
    addScore({ candidates, stack: 'Prisma', score: 4 });
  }
  if (index.hasPathMatching({ pattern: /postgres|postgresql/ })) {
    addScore({ candidates, stack: 'PostgreSQL', score: 3 });
  }
  if (
    index.hasFileName({ name: 'dockerfile' }) ||
    index.hasFileNameMatching({ pattern: /^docker-compose\./ })
  ) {
    addScore({ candidates, stack: 'Docker', score: 3 });
  }
  if (index.hasFileName({ name: 'turbo.json' })) {
    addScore({ candidates, stack: 'Turborepo', score: 4 });
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
    addScore({ candidates, stack: 'Node.js/TypeScript', score: 3 });
  }

  return [...candidates.values()]
    .filter((candidate) => candidate.score >= 2)
    .map((candidate) => candidate.stack)
    .sort((a, b) => a.localeCompare(b));
}
