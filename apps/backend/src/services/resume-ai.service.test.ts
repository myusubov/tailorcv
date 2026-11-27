import { ApiError } from '@google/genai';
import type { AnalyzedGithubRepository } from 'shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));

// The real client reads GEMINI_API_KEY from the environment and calls Google.
vi.mock('../lib/resume-ai-client', () => ({
  geminiClient: { models: { generateContent } },
}));

import { generateResumeContent } from './resume-ai.service';

const emptyCheck = { present: false, evidence: [] };

function makeRepo({
  id,
  isFork = false,
  description = null,
}: {
  id: number;
  isFork?: boolean;
  description?: string | null;
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
      coverage: { met: 0, total: 6 },
    },
    architectureSignals: [],
    candidateFilesToInspect: [],
    candidateFileContents: [],
  };
}

function makeProject(repoId: number) {
  return {
    repoId,
    description: 'A queue worker',
    tools: ['TypeScript'],
    bullets: [{ text: 'Built the queue worker', evidence: ['src/worker.ts'] }],
  };
}

function makeReply(overrides: Record<string, unknown> = {}) {
  return {
    headline: 'Backend Developer, TypeScript',
    summary: 'Built a queue worker in TypeScript.',
    skillGroups: [{ title: 'Languages', skills: ['TypeScript'] }],
    projects: [makeProject(1)],
    ...overrides,
  };
}

function replyWith(reply: unknown) {
  return { text: JSON.stringify(reply) };
}

