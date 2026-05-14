import { buildEntryIndex } from './project-structure-entry-index';
import {
  addCandidateScore,
  candidateScore,
  candidatesByScore,
  createScoreCandidates,
} from './project-structure-score-candidates';
import type { RepoTreeEntry } from './project-structure-analyzer.types';

type ProjectShape =
  | 'full-stack monorepo'
  | 'monorepo'
  | 'full-stack app'
  | 'frontend app'
  | 'backend api'
  | 'library/package'
  | 'cli tool'
  | 'mobile app'
  | 'documentation site'
  | 'unknown';

const PROJECT_SHAPES: readonly ProjectShape[] = [
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
];

const MONOREPO_CONFIG_FILES = [
  'turbo.json',
  'pnpm-workspace.yaml',
  'nx.json',
  'workspace.json',
  'project.json',
  'lerna.json',
] as const;

const MONOREPO_ROOT_DIRECTORIES = ['apps', 'packages', 'libs'] as const;

const WEAK_MONOREPO_ROOT_DIRECTORIES = ['services'] as const;

const FRONTEND_DIRECTORY_NAMES = ['frontend', 'web', 'client'] as const;

const FRONTEND_CONFIG_PATTERNS = [/^next\.config\./, /^vite\.config\./];

const FRONTEND_PATH_PREFIXES = ['app', 'pages', 'src/components'] as const;

const FRONTEND_MONOREPO_APP_PATH_PATTERN = /^apps\/[^/]+\/(app|pages)(\/|$)/;

const BACKEND_DIRECTORY_NAMES = ['backend', 'api', 'server'] as const;

const BACKEND_STRUCTURE_DIRECTORY_NAMES = [
  'routes',
  'controllers',
  'services',
] as const;

const BACKEND_SIGNAL_FILES = ['server.ts', 'app.ts'] as const;

function addProjectShapeScore({
  candidates,
  shape,
  score,
}: {
  candidates: ReturnType<typeof createProjectShapeCandidates>;
  shape: ProjectShape;
  score: number;
}): void {
  addCandidateScore({ candidates, name: shape, score });
}

function createProjectShapeCandidates() {
  return createScoreCandidates({ names: PROJECT_SHAPES });
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
  const candidates = createProjectShapeCandidates();

  const monorepoRootDirectoryCount = MONOREPO_ROOT_DIRECTORIES.filter((path) =>
    index.hasDirectory({ path }),
  ).length;

  if (monorepoRootDirectoryCount > 0) {
    addProjectShapeScore({
      candidates,
      shape: 'monorepo',
      score: monorepoRootDirectoryCount * 2,
    });
  }

  if (MONOREPO_CONFIG_FILES.some((name) => index.hasFileName({ name }))) {
    addProjectShapeScore({ candidates, shape: 'monorepo', score: 3 });
  }

  if (
    index.hasFileName({ name: 'nx.json' }) &&
    index.hasFileName({ name: 'project.json' })
  ) {
    addProjectShapeScore({ candidates, shape: 'monorepo', score: 2 });
  }

  if (
    WEAK_MONOREPO_ROOT_DIRECTORIES.some((path) => index.hasDirectory({ path }))
  ) {
    addProjectShapeScore({ candidates, shape: 'monorepo', score: 1 });
  }

  if (
    FRONTEND_DIRECTORY_NAMES.some((name) => index.hasDirectoryNamed({ name }))
  ) {
    addProjectShapeScore({ candidates, shape: 'frontend app', score: 2 });
  }
  if (
    FRONTEND_CONFIG_PATTERNS.some((pattern) =>
      index.hasFileNameMatching({ pattern }),
    )
  ) {
    addProjectShapeScore({ candidates, shape: 'frontend app', score: 4 });
  }
  if (
    FRONTEND_PATH_PREFIXES.some((prefix) =>
      index.hasPathStartingWith({ prefix }),
    ) ||
    index.hasPathMatching({ pattern: FRONTEND_MONOREPO_APP_PATH_PATTERN })
  ) {
    addProjectShapeScore({ candidates, shape: 'frontend app', score: 3 });
  }

  if (
    BACKEND_DIRECTORY_NAMES.some((name) => index.hasDirectoryNamed({ name }))
  ) {
    addProjectShapeScore({ candidates, shape: 'backend api', score: 2 });
  }
  if (
    BACKEND_STRUCTURE_DIRECTORY_NAMES.every((name) =>
      index.hasDirectoryNamed({ name }),
    )
  ) {
    addProjectShapeScore({ candidates, shape: 'backend api', score: 5 });
  }
  if (
    index.hasDirectoryNamed({ name: 'prisma' }) ||
    BACKEND_SIGNAL_FILES.some((name) => index.hasFileName({ name }))
  ) {
    addProjectShapeScore({ candidates, shape: 'backend api', score: 2 });
  }

  if (
    index.hasFileName({ name: 'package.json' }) &&
    (index.hasPath({ path: 'src/index.ts' }) ||
      index.hasPath({ path: 'src/index.js' }) ||
      index.hasPath({ path: 'lib/index.ts' }) ||
      index.hasPath({ path: 'lib/index.js' }))
  ) {
    addProjectShapeScore({ candidates, shape: 'library/package', score: 5 });
  }
  if (
    index.hasDirectoryNamed({ name: 'bin' }) ||
    index.hasFileNameMatching({ pattern: /^cli\.(ts|js)$/ })
  ) {
    addProjectShapeScore({ candidates, shape: 'cli tool', score: 5 });
  }
  if (
    index.hasDirectory({ path: 'ios' }) ||
    index.hasDirectory({ path: 'android' }) ||
    index.hasFileName({ name: 'app.json' })
  ) {
    addProjectShapeScore({ candidates, shape: 'mobile app', score: 5 });
  }
  if (
    index.hasFileName({ name: 'docusaurus.config.js' }) ||
    index.hasFileName({ name: 'mkdocs.yml' })
  ) {
    addProjectShapeScore({
      candidates,
      shape: 'documentation site',
      score: 5,
    });
  }

  const monorepoScore = candidateScore({ candidates, name: 'monorepo' });
  const frontendScore = candidateScore({ candidates, name: 'frontend app' });
  const backendScore = candidateScore({ candidates, name: 'backend api' });

  if (monorepoScore >= 3 && frontendScore >= 4 && backendScore >= 4) {
    addProjectShapeScore({
      candidates,
      shape: 'full-stack monorepo',
      score: monorepoScore + frontendScore + backendScore + 3,
    });
  }
  if (frontendScore >= 4 && backendScore >= 4) {
    addProjectShapeScore({
      candidates,
      shape: 'full-stack app',
      score: frontendScore + backendScore + 1,
    });
  }

  const bestCandidate = candidatesByScore({ candidates }).filter(
    (candidate) => candidate.name !== 'unknown',
  )[0];

  if (!bestCandidate || bestCandidate.score < 4) return 'unknown';
  return bestCandidate.name;
}
