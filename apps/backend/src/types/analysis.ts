import { AnalysisJob, AnalysisJobStatus } from "prisma/generated/client/client";
export interface CreateAnalysisJobInput {
  userId: string;
  repositoryIds: number[];
}

export interface UpdateJobStatusInput {
  jobId: string;
  status: AnalysisJobStatus;
  errorMessage?: string;
}

export interface SaveAnalysisResultsInput {
  jobId: string;
  bullets: ResumeBullet[];
  summary?: string;
  topSkills?: string[];
}

export interface ResumeBullet {
  text: string;
  impact: string;
  repo: string;
  approved: boolean;
}

export interface AnalysisJobWithRelations extends AnalysisJob {
  repositories: Array<{
    id: string;
    githubRepoId: number;
    repoName: string;
    repoOwner: string;
    status: string;
    commits?: any;
    pullRequests?: any;
    techStack?: string[];
  }>;
  results?: {
    bullets: ResumeBullet[];
    summary?: string;
    topSkills?: string[];
  } | null;
}

export interface AnalysisJobPayload {
  jobId: string;
}
