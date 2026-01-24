import { logger, prisma } from '../lib';
import {
  baseResumeDataSchema,
  ErrorCode,
  openAiResumeSchema,
  type GitHubRepo,
} from 'shared';
import type { GitHubCommit, GitHubPullRequest } from '../types/github';
import type {
  GetOnboardingStatusInput,
  OnboardingStatus,
  GenerateOnboardingInput,
  GenerateOnboardingOutput,
  GenerateOnboardingAboutMeInput,
  GenerateOnboardingGithubInput,
} from '../types/onboarding';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { openai } from '../lib/openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { aiExtractionResponseSchema } from '../schemas/ai-extraction.schema';

/**
 * Checks if user has completed onboarding (has a base resume)
 * @param input - User's Clerk ID
 * @returns Onboarding status with latest resume ID if exists
 */
export async function getOnboardingStatus(
  input: GetOnboardingStatusInput,
): Promise<OnboardingStatus> {
  const latestBaseResume = await prisma.baseResume.findFirst({
    where: { userId: input.clerkUserId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });

  return {
    hasBaseResume: Boolean(latestBaseResume),
    latestBaseResumeId: latestBaseResume?.id ?? null,
  };
}

/**
 * Generates a base resume from raw "About Me" text using AI extraction
 * Uses GPT-4o-mini to parse unstructured text into structured resume data
 * @param input - User ID and raw text content
 * @returns Generated resume data and metadata
 * @throws AppError if AI determines data is insufficient or parsing fails
 */
export async function generateFromAboutMe(
  input: GenerateOnboardingAboutMeInput,
): Promise<GenerateOnboardingOutput> {
  const { clerkUserId, text: rawText } = input;

  const model = 'gpt-4o-mini';
  const system = env.OPENAI_ONBOARDING_SYSTEM_PROMPT;

  logger.info(
    {
      clerkUserId,
      textLength: rawText.length,
    },
    'AI generation attempt for user (About Me)',
  );

  const truncatedText = rawText.slice(0, 30000); // Token safety
  const prompt = `SOURCE MATERIAL (Raw Text from CV/Profile):\n---\n${truncatedText}\n---\n\nCRITICAL INSTRUCTION:\n1. PARSE EVERYTHING: Extract as much detail as possible from the text above into the resume schema.\n2. DATA SUFFICIENCY: Set "_isDataSufficient" to false if critical info like project/experience START DATES or basic career context is missing. Provide reasoning in "_insufficientReason" (or empty string if sufficient).\n3. DATE FORMAT: All dates MUST be in "YYYY-MM" format. If you only have a year, use "YYYY-01". Every project/experience MUST have a startDate.\n4. BOOLEAN FIELDS: "isCurrent" must be true for ongoing items, false otherwise.`;

  const response = await openai.chat.completions.parse({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    response_format: zodResponseFormat(
      aiExtractionResponseSchema,
      'resume_extraction',
    ),
    temperature: 0,
  });

  const parsedResponse = response.choices[0].message.parsed;

  if (!parsedResponse) {
    throw new AppError(
      'AI failed to provide a valid response format',
      ErrorCode.AI_GENERATION_ERROR,
      500,
    );
  }

  if (parsedResponse._isDataSufficient === false) {
    const reason = parsedResponse._insufficientReason || 'Insufficient data';
    logger.info(
      { clerkUserId, reason },
      'AI noted source material is weak, proceeding with draft creation anyway',
    );
  }

  // Fetch the user's "ground truth" identity from the DB
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { firstName: true, lastName: true, email: true },
  });

  // Enrich the AI data with the actual user profile
  const enrichedData = {
    ...parsedResponse.data,
    contact: {
      ...parsedResponse.data.contact,
      firstName:
        user?.firstName || parsedResponse.data.contact?.firstName || '',
      lastName: user?.lastName || parsedResponse.data.contact?.lastName || '',
      email: user?.email || parsedResponse.data.contact?.email || '',
    },
  };

  logger.info(
    {
      clerkUserId,
      finishReason: response.choices[0].finish_reason,
    },
    'Successfully extracted resume data draft from raw text',
  );

  // Apply strict validation and transforms before saving
  const validatedData = baseResumeDataSchema.parse(enrichedData);

  const baseResume = await prisma.baseResume.create({
    data: {
      userId: clerkUserId,
      name: 'Initial Resume (Draft)',
      data: validatedData,
      status: 'DRAFT',
    },
  });

  return {
    baseResumeId: baseResume.id,
    data: enrichedData,
    rawAiResponse: parsedResponse,
    meta: { model, finishReason: response.choices[0].finish_reason },
  };
}

