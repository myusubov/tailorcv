import { buildEntryIndex } from './project-structure-entry-index';
import type { RepoTreeEntry } from './project-structure-analyzer.types';

interface ProjectShapeCandidate {
  shape: string;
  score: number;
}

function createCandidates(): Map<string, ProjectShapeCandidate> {
  return new Map(
    [
      'full-stack monorepo',
      'monorepo',
      'full-stack app',
      'frontend app',
      'backend api',
      'library/package',
      'cli tool',
      'mobile app',
      'documentation site',
      'unknown',
    ].map((shape) => [shape, { shape, score: 0 }]),
  );
}

function addScore({
  candidates,
  shape,
  score,
}: {
  candidates: Map<string, ProjectShapeCandidate>;
  shape: string;
  score: number;
}): void {
  const candidate = candidates.get(shape);
  if (!candidate) return;
  candidate.score += score;
}

/**
 * Detects the repository's broad project shape using private score-based path rules.
 * Returns a conservative single label and falls back to unknown when structure is weak.
 */
export function detectProjectShape({
  entries,
}: {
  entries: RepoTreeEntry[];
}): string {
  const index = buildEntryIndex({ entries });
  const candidates = createCandidates();

  if (index.hasDirectory({ path: 'apps' })) {
    addScore({ candidates, shape: 'monorepo', score: 2 });
  }
  if (index.hasDirectory({ path: 'packages' })) {
    addScore({ candidates, shape: 'monorepo', score: 2 });
  }
  if (
    index.hasFileName({ name: 'turbo.json' }) ||
    index.hasFileName({ name: 'pnpm-workspace.yaml' })
  ) {
    addScore({ candidates, shape: 'monorepo', score: 3 });
  }

  if (
    index.hasDirectoryNamed({ name: 'frontend' }) ||
    index.hasDirectoryNamed({ name: 'web' }) ||
    index.hasDirectoryNamed({ name: 'client' })
  ) {
    addScore({ candidates, shape: 'frontend app', score: 2 });
  }
  if (
    index.hasFileNameMatching({ pattern: /^next\.config\./ }) ||
    index.hasFileNameMatching({ pattern: /^vite\.config\./ })
  ) {
    addScore({ candidates, shape: 'frontend app', score: 4 });
  }
  if (
    index.hasPathStartingWith({ prefix: 'app' }) ||
    index.hasPathStartingWith({ prefix: 'pages' }) ||
    index.hasPathStartingWith({ prefix: 'src/components' }) ||
    index.hasPathStartingWith({ prefix: 'apps/frontend/app' }) ||
    index.hasPathStartingWith({ prefix: 'apps/frontend/pages' })
  ) {
    addScore({ candidates, shape: 'frontend app', score: 3 });
  }

  if (
    index.hasDirectoryNamed({ name: 'backend' }) ||
    index.hasDirectoryNamed({ name: 'api' }) ||
    index.hasDirectoryNamed({ name: 'server' })
  ) {
    addScore({ candidates, shape: 'backend api', score: 2 });
  }
  if (
    index.hasDirectoryNamed({ name: 'routes' }) &&
    index.hasDirectoryNamed({ name: 'controllers' }) &&
    index.hasDirectoryNamed({ name: 'services' })
  ) {
    addScore({ candidates, shape: 'backend api', score: 5 });
  }
  if (
    index.hasDirectoryNamed({ name: 'prisma' }) ||
    index.hasFileName({ name: 'server.ts' }) ||
    index.hasFileName({ name: 'app.ts' })
  ) {
    addScore({ candidates, shape: 'backend api', score: 2 });
  }

  if (
    index.hasFileName({ name: 'package.json' }) &&
    (index.hasPath({ path: 'src/index.ts' }) ||
      index.hasPath({ path: 'src/index.js' }) ||
      index.hasPath({ path: 'lib/index.ts' }) ||
      index.hasPath({ path: 'lib/index.js' }))
  ) {
    addScore({ candidates, shape: 'library/package', score: 5 });
  }
  if (
    index.hasDirectoryNamed({ name: 'bin' }) ||
    index.hasFileNameMatching({ pattern: /^cli\.(ts|js)$/ })
  ) {
    addScore({ candidates, shape: 'cli tool', score: 5 });
  }
  if (
    index.hasDirectory({ path: 'ios' }) ||
    index.hasDirectory({ path: 'android' }) ||
    index.hasFileName({ name: 'app.json' })
  ) {
    addScore({ candidates, shape: 'mobile app', score: 5 });
  }
  if (
    index.hasFileName({ name: 'docusaurus.config.js' }) ||
    index.hasFileName({ name: 'mkdocs.yml' })
  ) {
    addScore({ candidates, shape: 'documentation site', score: 5 });
  }

  const monorepoScore = candidates.get('monorepo')?.score ?? 0;
  const frontendScore = candidates.get('frontend app')?.score ?? 0;
  const backendScore = candidates.get('backend api')?.score ?? 0;

  if (monorepoScore >= 3 && frontendScore >= 4 && backendScore >= 4) {
    addScore({
      candidates,
      shape: 'full-stack monorepo',
      score: monorepoScore + frontendScore + backendScore + 3,
    });
  }
  if (frontendScore >= 4 && backendScore >= 4) {
    addScore({
      candidates,
      shape: 'full-stack app',
      score: frontendScore + backendScore + 1,
    });
  }

  const bestCandidate = [...candidates.values()]
    .filter((candidate) => candidate.shape !== 'unknown')
    .sort((a, b) => b.score - a.score)[0];

  if (!bestCandidate || bestCandidate.score < 4) return 'unknown';
  return bestCandidate.shape;
}