describe('generateResumeContent', () => {
  beforeEach(() => {
    generateContent.mockReset();
  });

  describe('with a valid reply', () => {
    it('returns the headline, summary and skill groups the model wrote', async () => {
      generateContent.mockResolvedValue(
        replyWith(
          makeReply({
            headline: 'Full-Stack Developer, Next.js',
            summary: 'Built two apps.',
            skillGroups: [
              { title: 'Frontend', skills: ['Next.js', 'React'] },
              { title: 'Backend', skills: ['Express'] },
            ],
          }),
        ),
      );

      const content = await generateResumeContent({
        repositories: [makeRepo({ id: 1 })],
      });

      expect(content.headline).toBe('Full-Stack Developer, Next.js');
      expect(content.summary).toBe('Built two apps.');
      expect(content.skillGroups).toEqual([
        { title: 'Frontend', skills: ['Next.js', 'React'] },
        { title: 'Backend', skills: ['Express'] },
      ]);
    });

    it('takes each project name and URL from the analyzed repository, never from the model', async () => {
      generateContent.mockResolvedValue(
        replyWith(
          makeReply({
            projects: [
              {
                ...makeProject(2),
                name: 'Invented name',
                repoUrl: 'https://example.com/invented',
              },
            ],
          }),
        ),
      );

      const content = await generateResumeContent({
        repositories: [makeRepo({ id: 1 }), makeRepo({ id: 2 })],
      });

      expect(content.projects).toHaveLength(1);
      expect(content.projects[0]).toMatchObject({
        repoId: 2,
        name: 'repo-2',
        repoUrl: 'https://github.com/owner/repo-2',
      });
    });

    it('keeps the order of the projects the model returned', async () => {
      generateContent.mockResolvedValue(
        replyWith(
          makeReply({
            projects: [makeProject(3), makeProject(1), makeProject(2)],
          }),
        ),
      );

      const content = await generateResumeContent({
        repositories: [
          makeRepo({ id: 1 }),
          makeRepo({ id: 2 }),
          makeRepo({ id: 3 }),
        ],
      });

      expect(content.projects.map((project) => project.name)).toEqual([
        'repo-3',
        'repo-1',
        'repo-2',
      ]);
    });

    it('accepts the largest allowed reply: 5 skill groups, 3 projects, 3 bullets each', async () => {
      const bullets = [1, 2, 3].map((n) => ({
        text: `Bullet ${n}`,
        evidence: ['src/a.ts'],
      }));
      generateContent.mockResolvedValue(
        replyWith(
          makeReply({
            skillGroups: [1, 2, 3, 4, 5].map((n) => ({
              title: `Group ${n}`,
              skills: ['Skill'],
            })),
            projects: [1, 2, 3].map((id) => ({ ...makeProject(id), bullets })),
          }),
        ),
      );

      const content = await generateResumeContent({
        repositories: [1, 2, 3].map((id) => makeRepo({ id })),
      });

      expect(content.skillGroups).toHaveLength(5);
      expect(content.projects).toHaveLength(3);
      expect(generateContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('request', () => {
    it('asks for a JSON reply from gemini-3.5-flash-lite', async () => {
      generateContent.mockResolvedValue(replyWith(makeReply()));

      await generateResumeContent({ repositories: [makeRepo({ id: 1 })] });

      expect(generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.stringContaining('gemini-3.5-flash-lite'),
          config: expect.objectContaining({
            responseMimeType: 'application/json',
          }),
        }),
      );
    });

    it('sends the evidence of each repository by its id', async () => {
      generateContent.mockResolvedValue(replyWith(makeReply()));

      await generateResumeContent({
        repositories: [makeRepo({ id: 1 }), makeRepo({ id: 2 })],
      });

      const { contents } = generateContent.mock.calls[0][0];
      expect(contents).toContain('<repository id="1"');
      expect(contents).toContain('<repository id="2"');
    });

    it('leaves a fork out of the evidence when the evidence is over the size limit', async () => {
      generateContent.mockResolvedValue(replyWith(makeReply()));
      const own = makeRepo({ id: 1 });
      const fork = makeRepo({
        id: 2,
        isFork: true,
        description: 'x'.repeat(95_000),
      });

      await generateResumeContent({ repositories: [own, fork] });

      const { contents } = generateContent.mock.calls[0][0];
      expect(contents).toContain('<repository id="1"');
      expect(contents).not.toContain('<repository id="2"');
    });
  });

  describe('with a bad reply', () => {
    it('asks again when the reply is not valid JSON and returns the second reply', async () => {
      generateContent
        .mockResolvedValueOnce({ text: '{"headline": "cut off' })
        .mockResolvedValueOnce(
          replyWith(makeReply({ headline: 'From the second call' })),
        );

      const content = await generateResumeContent({
        repositories: [makeRepo({ id: 1 })],
      });

      expect(generateContent).toHaveBeenCalledTimes(2);
      expect(content.headline).toBe('From the second call');
    });

    it('asks again when the reply has no text', async () => {
      generateContent
        .mockResolvedValueOnce({ text: undefined })
        .mockResolvedValueOnce(replyWith(makeReply()));

      await expect(
        generateResumeContent({ repositories: [makeRepo({ id: 1 })] }),
      ).resolves.toMatchObject({ headline: 'Backend Developer, TypeScript' });
      expect(generateContent).toHaveBeenCalledTimes(2);
    });

    it('asks again when the reply names a repository that was not analyzed', async () => {
      generateContent
        .mockResolvedValueOnce(
          replyWith(makeReply({ projects: [makeProject(999)] })),
        )
        .mockResolvedValueOnce(replyWith(makeReply()));

      const content = await generateResumeContent({
        repositories: [makeRepo({ id: 1 })],
      });

      expect(generateContent).toHaveBeenCalledTimes(2);
      expect(content.projects[0].name).toBe('repo-1');
    });

    it('sends the same request again, not a changed one', async () => {
      generateContent
        .mockResolvedValueOnce({ text: 'not json' })
        .mockResolvedValueOnce(replyWith(makeReply()));

      await generateResumeContent({ repositories: [makeRepo({ id: 1 })] });

      expect(generateContent.mock.calls[1][0]).toEqual(
        generateContent.mock.calls[0][0],
      );
    });

    it('throws after exactly two calls when the second reply is bad too', async () => {
      generateContent.mockResolvedValue({ text: 'not json' });

      await expect(
        generateResumeContent({ repositories: [makeRepo({ id: 1 })] }),
      ).rejects.toBeInstanceOf(SyntaxError);
      expect(generateContent).toHaveBeenCalledTimes(2);
    });

    it('throws when the second reply names an unknown repository too', async () => {
      generateContent.mockResolvedValue(
        replyWith(makeReply({ projects: [makeProject(999)] })),
      );

      await expect(
        generateResumeContent({ repositories: [makeRepo({ id: 1 })] }),
      ).rejects.toThrow('unknown repository id 999');
      expect(generateContent).toHaveBeenCalledTimes(2);
    });

    it.each([
      ['no skill groups', { skillGroups: [] }],
      [
        'a skill group with no skills',
        { skillGroups: [{ title: 'Languages', skills: [] }] },
      ],
      [
        '6 skill groups',
        {
          skillGroups: [1, 2, 3, 4, 5, 6].map((n) => ({
            title: `Group ${n}`,
            skills: ['Skill'],
          })),
        },
      ],
      ['no projects', { projects: [] }],
      [
        '4 projects',
        { projects: [1, 2, 3, 4].map((id) => makeProject(id)) },
      ],
      [
        'a project with no bullets',
        { projects: [{ ...makeProject(1), bullets: [] }] },
      ],
      [
        'a project with 4 bullets',
        {
          projects: [
            {
              ...makeProject(1),
              bullets: [1, 2, 3, 4].map((n) => ({
                text: `Bullet ${n}`,
                evidence: ['src/a.ts'],
              })),
            },
          ],
        },
      ],
      [
        'a bullet with no evidence',
        {
          projects: [
            {
              ...makeProject(1),
              bullets: [{ text: 'Built it', evidence: [] }],
            },
          ],
        },
      ],
      ['a headline that is not a string', { headline: 42 }],
    ])('rejects a reply with %s after asking twice', async (_name, override) => {
      generateContent.mockResolvedValue(replyWith(makeReply(override)));

      await expect(
        generateResumeContent({
          repositories: [1, 2, 3, 4].map((id) => makeRepo({ id })),
        }),
      ).rejects.toThrow();
      expect(generateContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('with a Gemini error', () => {
    it.each([400, 401, 403, 404, 429, 503])(
      'rethrows a %i error without asking again',
      async (status) => {
        const error = new ApiError({ message: 'Gemini failed', status });
        generateContent.mockRejectedValue(error);

        await expect(
          generateResumeContent({ repositories: [makeRepo({ id: 1 })] }),
        ).rejects.toBe(error);
        expect(generateContent).toHaveBeenCalledTimes(1);
      },
    );

    it('rethrows a network error without asking again', async () => {
      const error = new TypeError('fetch failed');
      generateContent.mockRejectedValue(error);

      await expect(
        generateResumeContent({ repositories: [makeRepo({ id: 1 })] }),
      ).rejects.toBe(error);
      expect(generateContent).toHaveBeenCalledTimes(1);
    });

    it('rethrows an error from the second call', async () => {
      const error = new ApiError({ message: 'Overloaded', status: 503 });
      generateContent
        .mockResolvedValueOnce({ text: 'not json' })
        .mockRejectedValueOnce(error);

      await expect(
        generateResumeContent({ repositories: [makeRepo({ id: 1 })] }),
      ).rejects.toBe(error);
      expect(generateContent).toHaveBeenCalledTimes(2);
    });
  });
});