/**
 * Generates a base resume from structured onboarding form data
 * Uses GPT-4o-mini with strict schema validation
 * @param input - User ID and onboarding form body
 * @returns Generated resume data and metadata
 * @throws AppError if AI generation or validation fails
 */
export async function generateOnboarding(
  input: GenerateOnboardingInput,
): Promise<GenerateOnboardingOutput> {
  const { clerkUserId, body } = input;

  const model = 'gpt-4o-mini';
  const system = env.OPENAI_ONBOARDING_SYSTEM_PROMPT;

  // DIRECT INPUT: No compression, no modifications
  const prompt = `Onboarding form input (JSON):\n${JSON.stringify(body, null, 2)}`;

  logger.info(
    `AI generation (OpenAI Structured) starting for user ${clerkUserId}`,
  );

  const response = await openai.chat.completions.parse({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    response_format: zodResponseFormat(openAiResumeSchema, 'resume'),
    temperature: 0,
  });

  const rawData = response.choices[0].message.parsed;

  if (!rawData) {
    throw new AppError(
      'AI failed to generate structured data',
      ErrorCode.AI_GENERATION_ERROR,
      500,
      { refusal: response.choices[0].message.refusal },
    );
  }

  logger.info({ aiResponse: rawData }, 'Structured AI Response');

  // DIRECT VALIDATION: No fixes, no cleaning.
  // If AI gives bad data (like empty strings for URLs), it WILL fail here.
  const validation = baseResumeDataSchema.safeParse(rawData);

  if (!validation.success) {
    logger.error(
      {
        errors: validation.error.issues,
        rawData,
      },
      'AI Response failed strict validation',
    );

    throw new AppError(
      'AI-generated data failed strict validation',
      ErrorCode.AI_GENERATION_ERROR,
      500,
      {
        validationErrors: validation.error.issues,
        rawAiResponse: rawData,
      },
    );
  }

  // Fetch the user's "ground truth" identity from the DB
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { firstName: true, lastName: true, email: true },
  });

  // Enrich the AI data with the actual user profile
  const enrichedData = {
    ...validation.data,
    contact: {
      ...validation.data.contact,
      firstName: user?.firstName || validation.data.contact?.firstName || '',
      lastName: user?.lastName || validation.data.contact?.lastName || '',
      email: user?.email || validation.data.contact?.email || '',
    },
  };

  const baseResume = await prisma.baseResume.create({
    data: {
      userId: clerkUserId,
      name: 'Initial Resume (Draft)',
      data: enrichedData,
      status: 'DRAFT',
    },
  });

  return {
    baseResumeId: baseResume.id,
    data: enrichedData,
    rawAiResponse: rawData,
    meta: {
      model,
      finishReason: response.choices[0].finish_reason,
    },
  };
}

/**
 * Generates a base resume from GitHub repository data
 * Fetches commits, PRs, and tech stack from selected repositories
 * Uses GPT-4o-mini to convert GitHub activity into resume format
 * @param input - User ID and repository IDs
 * @returns Generated resume data and metadata
 * @throws AppError if GitHub data fetch or AI generation fails
 */
