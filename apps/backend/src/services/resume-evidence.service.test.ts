import type { AnalyzedGithubRepository } from 'shared';
import { describe, expect, it } from 'vitest';

import {
  getCandidateFileTier,
  getTierTwoRank,
  isAgentInstructionFile,
  isArchitectureOrDesignFile,
  TIER_TWO_TYPE_COUNT,
} from './github-analysis/project-structure/project-structure-candidate-files';
import {
  capEvidence,
  getEvidenceSize,
  MAX_EVIDENCE_CHARACTERS,
  truncateFileContent,
} from './resume-evidence.service';

type TestFile = { path: string; content: string | null };

const emptyCheck = { present: false, evidence: [] };

function makeRepo({
  id,
  isFork = false,
  met = 0,
  description = null,
  files: repoFiles = [],
}: {
  id: number;
  isFork?: boolean;
  met?: number;
  description?: string | null;
  files?: TestFile[];
}): AnalyzedGithubRepository {
  return {
    repository: {
      id,
      name: `repo-${id}`,
      fullName: `owner/repo-${id}`,
      description,
      htmlUrl: `https://github.com/owner/repo-${id}`,
      topics: [],
      isFork,
      language: null,
    },
    summary: {
      projectShape: 'backend api',
      inferredStack: [],
      totalFiles: 1,
      topLevelFolders: [],
      maxDepth: 1,
      isTreeTruncated: false,
      detectedLanguages: [],
      rootManifests: [],
    },
    detectedAreas: [],
    maturitySignals: {
      testing: {
        ...emptyCheck,
        repoTotals: { testFileCount: 0, sourceFileCount: 0, ratio: null },
        byArea: [],
      },
      automation: emptyCheck,
      deployability: emptyCheck,
      documentation: emptyCheck,
      codeStyle: emptyCheck,
      dependencyPinning: emptyCheck,
      coverage: { met, total: 6 },
    },
    architectureSignals: [],
    candidateFilesToInspect: repoFiles.map((entry) => entry.path),
    candidateFileContents: repoFiles,
  };
}

// A file of exactly 4,000 characters, which the per-file cut leaves unchanged.
function file(path: string): TestFile {
  return { path, content: 'x'.repeat(4_000) };
}

function files(count: number, makePath: (index: number) => string) {
  return Array.from({ length: count }, (_, index) => file(makePath(index)));
}

function pathsOf(repo: AnalyzedGithubRepository) {
  return repo.candidateFileContents.map((entry) => entry.path);
}

function expectOverLimit(repositories: AnalyzedGithubRepository[]) {
  expect(getEvidenceSize(repositories)).toBeGreaterThan(
    MAX_EVIDENCE_CHARACTERS,
  );
}

function expectUnderLimit(repositories: AnalyzedGithubRepository[]) {
  expect(getEvidenceSize(repositories)).toBeLessThanOrEqual(
    MAX_EVIDENCE_CHARACTERS,
  );
}

describe('truncateFileContent', () => {
  it('returns null for null and for an empty file', () => {
    expect(truncateFileContent(null)).toBeNull();
    expect(truncateFileContent('')).toBeNull();
  });

  it('returns a file of exactly 4,000 characters unchanged', () => {
    const content = 'a'.repeat(4_000);

    expect(truncateFileContent(content)).toBe(content);
  });

  it('cuts a longer file at the end of the last whole line', () => {
    const line = 'a'.repeat(100);
    const content = Array(60).fill(line).join('\n');

    // 101 characters per line with its break: 39 whole lines fit in 4,000.
    expect(truncateFileContent(content)).toBe(Array(39).fill(line).join('\n'));
  });

  it('cuts at 4,000 characters when the file has no line break', () => {
    expect(truncateFileContent('b'.repeat(5_000))).toBe('b'.repeat(4_000));
  });

  it('cuts at 4,000 characters when the only line break is at the very start', () => {
    expect(truncateFileContent(`\n${'c'.repeat(5_000)}`)).toHaveLength(4_000);
  });

  it('removes an emoji that the cut splits in half', () => {
    const content = `${'a'.repeat(3_999)}😀${'b'.repeat(100)}`;

    expect(truncateFileContent(content)).toBe('a'.repeat(3_999));
  });

  it('keeps an emoji that fits completely before the cut', () => {
    const content = `${'a'.repeat(3_998)}😀${'b'.repeat(100)}`;

    expect(truncateFileContent(content)).toBe(`${'a'.repeat(3_998)}😀`);
  });
});

