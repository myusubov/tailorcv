import { useMemo } from 'react';
import type { BaseResumeData } from 'shared';
import type { AnalysisItem, ResumeAnalysisResult } from '@/lib/types/resumes';

/**
 * Analyzes a single contact section for completeness.
 */
function analyzeContact(contact: BaseResumeData['contact']): AnalysisItem {
  const hasName = !!(contact?.firstName && contact?.lastName);
  const hasEmail = !!contact?.email;
  const hasPhone = !!contact?.phone;
  const hasLocation = !!contact?.location;

  if (!hasName || !hasEmail) {
    return {
      section: 'Contact',
      status: 'missing',
      message: !hasName ? 'Name is required' : 'Email is required',
    };
  }

  if (!hasPhone && !hasLocation) {
    return {
      section: 'Contact',
      status: 'incomplete',
      message: 'Consider adding phone or location',
    };
  }

  return {
    section: 'Contact',
    status: 'complete',
    message: 'All contact info provided',
  };
}

/**
 * Analyzes the summary section for completeness.
 */
function analyzeSummary(summary: string | undefined | null): AnalysisItem {
  if (!summary || summary.trim().length === 0) {
    return {
      section: 'Summary',
      status: 'missing',
      message: 'No professional summary',
    };
  }

  if (summary.trim().length < 50) {
    return {
      section: 'Summary',
      status: 'incomplete',
      message: 'Summary is too short',
    };
  }

  return {
    section: 'Summary',
    status: 'complete',
    message: `${summary.trim().split(/\s+/).length} words`,
  };
}

/**
 * Analyzes the skills section for completeness.
 */
function analyzeSkills(
  skills: BaseResumeData['skills'] | undefined,
): AnalysisItem {
  const count = skills?.length ?? 0;

  if (count === 0) {
    return {
      section: 'Skills',
      status: 'missing',
      message: 'No skills added',
    };
  }

  if (count < 3) {
    return {
      section: 'Skills',
      status: 'incomplete',
      message: `Only ${count} skill${count === 1 ? '' : 's'}`,
      count,
    };
  }

  return {
    section: 'Skills',
    status: 'complete',
    message: `${count} skills`,
    count,
  };
}

/**
 * Analyzes the experience section for completeness.
 */
function analyzeExperience(
  experiences: BaseResumeData['experiences'] | undefined,
): AnalysisItem {
  const count = experiences?.length ?? 0;

  if (count === 0) {
    return {
      section: 'Experience',
      status: 'missing',
      message: 'No work experience',
    };
  }

  const hasIncomplete = experiences?.some(
    (exp) => !exp.company || !exp.title || (exp.bullets || []).length === 0,
  );

  if (hasIncomplete) {
    return {
      section: 'Experience',
      status: 'incomplete',
      message: `${count} entries, some missing details`,
      count,
    };
  }

  return {
    section: 'Experience',
    status: 'complete',
    message: `${count} position${count === 1 ? '' : 's'}`,
    count,
  };
}

/**
 * Analyzes the projects section for completeness.
 */
function analyzeProjects(
  projects: BaseResumeData['projects'] | undefined,
): AnalysisItem {
  const count = projects?.length ?? 0;

  if (count === 0) {
    return {
      section: 'Projects',
      status: 'missing',
      message: 'No projects added',
    };
  }

  const hasIncomplete = projects?.some(
    (proj) => !proj.name || (proj.bullets || []).length === 0,
  );

  if (hasIncomplete) {
    return {
      section: 'Projects',
      status: 'incomplete',
      message: `${count} projects, some missing details`,
      count,
    };
  }

  return {
    section: 'Projects',
    status: 'complete',
    message: `${count} project${count === 1 ? '' : 's'}`,
    count,
  };
}

/**
 * Analyzes the education section for completeness.
 */
function analyzeEducation(
  education: BaseResumeData['education'] | undefined,
): AnalysisItem {
  const count = education?.length ?? 0;

  if (count === 0) {
    return {
      section: 'Education',
      status: 'incomplete',
      message: 'No formal education (optional)',
    };
  }

  return {
    section: 'Education',
    status: 'complete',
    message: `${count} degree${count === 1 ? '' : 's'}`,
    count,
  };
}

/**
 * Hook that analyzes resume data completeness.
 * Returns status for each section along with overall progress.
 *
 * @param data - The BaseResumeData object to analyze
 * @returns ResumeAnalysisResult with items, counts, and progress percentage
 */
export function useResumeAnalysis(data: BaseResumeData): ResumeAnalysisResult {
  return useMemo(() => {
    const items: AnalysisItem[] = [
      analyzeContact(data.contact),
      analyzeSummary(data.summary),
      analyzeSkills(data.skills),
      analyzeExperience(data.experiences),
      analyzeProjects(data.projects),
      analyzeEducation(data.education),
    ];

    const completeCount = items.filter((a) => a.status === 'complete').length;
    const totalCount = items.length;
    const progressPct = Math.round((completeCount / totalCount) * 100);

    return { items, completeCount, totalCount, progressPct };
  }, [data]);
}
