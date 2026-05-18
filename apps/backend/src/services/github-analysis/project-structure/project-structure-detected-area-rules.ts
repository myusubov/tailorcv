import { addAreaScore } from './project-structure-detected-area-candidates';
import type { RepoTreeEntry } from './project-structure-analyzer.types';
import type { DetectedAreaRuleContext } from './project-structure-detected-areas.types';
import {
  normalizePath,
  ownerPathForApplicationArea,
  ownerPathForBackendArea,
  ownerPathForConfigArea,
  ownerPathForDatabaseArea,
  topLevelPath,
} from './project-structure-path-utils';

function isFileNameMatch({
  entry,
  pattern,
}: {
  entry: RepoTreeEntry;
  pattern: RegExp;
}): boolean {
  return entry.type === 'file' && pattern.test(entry.name.toLowerCase());
}

function addFrontendAreas({
  entries,
  candidates,
}: DetectedAreaRuleContext): void {
  for (const entry of entries) {
    const normalizedPath = normalizePath({ path: entry.path });

    if (isFileNameMatch({ entry, pattern: /^(next|vite)\.config\./ })) {
      addAreaScore({
        candidates,
        name: 'Frontend app',
        path: ownerPathForApplicationArea({ path: entry.path }),
        score: 4,
        evidence: [entry.path],
      });
    }

    if (
      entry.type === 'directory' &&
      (normalizedPath === 'app' ||
        normalizedPath === 'pages' ||
        normalizedPath.endsWith('/app') ||
        normalizedPath.endsWith('/pages') ||
        normalizedPath.endsWith('/src/components'))
    ) {
      addAreaScore({
        candidates,
        name: 'Frontend app',
        path: ownerPathForApplicationArea({ path: entry.path }),
        score: 3,
        evidence: [entry.path],
      });
    }
  }
}

const REQUIRED_BACKEND_STRUCTURE_DIRECTORIES = [
  'routes',
  'controllers',
  'services',
] as const;

type BackendStructureDirectory =
  (typeof REQUIRED_BACKEND_STRUCTURE_DIRECTORIES)[number];

interface BackendStructureEvidence {
  path: string;
  directories: Set<BackendStructureDirectory>;
  evidence: Set<string>;
}

function backendStructureDirectoryFromEntry({
  entry,
}: {
  entry: RepoTreeEntry;
}): BackendStructureDirectory | null {
  if (entry.type !== 'directory') return null;

  const normalizedPath = normalizePath({ path: entry.path });
  const match = normalizedPath.match(
    /(^|\/)src\/(?<directory>routes|controllers|services)$/,
  );

  switch (match?.groups?.directory) {
    case 'routes':
    case 'controllers':
    case 'services':
      return match.groups.directory;
    default:
      return null;
  }
}

function getOrCreateBackendStructureEvidence({
  evidenceByOwner,
  ownerPath,
}: {
  evidenceByOwner: Map<string, BackendStructureEvidence>;
  ownerPath: string;
}): BackendStructureEvidence {
  const existingEvidence = evidenceByOwner.get(ownerPath);
  if (existingEvidence) return existingEvidence;

  const newEvidence = {
    path: ownerPath,
    directories: new Set<BackendStructureDirectory>(),
    evidence: new Set<string>(),
  } satisfies BackendStructureEvidence;

  evidenceByOwner.set(ownerPath, newEvidence);
  return newEvidence;
}

function hasCompleteBackendStructure({
  structureEvidence,
}: {
  structureEvidence: BackendStructureEvidence;
}): boolean {
  return REQUIRED_BACKEND_STRUCTURE_DIRECTORIES.every((directory) =>
    structureEvidence.directories.has(directory),
  );
}

