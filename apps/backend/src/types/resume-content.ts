import type { AnalyzedGithubRepository } from 'shared';
import type { ResumeContent } from '../schemas/resume-content.schema';

export type GeneratedResumeProject = ResumeContent['projects'][number] & {
  name: string;
  repoUrl: string;
};

export type GeneratedResumeContent = Omit<ResumeContent, 'projects'> & {
  projects: GeneratedResumeProject[];
};

export type GenerateResumeContentInput = {
  repositories: AnalyzedGithubRepository[];
};
