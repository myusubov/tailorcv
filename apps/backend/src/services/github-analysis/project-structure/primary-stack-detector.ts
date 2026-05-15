import { buildEntryIndex } from './project-structure-entry-index';
import {
  addCandidateScore,
  createScoreCandidates,
} from './project-structure-score-candidates';
import type { RepoTreeEntry } from './project-structure-analyzer.types';

type StackName =
  | 'Docker'
  | 'Next.js'
  | 'Node.js/TypeScript'
  | 'PostgreSQL'
  | 'Prisma'
  | 'NestJS'
  | 'React'
  | 'Turborepo'
  | 'Nx'
  | 'Vite'
  | 'React Native'
  | 'Expo'
  | 'Android'
  | 'iOS'
  | 'Flutter';

const STACK_NAMES: readonly StackName[] = [
  'Docker',
  'Next.js',
  'Node.js/TypeScript',
  'PostgreSQL',
  'Prisma',
  'NestJS',
  'React',
  'Turborepo',
  'Nx',
  'Vite',
  'React Native',
  'Expo',
  'Android',
  'iOS',
  'Flutter',
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
  const hasExpoStackEvidence =
    index.hasFileName({ name: 'expo-env.d.ts' }) ||
    index.hasFileNameMatching({ pattern: /^app\.config\.(ts|js)$/ }) ||
    (index.hasFileName({ name: 'app.json' }) &&
      index.hasPathMatching({ pattern: /(^|\/)app\/_layout\.(tsx|jsx)$/ }));

  /**
   * Frontend framework evidence.
   * Config files are strong stack signals; app/pages folders are weaker and are
   * ignored for Next.js when Expo Router evidence is present.
   */
  if (index.hasFileNameMatching({ pattern: /^next\.config\./ })) {
    addStackScore({ candidates, stack: 'Next.js', score: 4 });
  }
  if (
    !hasExpoStackEvidence &&
    (NEXT_APP_PATH_PREFIXES.some((prefix) =>
      index.hasPathStartingWith({ prefix }),
    ) ||
      index.hasPathMatching({ pattern: NEXT_MONOREPO_APP_PATH_PATTERN }))
  ) {
    addStackScore({ candidates, stack: 'Next.js', score: 2 });
  }
  if (index.hasFileNameMatching({ pattern: /^vite\.config\./ })) {
    addStackScore({ candidates, stack: 'Vite', score: 4 });
  }
  if (index.hasPathMatching({ pattern: /^src\/(app|main)\.(tsx|jsx)$/ })) {
    addStackScore({ candidates, stack: 'React', score: 3 });
  }

  /**
   * Backend and database stack evidence.
   * Database tools are stack signals only, not proof that the whole repository is
   * a backend API. NestJS is inferred from its conventional entry/module files,
   * while Express waits for dependency analysis because folders alone are not
   * Express-specific.
   */
  if (index.hasPathMatching({ pattern: /(^|\/)prisma\/schema\.prisma$/ })) {
    addStackScore({ candidates, stack: 'Prisma', score: 4 });
  }
  if (index.hasPathMatching({ pattern: /postgres|postgresql/ })) {
    addStackScore({ candidates, stack: 'PostgreSQL', score: 3 });
  }

  if (
    index.hasPathMatching({ pattern: /(^|\/)src\/main\.ts$/ }) &&
    index.hasPathMatching({ pattern: /(^|\/)src\/app\.module\.ts$/ })
  ) {
    addStackScore({ candidates, stack: 'NestJS', score: 4 });
  }

  /**
   * Infrastructure and workspace tooling evidence.
   * These are config-backed signals, so they can be inferred without reading
   * dependency files.
   */
  if (
    index.hasFileName({ name: 'dockerfile' }) ||
    index.hasFileNameMatching({ pattern: /^docker-compose\./ }) ||
    index.hasFileName({ name: 'compose.yaml' }) ||
    index.hasFileName({ name: 'compose.yml' })
  ) {
    addStackScore({ candidates, stack: 'Docker', score: 3 });
  }
  if (index.hasFileName({ name: 'turbo.json' })) {
    addStackScore({ candidates, stack: 'Turborepo', score: 4 });
  }
  if (index.hasFileName({ name: 'nx.json' })) {
    addStackScore({ candidates, stack: 'Nx', score: 4 });
  }

  /**
   * Mobile stack evidence.
   * Reserved for mobile path/config rules such as Expo, React Native, native
   * Android/iOS, and Flutter. Keep these conservative because mobile projects
   * often include generated folders.
   */

  if (hasExpoStackEvidence) {
    addStackScore({ candidates, stack: 'Expo', score: 4 });
  }

  if (
    index.hasFileName({ name: 'metro.config.js' }) ||
    ((index.hasDirectory({ path: 'ios' }) ||
      index.hasDirectory({ path: 'android' })) &&
      (index.hasFileName({ name: 'index.js' }) ||
        index.hasFileName({ name: 'index.ts' })))
  ) {
    addStackScore({ candidates, stack: 'React Native', score: 3 });
  }

  if (
    (index.hasPath({ path: 'android/build.gradle' }) ||
      index.hasPath({ path: 'android/app/build.gradle' }) ||
      index.hasPath({ path: 'android/settings.gradle' })) &&
    (index.extensions.has('kt') ||
      index.extensions.has('kts') ||
      index.extensions.has('java'))
  ) {
    addStackScore({ candidates, stack: 'Android', score: 4 });
  }

  if (
    index.hasPath({ path: 'ios/Podfile' }) ||
    index.hasPathMatching({ pattern: /^ios\/[^/]+\.xcodeproj/ }) ||
    index.hasPathMatching({ pattern: /^ios\/[^/]+\.xcworkspace/ })
  ) {
    addStackScore({ candidates, stack: 'iOS', score: 4 });
  }

  if (
    index.hasFileName({ name: 'pubspec.yaml' }) &&
    index.hasPath({ path: 'lib/main.dart' })
  ) {
    addStackScore({ candidates, stack: 'Flutter', score: 4 });
  }

  /**
   * Runtime/language evidence.
   * TypeScript is only emitted when the repository has a meaningful detected
   * shape so a loose config file does not create a stack for an unknown repo.
   */
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