function addBackendAreas({
  entries,
  candidates,
}: DetectedAreaRuleContext): void {
  const structureEvidenceByOwner = new Map<string, BackendStructureEvidence>();

  for (const entry of entries) {
    const structureDirectory = backendStructureDirectoryFromEntry({ entry });

    if (structureDirectory) {
      const ownerPath = ownerPathForBackendArea({ path: entry.path });
      const ownerEvidence = getOrCreateBackendStructureEvidence({
        evidenceByOwner: structureEvidenceByOwner,
        ownerPath,
      });

      ownerEvidence.directories.add(structureDirectory);
      ownerEvidence.evidence.add(entry.path);
    }

    if (isFileNameMatch({ entry, pattern: /^(server|app)\.(ts|js)$/ })) {
      addAreaScore({
        candidates,
        name: 'Backend API',
        path: ownerPathForBackendArea({ path: entry.path }),
        score: 3,
        evidence: [entry.path],
      });
    }
  }

  for (const structureEvidence of structureEvidenceByOwner.values()) {
    if (hasCompleteBackendStructure({ structureEvidence })) {
      addAreaScore({
        candidates,
        name: 'Backend API',
        path: structureEvidence.path,
        score: 6,
        evidence: [...structureEvidence.evidence],
      });
    }
  }
}

function addPackageAreas({
  entries,
  candidates,
}: DetectedAreaRuleContext): void {
  for (const entry of entries) {
    const normalizedPath = normalizePath({ path: entry.path });
    const packageMatch = normalizedPath.match(/^(packages|libs)\/[^/]+$/);

    if (entry.type === 'directory' && packageMatch) {
      addAreaScore({
        candidates,
        name: 'Shared package',
        path: entry.path,
        score: 3,
        evidence: [entry.path],
      });
    }
  }
}

function addDatabaseAreas({
  entries,
  candidates,
}: DetectedAreaRuleContext): void {
  for (const entry of entries) {
    const normalizedPath = normalizePath({ path: entry.path });

    if (
      normalizedPath === 'prisma/schema.prisma' ||
      normalizedPath.endsWith('/prisma/schema.prisma')
    ) {
      addAreaScore({
        candidates,
        name: 'Database schema',
        path: ownerPathForDatabaseArea({ path: entry.path }),
        score: 5,
        evidence: [entry.path],
      });
    }

    if (
      isFileNameMatch({ entry, pattern: /^drizzle\.config\.(ts|js|mts|mjs)$/ })
    ) {
      addAreaScore({
        candidates,
        name: 'Database schema',
        path: ownerPathForConfigArea({ path: entry.path }),
        score: 5,
        evidence: [entry.path],
      });
    }

    if (
      normalizedPath === 'drizzle' ||
      normalizedPath.startsWith('drizzle/') ||
      normalizedPath.endsWith('/drizzle') ||
      normalizedPath.includes('/drizzle/')
    ) {
      addAreaScore({
        candidates,
        name: 'Database schema',
        path: ownerPathForDatabaseArea({ path: entry.path }),
        score: entry.type === 'directory' ? 4 : 3,
        evidence: [entry.path],
      });
    }

    if (
      normalizedPath === 'db/schema.ts' ||
      normalizedPath === 'src/db/schema.ts' ||
      normalizedPath.endsWith('/db/schema.ts')
    ) {
      addAreaScore({
        candidates,
        name: 'Database schema',
        path: ownerPathForDatabaseArea({ path: entry.path }),
        score: 4,
        evidence: [entry.path],
      });
    }

    if (
      entry.type === 'directory' &&
      (normalizedPath.endsWith('/prisma/migrations') ||
        normalizedPath === 'migrations' ||
        normalizedPath.endsWith('/migrations'))
    ) {
      addAreaScore({
        candidates,
        name: 'Database schema',
        path: ownerPathForDatabaseArea({ path: entry.path }),
        score: 4,
        evidence: [entry.path],
      });
    }
  }
}