describe('getCandidateFileTier', () => {
  it.each([
    ['README.md', 1],
    ['AGENTS.md', 1],
    ['CLAUDE.md', 1],
    ['ARCHITECTURE.md', 1],
    ['DESIGN.md', 1],
    ['docs/index.md', 3],
    ['docs/architecture.md', 3],
    ['docs/guide/overview.md', 3],
    ['packages/api/ARCHITECTURE.md', 3],
    ['schema.prisma', 2],
    ['apps/web/app/page.tsx', 2],
    ['src/users/user.model.ts', 2],
  ])('puts %s in tier %i', (path, tier) => {
    expect(getCandidateFileTier(path)).toBe(tier);
  });
});

describe('isAgentInstructionFile', () => {
  it.each([
    ['AGENTS.md', true],
    ['claude.md', true],
    ['docs/CLAUDE.md', true],
    ['README.md', false],
    ['AGENTS.mdx', false],
  ])('%s gives %s', (path, expected) => {
    expect(isAgentInstructionFile(path)).toBe(expected);
  });
});

describe('isArchitectureOrDesignFile', () => {
  it.each([
    ['docs/architecture.md', true],
    ['docs/DESIGN.mdx', true],
    ['docs/index.md', false],
    ['design/index.md', false],
  ])('%s gives %s', (path, expected) => {
    expect(isArchitectureOrDesignFile(path)).toBe(expected);
  });
});

describe('getTierTwoRank', () => {
  it('ranks schema first and page last, in the agreed priority order', () => {
    expect(TIER_TWO_TYPE_COUNT).toBe(5);
    expect(getTierTwoRank('schema.prisma')).toBe(0);
    expect(getTierTwoRank('user.model.ts')).toBe(1);
    expect(getTierTwoRank('user.controller.ts')).toBe(2);
    expect(getTierTwoRank('layout.tsx')).toBe(3);
    expect(getTierTwoRank('page.tsx')).toBe(4);
  });
});

