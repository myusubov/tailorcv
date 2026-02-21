import type { BaseResumeData } from 'shared';

export type BaseResume = {
  id: string;
  userId: string;
  name: string;
  data: BaseResumeData;
  createdAt: string;
  updatedAt: string;
};

/**
 * Possible statuses for a resume section analysis.
 */
export type AnalysisStatus = 'complete' | 'incomplete' | 'missing';

/**
 * Represents the analysis result for a single resume section.
 */
export interface AnalysisItem {
  /** The name of the section (e.g., "Contact", "Skills") */
  section: string;
  /** The completeness status of this section */
  status: AnalysisStatus;
  /** A human-readable message describing the status */
  message: string;
  /** Optional count of items in the section */
  count?: number;
}

/**
 * Result of the useResumeAnalysis hook.
 */
export interface ResumeAnalysisResult {
  /** Array of analysis results for each section */
  items: AnalysisItem[];
  /** Number of complete sections */
  completeCount: number;
  /** Total number of sections analyzed */
  totalCount: number;
  /** Completion percentage (0-100) */
  progressPct: number;
}

export interface UpdateResumeInput {
  id: string;
  name?: string;
  data: BaseResumeData;
}