function addSupportAreas({
  entries,
  candidates,
}: DetectedAreaRuleContext): void {
  for (const entry of entries) {
    const normalizedPath = normalizePath({ path: entry.path });
    const normalizedName = entry.name.toLowerCase();

    if (normalizedPath.startsWith('.github/workflows/')) {
      addAreaScore({
        candidates,
        name: 'CI/CD workflows',
        path: '.github/workflows',
        score: 5,
        evidence: [entry.path],
      });
    }

    if (entry.type === 'directory' && normalizedPath === 'docs') {
      addAreaScore({
        candidates,
        name: 'Documentation',
        path: entry.path,
        score: 2,
        evidence: [entry.path],
      });
    }

    if (normalizedPath.startsWith('docs/')) {
      addAreaScore({
        candidates,
        name: 'Documentation',
        path: 'docs',
        score: 2,
        evidence: [entry.path],
      });
    }

    if (
      normalizedPath.startsWith('tests/') ||
      normalizedPath.includes('/__tests__/') ||
      /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(normalizedPath)
    ) {
      addAreaScore({
        candidates,
        name: 'Test suite',
        path: normalizedPath.startsWith('tests/')
          ? 'tests'
          : ownerPathForApplicationArea({ path: entry.path }),
        score: 4,
        evidence: [entry.path],
      });
    }

    if (
      normalizedName === 'dockerfile' ||
      /^docker-compose\./.test(normalizedName)
    ) {
      addAreaScore({
        candidates,
        name: 'Containerization',
        path: ownerPathForConfigArea({ path: entry.path }),
        score: 4,
        evidence: [entry.path],
      });
    }

    if (
      normalizedPath.startsWith('terraform/') ||
      normalizedPath.startsWith('infra/') ||
      normalizedPath.startsWith('infrastructure/') ||
      normalizedPath.startsWith('k8s/') ||
      normalizedPath.startsWith('kubernetes/') ||
      normalizedPath.startsWith('helm/')
    ) {
      addAreaScore({
        candidates,
        name: 'Infrastructure/config',
        path: topLevelPath({ path: entry.path }),
        score: 4,
        evidence: [entry.path],
      });
    }
  }
}

function addCliAndMobileAreas({
  entries,
  candidates,
}: DetectedAreaRuleContext): void {
  for (const entry of entries) {
    const normalizedPath = normalizePath({ path: entry.path });

    if (
      normalizedPath === 'bin' ||
      normalizedPath.startsWith('bin/') ||
      /(^|\/)cli\.(ts|js)$/.test(normalizedPath)
    ) {
      addAreaScore({
        candidates,
        name: 'CLI tooling',
        path: normalizedPath.startsWith('bin')
          ? 'bin'
          : ownerPathForConfigArea({ path: entry.path }),
        score: 5,
        evidence: [entry.path],
      });
    }

    if (
      normalizedPath === 'ios' ||
      normalizedPath.startsWith('ios/') ||
      normalizedPath === 'android' ||
      normalizedPath.startsWith('android/') ||
      entry.name.toLowerCase() === 'app.json'
    ) {
      addAreaScore({
        candidates,
        name: 'Mobile app',
        path:
          normalizedPath === 'android' || normalizedPath.startsWith('android/')
            ? 'android'
            : normalizedPath === 'ios' || normalizedPath.startsWith('ios/')
              ? 'ios'
              : ownerPathForConfigArea({ path: entry.path }),
        score: 5,
        evidence: [entry.path],
      });
    }
  }
}

/**
 * Applies all detected-area path rules to the shared candidate map.
 * Rules are grouped by repository concern so future categories can be added without bloating the public builder.
 */
export function applyDetectedAreaRules({
  entries,
  candidates,
}: DetectedAreaRuleContext): void {
  addFrontendAreas({ entries, candidates });
  addBackendAreas({ entries, candidates });
  addPackageAreas({ entries, candidates });
  addDatabaseAreas({ entries, candidates });
  addSupportAreas({ entries, candidates });
  addCliAndMobileAreas({ entries, candidates });
}