describe('capEvidence', () => {
  describe('when the evidence is under the limit', () => {
    it('cuts every file to 4,000 characters and removes nothing', () => {
      const longReadme = Array(100).fill('a'.repeat(99)).join('\n');
      const repo = makeRepo({
        id: 1,
        files: [
          { path: 'README.md', content: longReadme },
          { path: 'schema.prisma', content: 'b'.repeat(500) },
        ],
      });

      const [result] = capEvidence([repo]);

      expect(pathsOf(result)).toEqual(['README.md', 'schema.prisma']);
      expect(result.candidateFileContents[0].content?.length).toBeLessThanOrEqual(
        4_000,
      );
      expect(result.candidateFileContents[1].content).toBe('b'.repeat(500));
    });
  });

  describe('when the evidence is over the limit', () => {
    it('drops forks first and keeps every file of the other repositories', () => {
      const own = makeRepo({
        id: 1,
        files: files(5, (index) => `src/m${index}/user.model.ts`),
      });
      const fork = makeRepo({
        id: 2,
        isFork: true,
        files: files(20, (index) => `src/m${index}/user.model.ts`),
      });
      expectOverLimit([own, fork]);

      const result = capEvidence([own, fork]);

      expect(result.map((repo) => repo.repository.id)).toEqual([1]);
      expect(pathsOf(result[0])).toHaveLength(5);
    });

    it('removes the non-architecture docs files before the architecture ones', () => {
      const repo = makeRepo({
        id: 1,
        files: [
          file('README.md'),
          ...files(14, (index) => `docs/p${index}/index.md`),
          file('docs/architecture.md'),
          ...files(8, (index) => `src/m${index}/user.model.ts`),
        ],
      });
      expectOverLimit([repo]);

      const [result] = capEvidence([repo]);
      const paths = pathsOf(result);

      expect(paths.filter((path) => path.endsWith('/index.md'))).toEqual([]);
      expect(paths).toContain('docs/architecture.md');
      expect(paths).toContain('README.md');
      expect(paths).toHaveLength(10);
      expectUnderLimit([result]);
    });

    it('removes the architecture docs files too when that is still not enough', () => {
      const repo = makeRepo({
        id: 1,
        files: [
          file('README.md'),
          ...files(2, (index) => `docs/p${index}/index.md`),
          file('docs/architecture.md'),
          ...files(9, (index) => `docs/s${index}/architecture.md`),
          ...files(12, (index) => `src/m${index}/user.model.ts`),
        ],
      });
      expectOverLimit([repo]);

      const [result] = capEvidence([repo]);
      const paths = pathsOf(result);

      expect(paths.filter((path) => getCandidateFileTier(path) === 3)).toEqual(
        [],
      );
      expect(paths).toHaveLength(13);
      expect(paths).toContain('README.md');
      expectUnderLimit([result]);
    });

    it('removes AGENTS.md and CLAUDE.md before any tier 2 file', () => {
      const repo = makeRepo({
        id: 1,
        files: [
          file('README.md'),
          file('AGENTS.md'),
          file('CLAUDE.md'),
          ...files(20, (index) => `src/m${index}/user.model.ts`),
        ],
      });
      expectOverLimit([repo]);

      const [result] = capEvidence([repo]);
      const paths = pathsOf(result);

      expect(paths).not.toContain('AGENTS.md');
      expect(paths).not.toContain('CLAUDE.md');
      expect(paths).toHaveLength(21);
      expectUnderLimit([result]);
    });

    it('removes page files before any other tier 2 file', () => {
      const repo = makeRepo({
        id: 1,
        files: [
          file('README.md'),
          file('prisma/schema.prisma'),
          ...files(4, (index) => `src/db/m${index}.model.ts`),
          ...files(4, (index) => `src/api/c${index}.controller.ts`),
          ...files(4, (index) => `src/app/l${index}/layout.tsx`),
          ...files(10, (index) => `src/app/p${index}/page.tsx`),
        ],
      });
      expectOverLimit([repo]);

      const [result] = capEvidence([repo]);
      const paths = pathsOf(result);

      expect(paths.filter((path) => path.endsWith('page.tsx'))).toEqual([]);
      expect(paths.filter((path) => path.endsWith('layout.tsx'))).toHaveLength(
        4,
      );
      expect(paths).toHaveLength(14);
      expectUnderLimit([result]);
    });

    it('moves on to layout files only when removing pages is not enough', () => {
      const repo = makeRepo({
        id: 1,
        files: [
          file('README.md'),
          file('prisma/schema.prisma'),
          ...files(4, (index) => `src/db/m${index}.model.ts`),
          ...files(4, (index) => `src/api/c${index}.controller.ts`),
          ...files(14, (index) => `src/app/l${index}/layout.tsx`),
          ...files(2, (index) => `src/app/p${index}/page.tsx`),
        ],
      });
      expectOverLimit([repo]);

      const [result] = capEvidence([repo]);
      const paths = pathsOf(result);

      expect(paths.filter((path) => path.endsWith('page.tsx'))).toEqual([]);
      expect(paths.filter((path) => path.endsWith('layout.tsx'))).toEqual([]);
      expect(paths).toHaveLength(10);
      expectUnderLimit([result]);
    });

    it('never removes the README', () => {
      const repo = makeRepo({
        id: 1,
        files: [
          file('README.md'),
          ...files(10, (index) => `src/app/p${index}/page.tsx`),
          ...files(10, (index) => `src/app/l${index}/layout.tsx`),
          ...files(10, (index) => `src/api/c${index}.controller.ts`),
          ...files(10, (index) => `src/db/m${index}.model.ts`),
        ],
      });
      expectOverLimit([repo]);

      const [result] = capEvidence([repo]);

      expect(pathsOf(result)).toContain('README.md');
      expectUnderLimit([result]);
    });

    it('removes a file from candidateFilesToInspect together with its contents', () => {
      const repo = makeRepo({
        id: 1,
        files: [
          file('README.md'),
          ...files(14, (index) => `docs/p${index}/index.md`),
          file('docs/architecture.md'),
          ...files(8, (index) => `src/m${index}/user.model.ts`),
        ],
      });

      const [result] = capEvidence([repo]);

      expect(result.candidateFilesToInspect).toEqual(pathsOf(result));
    });

    it('drops the weakest repositories first, only as many as needed', () => {
      const huge = 'x'.repeat(40_000);
      const repos = [
        makeRepo({ id: 1, met: 3, description: huge }),
        makeRepo({ id: 2, met: 1, description: huge }),
        makeRepo({ id: 3, met: 2, description: huge }),
      ];
      expectOverLimit(repos);

      const result = capEvidence(repos);

      expect(result.map((repo) => repo.repository.id)).toEqual([1, 3]);
      expectUnderLimit(result);
    });

    it('keeps the last repository even when it is still over the limit', () => {
      const huge = 'x'.repeat(100_000);
      const repos = [
        makeRepo({ id: 1, met: 5, description: huge }),
        makeRepo({ id: 2, met: 1, description: huge }),
      ];

      const result = capEvidence(repos);

      expect(result.map((repo) => repo.repository.id)).toEqual([1]);
    });

    it('characterization: returns an empty list when every repository is a fork', () => {
      const huge = 'x'.repeat(40_000);
      const repos = [1, 2, 3].map((id) =>
        makeRepo({ id, isFork: true, description: huge }),
      );
      expectOverLimit(repos);

      expect(capEvidence(repos)).toEqual([]);
    });

    it('does not change its input', () => {
      const repo = makeRepo({
        id: 1,
        files: [
          file('README.md'),
          ...files(14, (index) => `docs/p${index}/index.md`),
          file('docs/architecture.md'),
          ...files(8, (index) => `src/m${index}/user.model.ts`),
        ],
      });
      const snapshot = structuredClone([repo]);

      capEvidence([repo]);

      expect([repo]).toEqual(snapshot);
    });
  });
});
