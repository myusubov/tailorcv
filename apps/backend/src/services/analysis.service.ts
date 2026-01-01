import { prisma } from 'src/lib';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';
import {
    CreateAnalysisJobInput,
    UpdateJobStatusInput,
    SaveAnalysisResultsInput,
    AnalysisJobWithRelations,
} from 'src/types/analysis';
import { AnalysisJob } from 'prisma/generated/client/client';
import { fetchGithubRepos } from './github.service';

/**
 * Creates a new analysis job with associated repositories
 */
export async function createAnalysisJob(
    input: CreateAnalysisJobInput
): Promise<AnalysisJob> {
    const { userId, repositoryIds } = input;

    // Fetch GitHub connection to get access token and repo details
    const githubConnection = await prisma.gitHubConnection.findUnique({
        where: { userId },
    });

    if (!githubConnection) {
        throw new AppError(
            'GitHub connection not found',
            ErrorCode.NOT_FOUND,
            404
        );
    }

    // Fetch repository details from GitHub (assuming you have them cached or fetch from GitHub API)
    const repos = await fetchGithubRepos(githubConnection.accessToken);

    // Filter to only the selected repositories
    const selectedRepos = repos.filter((repo) => repositoryIds.includes(repo.id));
    // Validate that all requested repos were found
    if (selectedRepos.length !== repositoryIds.length) {
        throw new AppError(
            'Some repositories not found',
            ErrorCode.NOT_FOUND,
            404
        );
    }
    // Create the analysis job with actual repo details
    const job = await prisma.analysisJob.create({
        data: {
            userId,
            status: 'PENDING' as const,
            repositories: {
                create: selectedRepos.map((repo) => ({
                    githubRepoId: repo.id,
                    repoName: repo.name,
                    repoOwner: repo.owner.login,
                    repoUrl: repo.html_url,
                    status: 'PENDING' as const,
                })),
            },
        },
        include: {
            repositories: true,
        },
    });


    return job;
}

/**
 * Updates the status of an analysis job
 */
export async function updateJobStatus(
    input: UpdateJobStatusInput
): Promise<void> {
    const { jobId, status, errorMessage } = input;

    await prisma.analysisJob.update({
        where: { id: jobId },
        data: {
            status,
            errorMessage,
            completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined,
        },
    });
}

/**
 * Retrieves an analysis job by ID with all relations
 */
export async function getAnalysisJob(
    jobId: string
): Promise<AnalysisJobWithRelations> {
    const job = await prisma.analysisJob.findUnique({
        where: { id: jobId },
        include: {
            repositories: {
                select: {
                    id: true,
                    githubRepoId: true,
                    repoName: true,
                    repoOwner: true,
                    status: true,
                    commits: true,
                    pullRequests: true,
                    techStack: true,
                },
            },
            results: {
                select: {
                    bullets: true,
                    summary: true,
                    topSkills: true,
                },
            },
        },
    });

    if (!job) {
        throw new AppError('Analysis job not found', ErrorCode.NOT_FOUND, 404);
    }

    return job as AnalysisJobWithRelations;
}

/**
 * Saves the final analysis results (AI-generated bullets)
 */
export async function saveAnalysisResults(
    input: SaveAnalysisResultsInput
): Promise<void> {
    const { jobId, bullets, summary, topSkills } = input;

    await prisma.analysisResult.create({
        data: {
            jobId,
            bullets: bullets as any, // Prisma Json type
            summary,
            topSkills: topSkills || [],
        },
    });
}

/**
 * Gets all analysis jobs for a user
 */
export async function getUserAnalysisJobs(
    userId: string
): Promise<AnalysisJob[]> {
    return prisma.analysisJob.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            repositories: true,
        },
    });
}