export async function generateFromGithub(
  input: GenerateOnboardingGithubInput,
): Promise<GenerateOnboardingOutput> {
  const { clerkUserId, repositoryIds } = input;

  const model = 'gpt-4o-mini';
  const system = env.OPENAI_ONBOARDING_SYSTEM_PROMPT;

  logger.info(
    {
      clerkUserId,
      repositoryCount: repositoryIds.length,
    },
    'AI generation attempt for user (GitHub)',
  );

  // Import GitHub service functions
  const {
    getGithubConnection,
    fetchGithubRepos,
    fetchRepoCommits,
    fetchRepoPullRequests,
    detectRepoTechStack,
  } = await import('./github.service');

  // Get user's GitHub access token
  const githubConnection = await getGithubConnection(clerkUserId);
  if (!githubConnection) {
    throw new AppError('GitHub connection not found', ErrorCode.NOT_FOUND, 404);
  }

  const accessToken = githubConnection.accessToken;

  // Since we don't have a Repository table, we'll fetch metadata from GitHub
  // or use the repositoryIds to fetch specific repo details.
  // For now, we'll fetch all user repos and filter to match the requested IDs.
  const allUserRepos = await fetchGithubRepos(accessToken);
  const repositories = allUserRepos.filter((repo: GitHubRepo) =>
    repositoryIds.includes(String(repo.id)),
  );

  if (repositories.length === 0) {
    throw new AppError('No repositories found', ErrorCode.NOT_FOUND, 404);
  }

  // Fetch GitHub data for each repository
  const githubData = await Promise.all(
    repositories.map(async (repo: GitHubRepo) => {
      const owner = repo.owner.login;
      const repoName = repo.name;

      const [commits, prs, techStack] = await Promise.all([
        fetchRepoCommits({
          accessToken,
          owner,
          repo: repoName,
          limit: 50, // Limit to recent commits
        }),
        fetchRepoPullRequests({
          accessToken,
          owner,
          repo: repoName,
          limit: 20, // Limit to recent PRs
        }),
        detectRepoTechStack({
          accessToken,
          owner,
          repo: repoName,
        }),
      ]);

      return {
        repository: repo,
        commits,
        pullRequests: prs,
        techStack,
      };
    }),
  );

  // Aggregate all data
  const allCommits = githubData.flatMap((d) => d.commits);
  const allPRs = githubData.flatMap((d) => d.pullRequests);
  const allTechStack = [
    ...new Set(githubData.flatMap((d) => d.techStack)),
  ] as string[];

  logger.info(
    {
      clerkUserId,
      totalCommits: allCommits.length,
      totalPRs: allPRs.length,
      techStack: allTechStack,
    },
    'GitHub data fetched successfully',
  );

  // Create prompt from GitHub data
  const prompt = `SOURCE MATERIAL (GitHub Activity):

REPOSITORIES:
${githubData.map((d) => `- ${d.repository.full_name}: ${d.repository.description || 'No description'}`).join('\n')}

TECH STACK:
${allTechStack.join(', ')}

RECENT COMMITS (${allCommits.length} total):
${allCommits
  .slice(0, 30)
  .map((c: GitHubCommit) => `- ${c.commit.message} (${c.commit.author.date})`)
  .join('\n')}

PULL REQUESTS (${allPRs.length} total):
${allPRs
  .slice(0, 15)
  .map(
    (pr: GitHubPullRequest) => `- ${pr.title}: ${pr.body || 'No description'}`,
  )
  .join('\n')}

CRITICAL INSTRUCTION:
1. CONVERT TO RESUME: Transform the GitHub activity above into professional resume format
2. PROJECTS: Create project entries from the repositories, highlighting key contributions
3. SKILLS: Extract technical skills from the tech stack and commit messages
4. EXPERIENCE: If commits show professional patterns, create experience entries
5. DATES: Use commit dates to infer project timelines (format: "YYYY-MM")
6. IMPACT: Highlight meaningful contributions, not just "fixed bugs"`;

  const response = await openai.chat.completions.parse({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    response_format: zodResponseFormat(
      aiExtractionResponseSchema,
      'resume_extraction',
    ),
    temperature: 0.3, // Slightly higher for creative resume writing
  });

  const parsedResponse = response.choices[0].message.parsed;

  if (!parsedResponse) {
    throw new AppError(
      'AI failed to provide a valid response format',
      ErrorCode.AI_GENERATION_ERROR,
      500,
    );
  }

  if (parsedResponse._isDataSufficient === false) {
    const reason =
      parsedResponse._insufficientReason || 'Insufficient GitHub data';
    logger.info(
      { clerkUserId, reason },
      'AI noted GitHub data is sparse, proceeding with draft anyway',
    );
  }

  // Fetch the user's "ground truth" identity from the DB
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { firstName: true, lastName: true, email: true },
  });

  // Enrich the AI data with the actual user profile
  const enrichedData = {
    ...parsedResponse.data,
    contact: {
      ...parsedResponse.data.contact,
      firstName:
        user?.firstName || parsedResponse.data.contact?.firstName || '',
      lastName: user?.lastName || parsedResponse.data.contact?.lastName || '',
      email: user?.email || parsedResponse.data.contact?.email || '',
    },
  };

  logger.info(
    {
      clerkUserId,
      finishReason: response.choices[0].finish_reason,
    },
    'Successfully generated resume draft from GitHub data',
  );

  // Apply strict validation and transforms before saving
  const validatedData = baseResumeDataSchema.parse(enrichedData);

  const baseResume = await prisma.baseResume.create({
    data: {
      userId: clerkUserId,
      name: 'GitHub Resume (Draft)',
      data: validatedData,
      status: 'DRAFT',
    },
  });

  return {
    baseResumeId: baseResume.id,
    data: enrichedData,
    rawAiResponse: parsedResponse,
    meta: { model, finishReason: response.choices[0].finish_reason },
  };
}
