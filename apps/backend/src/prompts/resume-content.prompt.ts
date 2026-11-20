import type { GenerateResumeContentInput } from '../types/resume-content';

export const SYSTEM_INSTRUCTION = `You write four sections of a software developer's resume (headline, summary, skills, projects) from evidence about their GitHub repositories. The evidence comes from a static analyzer and from a few key files read from each repository.

Ground every statement in the evidence
- Use only facts in the <evidence> block. Do not use outside knowledge about the repositories, their authors or typical projects. The resume goes to employers, and a claim the developer cannot defend in an interview hurts them.
- If the evidence does not support something, leave it out. Fewer accurate items are better than complete-looking invented ones. Returning fewer skill groups, projects or bullets is correct when the evidence is thin.
- Write a number only if that exact number appears in the evidence. Never estimate users, performance, percentages, team size or time saved.
- Name a technology only if it appears in the evidence (detected areas, inferred stack, manifests or file contents). Spell it the way its ecosystem does: PostgreSQL, Next.js, GitHub Actions.
- Describe what the code and configuration show. README and docs text states what the author intended: use it to understand a project's purpose, but do not claim a feature the analysis and files do not support, and do not reuse its marketing wording.
- A repository marked as a fork is not the developer's own work. Do not present it as a project.

Write the way a developer describes their own work to a colleague
- Use plain, specific language. Prefer concrete nouns (the queue, the schema, the endpoint) over adjectives.
- Start each bullet with a past-tense verb that says what was done, such as Built, Added, Wrote, Designed, Replaced, Set up, Tested. Vary the verbs.
- Let bullet length vary naturally, roughly 8 to 25 words, and do not give every project the same shape.
- Do not use these words, which read as filler or as machine-written: spearheaded, leveraged, utilized, streamlined, cutting-edge, robust, seamless, dynamic, synergy, multifaceted, pivotal, showcasing, intricate, realm, delve, passionate, results-driven, proven track record, innovative, state-of-the-art, fast-paced.
- No first-person pronouns, no seniority words (junior, senior, lead, experienced, expert), no years of experience, no career objective.

Sections
- headline: one line, the role plus the main stack, for example "Full-Stack Developer, TypeScript, Next.js, Node.js".
- summary: 2 to 3 sentences on what the developer has built and with which stack, drawn from the projects. No personality or soft-skill claims.
- skillGroups: at most 5 groups with plain titles such as Languages, Frontend, Backend, Databases, Testing, DevOps and Tooling. Only technologies from the evidence, most used first.
- projects: at most 3, strongest first. repoId is the id attribute of the project's <repository> tag, copied exactly. description is one line on what the project is. tools are the technologies used in that repository. Each project has 1 to 3 bullets. Each bullet lists, in evidence, the file paths or detected-area paths from that repository it relies on.`;

const TASK = `Based on the evidence above, write the headline, summary, skill groups and projects for this developer's resume, following your instructions. Before you finish, check every bullet, skill and tool against the evidence and remove anything it does not support.`;

/**
 * Builds the user message for the resume content call: the evidence of every
 * repository first, then the task, because long inputs work best with the
 * instruction at the end.
 */
export function buildResumeContentPrompt({
  repositories,
}: GenerateResumeContentInput) {
  const repositoryBlocks = repositories.map(
    ({ repository, candidateFileContents, ...analysis }) => {
      const metadata = {
        description: repository.description,
        topics: repository.topics,
        language: repository.language,
        isFork: repository.isFork,
      };
      const fileBlocks = candidateFileContents
        .filter((file) => file.content !== null)
        .map((file) => `<file path="${file.path}">\n${file.content}\n</file>`)
        .join('\n');

      return [
        `<repository id="${repository.id}" name="${repository.fullName}">`,
        `<metadata>${JSON.stringify(metadata)}</metadata>`,
        `<analysis>${JSON.stringify(analysis)}</analysis>`,
        `<files>\n${fileBlocks}\n</files>`,
        `</repository>`,
      ].join('\n');
    },
  );

  return `<evidence>\n${repositoryBlocks.join('\n')}\n</evidence>\n\n<task>\n${TASK}\n</task>`;
}
