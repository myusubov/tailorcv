import type {
  DetectedProjectArea,
  MaturitySignals,
  RepoTreeEntry,
} from './project-structure-analyzer.types';
import { LANGUAGE_FILE_EXTENSIONS } from './language-detector';
import type { DetectedAreaName } from './project-structure-detected-areas.types';
import {
  buildEntryIndex,
  type EntryIndex,
} from './project-structure-entry-index';
import { normalizePath } from './project-structure-path-utils';

const isPresent = ({
  detectedAreas,
  area,
}: {
  detectedAreas: DetectedProjectArea[];
  area: DetectedAreaName;
}): boolean => {
  return detectedAreas.some((detectedArea) => detectedArea.name === area);
};

const buildEvidence = ({
  detectedAreas,
  area,
}: {
  detectedAreas: DetectedProjectArea[];
  area: DetectedAreaName;
}): string[] => {
  return detectedAreas
    .filter((detectedArea) => detectedArea.name === area)
    .map(
      ({ path, inferredTechnologies }) =>
        `${inferredTechnologies.primary} @ ${path}`,
    )
    .sort((a, b) => a.localeCompare(b));
};

const findRatio = ({
  targetCount,
  totalCount,
}: {
  targetCount: number;
  totalCount: number;
}): number | null => {
  if (totalCount === 0) return null;

  return Math.round((targetCount / totalCount) * 100) / 100;
};

// Common test-file shapes, one regex fragment each. Paths reach the index
// already lowercased by `normalizePath`, so no case flag is needed. Every
// fragment ends in a source extension, so directory entries never match. Any
// source file under a `test/`, `tests/` or `spec/` folder counts as a test file
// (helpers and fixtures included), so files in those folders are never counted
// as source. Deliberately not matched: C# and Swift (weak naming evidence), and
// inline unit tests such as Rust `#[cfg(test)]`, which leave no path.
const TEST_FILE_PATH_FRAGMENTS = [
  // JS/TS: a.test.ts, a.spec.tsx
  String.raw`(?:^|/)[^/]+\.(?:test|spec)\.[cm]?[jt]sx?$`,
  // JS/TS: Jest treats every file under __tests__ as a test
  String.raw`(?:^|/)__tests__/.+\.[cm]?[jt]sx?$`,
  // Cypress: a.cy.ts
  String.raw`(?:^|/)[^/]+\.cy\.[cm]?[jt]sx?$`,
  // Python: test_a.py, a_test.py
  String.raw`(?:^|/)(?:test_[^/]+|[^/]+_test)\.py$`,
  // Go: a_test.go
  String.raw`(?:^|/)[^/]+_test\.go$`,
  // Ruby: RSpec a_spec.rb, Minitest a_test.rb
  String.raw`(?:^|/)[^/]+_(?:spec|test)\.rb$`,
  // Dart/Flutter: a_test.dart
  String.raw`(?:^|/)[^/]+_test\.dart$`,
  // Test folders: Maven/Gradle src/test, Mocha test/, pytest tests/, RSpec
  // spec/, PHPUnit tests/, Rust tests/ (one integration-test crate per file)
  String.raw`(?:^|/)(?:tests?|spec)/.+\.(?:${LANGUAGE_FILE_EXTENSIONS.join('|')})$`,
];

// One combined regex so an entry matching several shapes (for example
// `src/__tests__/a.test.ts`) is still counted once.
const TEST_FILE_PATTERN = new RegExp(
  `(?:${TEST_FILE_PATH_FRAGMENTS.join('|')})`,
);

// No path, or `.`, counts the whole repo. With a path, the trailing slash keeps
// `apps/web` from claiming `apps/web-admin/...`, and both sides go through
// `normalizePath` so casing matches how the index sees it.
const findTestFileCount = ({
  index,
  path,
}: {
  index: EntryIndex;
  path?: string;
}): number => {
  const testFiles = index.findEntriesByPathMatching({
    pattern: TEST_FILE_PATTERN,
  });
  if (!path || path === '.') return testFiles.length;

  const prefix = `${normalizePath({ path })}/`;
  return testFiles.filter((entry) =>
    normalizePath({ path: entry.path }).startsWith(prefix),
  ).length;
};

// A source file is a path that ends in a language extension (the shared list
// from `language-detector.ts`) and does not match any test-file shape. The
// extension requirement keeps docs, JSON, images and directories out of the
// count; the negative lookahead (`.*` first, so a shape anchored on `/` can
// match at any depth) is the exact opposite of `TEST_FILE_PATTERN`, so a file
// is never counted as both.
const SOURCE_FILE_PATTERN = new RegExp(
  `^(?!.*(?:${TEST_FILE_PATH_FRAGMENTS.join('|')})).*\\.(?:${LANGUAGE_FILE_EXTENSIONS.join('|')})$`,
);

const findSourceFileCount = ({
  index,
  path,
}: {
  index: EntryIndex;
  path?: string;
}): number => {
  const sourceFiles = index.findEntriesByPathMatching({
    pattern: SOURCE_FILE_PATTERN,
  });
  if (!path || path === '.') return sourceFiles.length;

  const prefix = `${normalizePath({ path })}/`;
  return sourceFiles.filter((entry) =>
    normalizePath({ path: entry.path }).startsWith(prefix),
  ).length;
};

const buildRepoTotals = (
  index: EntryIndex,
): MaturitySignals['testing']['repoTotals'] => {
  const testFileCount = findTestFileCount({ index });
  const sourceFileCount = findSourceFileCount({ index });

  return {
    testFileCount,
    sourceFileCount,
    ratio: findRatio({
      targetCount: testFileCount,
      totalCount: sourceFileCount,
    }),
  };
};

// Areas that describe tests, docs, tooling or a schema instead of owning
// application code. A per-area count for them would repeat another area's
// files, or the whole repo for a root workflow or a root `prisma/` folder, and
// a root one must not trigger the single-row shortcut below.
const NON_CODE_AREA_NAMES: readonly DetectedAreaName[] = [
  'Database schema',
  'Test suite',
  'Documentation',
  'CI/CD workflows',
  'Containerization',
  'Infrastructure as code',
];

const buildByArea = ({
  index,
  detectedAreas,
}: {
  index: EntryIndex;
  detectedAreas: DetectedProjectArea[];
}): MaturitySignals['testing']['byArea'] => {
  const codeAreas = detectedAreas.filter(
    (area) => !NON_CODE_AREA_NAMES.includes(area.name),
  );

  // A root code area owns the whole repo, so it becomes the only row.
  // Otherwise keep the first area for each path.
  const rootArea = codeAreas.find((area) => area.path === '.');
  const seenPaths = new Set<string>();
  const uniqueAreas = rootArea
    ? [rootArea]
    : codeAreas.filter((area) => {
        if (seenPaths.has(area.path)) return false;
        seenPaths.add(area.path);
        return true;
      });

  return uniqueAreas.map(({ path, inferredTechnologies }) => {
    const testFileCount = findTestFileCount({ index, path });
    const sourceFileCount = findSourceFileCount({ index, path });

    return {
      areaName: inferredTechnologies.primary,
      path,
      testFileCount,
      sourceFileCount,
      ratio: findRatio({
        targetCount: testFileCount,
        totalCount: sourceFileCount,
      }),
    };
  });
};

// Linter and formatter config file names, matched against the lowercased file
// name at any depth: ESLint, Prettier, Biome, Ruff, flake8, Pylint, RuboCop,
// golangci-lint and rustfmt. Deliberately not matched: tsconfig, editorconfig
// and ignore files, which do not prove a linter or formatter is configured.
const CODE_STYLE_FILE_PATTERN =
  /^(?:\.eslintrc(?:\.(?:json|js|cjs|mjs|ya?ml))?|eslint\.config\.(?:js|cjs|mjs|ts|mts|cts)|\.prettierrc(?:\.(?:json|json5|js|cjs|mjs|ya?ml|toml))?|prettier\.config\.(?:js|cjs|mjs|ts|mts|cts)|biome\.jsonc?|\.?ruff\.toml|\.flake8|\.pylintrc|\.rubocop\.yml|\.golangci\.(?:ya?ml|toml|json)|\.?rustfmt\.toml)$/;

// Lockfile names, matched against the lowercased file name at any depth: npm,
// Yarn, pnpm, Bun, Poetry, Pipenv, uv, Cargo, Bundler and Composer. Deliberately
// not matched: manifests such as `package.json`, and `go.sum`, which is a
// checksum list, not a version lock.
const LOCKFILE_PATTERN =
  /^(?:package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|poetry\.lock|pipfile\.lock|uv\.lock|cargo\.lock|gemfile\.lock|composer\.lock)$/;

/**
 * Builds the structure-derived maturity signals for one repository tree.
 * Testing, automation, deployability and documentation presence come from
 * `detectedAreas`; code style, lockfiles and test/source file counts come from
 * path matching on `entries`. Ratios are computed from the files seen, so they
 * can be off when the tree was truncated.
 */
export function buildMaturitySignals({
  entries,
  detectedAreas,
}: {
  entries: RepoTreeEntry[];
  detectedAreas: DetectedProjectArea[];
}): MaturitySignals {
  const index = buildEntryIndex(entries);
  const codeStyleFiles = index.findFilesByNameMatching({
    pattern: CODE_STYLE_FILE_PATTERN,
  });
  const lockfiles = index.findFilesByNameMatching({
    pattern: LOCKFILE_PATTERN,
  });

  const checks: Omit<MaturitySignals, 'coverage'> = {
    testing: {
      present: isPresent({ detectedAreas, area: 'Test suite' }),
      evidence: buildEvidence({ detectedAreas, area: 'Test suite' }),
      repoTotals: buildRepoTotals(index),
      byArea: buildByArea({ index, detectedAreas }),
    },
    automation: {
      present: isPresent({ detectedAreas, area: 'CI/CD workflows' }),
      evidence: buildEvidence({ detectedAreas, area: 'CI/CD workflows' }),
    },
    // Two area names feed one check, so evidence is merged and sorted again.
    deployability: {
      present:
        isPresent({ detectedAreas, area: 'Containerization' }) ||
        isPresent({ detectedAreas, area: 'Infrastructure as code' }),
      evidence: [
        ...buildEvidence({ detectedAreas, area: 'Containerization' }),
        ...buildEvidence({ detectedAreas, area: 'Infrastructure as code' }),
      ].sort((a, b) => a.localeCompare(b)),
    },
    documentation: {
      present: isPresent({ detectedAreas, area: 'Documentation' }),
      evidence: buildEvidence({ detectedAreas, area: 'Documentation' }),
    },
    codeStyle: {
      present: codeStyleFiles.length > 0,
      evidence: codeStyleFiles
        .map((entry) => entry.path)
        .sort((a, b) => a.localeCompare(b)),
    },
    dependencyPinning: {
      present: lockfiles.length > 0,
      evidence: lockfiles
        .map((entry) => entry.path)
        .sort((a, b) => a.localeCompare(b)),
    },
  };

  // Deployability counts once even though two area names feed it, so the total
  // is the number of checks, not the number of area names.
  const checkList = Object.values(checks);

  return {
    ...checks,
    coverage: {
      met: checkList.filter((check) => check.present).length,
      total: checkList.length,
    },
  };
}
