import { ErrorCode } from 'shared';
import { Prisma } from '../../prisma/generated/client/client.js';
import { prisma } from '../lib';

import {
  CreateResumeInput,
  CreateResumeOutput,
  GetResumeByIdForWorkerInput,
  GetResumeForUserInput,
  MarkResumeFailedInput,
  ResetFailedResumeInput,
  SaveAnalyzedRepoIdsInput,
  SaveFailedRepoNamesInput,
  SaveResumeContentInput,
} from '../types/resume';

async function findResumeIdByKey(
  input: Pick<CreateResumeInput, 'userId' | 'idempotencyKey'>,
) {
  return prisma.resume.findUnique({
    where: {
      userId_idempotencyKey: {
        userId: input.userId,
        idempotencyKey: input.idempotencyKey,
      },
    },
    select: { id: true },
  });
}

/**
 * Creates a resume from the user's profile contact, experiences, educations,
 * certifications and languages in one nested write; other sections start empty
 * and a user with no profile gets none copied. A repeated idempotency key
 * returns the resume it first created, including after a concurrent insert.
 */
export async function createResume(
  input: CreateResumeInput,
): Promise<CreateResumeOutput> {
  const existingResume = await findResumeIdByKey(input);
  if (existingResume) return { id: existingResume.id };

  const userProfile = await prisma.profile.findUnique({
    where: { userId: input.userId },
    select: {
      contact: true,
      experiences: {
        orderBy: [
          { endDate: { sort: 'desc', nulls: 'first' } },
          { startDate: 'desc' },
        ],
      },
      educations: {
        orderBy: [
          { endDate: { sort: 'desc', nulls: 'first' } },
          { startDate: 'desc' },
        ],
      },
      certifications: {
        orderBy: { issueDate: { sort: 'desc', nulls: 'last' } },
      },
      languages: {
        orderBy: { position: 'asc' },
      },
    },
  });

  const { contact, experiences, educations, certifications, languages } =
    userProfile ?? {};

  try {
    const resume = await prisma.resume.create({
      data: {
        userId: input.userId,
        sourceRepoIds: input.sourceRepoIds,
        sectionOrder: [
          'contact',
          'headline',
          'summary',
          'skills',
          'projects',
          'experience',
          'education',
          'certifications',
          'languages',
        ],
        contact: contact
          ? {
              create: {
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                location: contact.location,
                linkedinUrl: contact.linkedinUrl,
                githubUrl: contact.githubUrl,
                websiteUrl: contact.websiteUrl,
              },
            }
          : undefined,
        experiences: experiences?.length
          ? {
              createMany: {
                data: experiences.map((exp, idx) => ({
                  jobTitle: exp.jobTitle,
                  company: exp.company,
                  startDate: exp.startDate,
                  endDate: exp.endDate,
                  position: idx,
                  bullets: exp.bullets,
                  location: exp.location,
                  tools: exp.tools,
                })),
              },
            }
          : undefined,
        educations: educations?.length
          ? {
              createMany: {
                data: educations.map((edu, idx) => ({
                  degree: edu.degree,
                  fieldOfStudy: edu.fieldOfStudy,
                  school: edu.school,
                  location: edu.location,
                  startDate: edu.startDate,
                  endDate: edu.endDate,
                  gpa: edu.gpa,
                  coursework: edu.coursework,
                  position: idx,
                })),
              },
            }
          : undefined,
        certifications: certifications?.length
          ? {
              createMany: {
                data: certifications.map((cert, idx) => ({
                  name: cert.name,
                  issuer: cert.issuer,
                  url: cert.url,
                  issueDate: cert.issueDate,
                  expirationDate: cert.expirationDate,
                  position: idx,
                })),
              },
            }
          : undefined,
        languages: languages?.length
          ? {
              createMany: {
                data: languages.map((lang, idx) => ({
                  language: lang.language,
                  level: lang.level,
                  position: idx,
                })),
              },
            }
          : undefined,
        idempotencyKey: input.idempotencyKey,
      },
    });

    return { id: resume.id };
  } catch (e) {
    const isDuplicateKey =
      e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
    if (!isDuplicateKey) throw e;

    // A request with the same key committed between our lookup and insert.
    const winner = await findResumeIdByKey(input);
    if (!winner) throw e;
    return { id: winner.id };
  }
}

/**
 * Marks the resume `FAILED` with the reason if it is still `GENERATING`. Returns
 * whether a resume was changed.
 */
export async function markResumeFailed({
  resumeId,
  failureReason,
}: MarkResumeFailedInput) {
  const { count } = await prisma.resume.updateMany({
    where: { id: resumeId, status: 'GENERATING' },
    data: {
      status: 'FAILED',
      failureReason,
    },
  });

  return count === 1;
}

/** Returns only the fields the generation job needs, or `null` if the resume is gone. */
export async function getResumeByIdForWorker({
  resumeId,
}: GetResumeByIdForWorkerInput) {
  return prisma.resume.findUnique({
    where: { id: resumeId },
    select: {
      id: true,
      status: true,
      userId: true,
      sourceRepoIds: true,
      analyzedRepoIds: true,
    },
  });
}

/**
 * Returns the resume with its skill groups and projects in order, or `null`
 * when it does not exist or belongs to another user.
 */
export async function getResumeForUser({
  resumeId,
  userId,
}: GetResumeForUserInput) {
  return prisma.resume.findFirst({
    where: { id: resumeId, userId },
    include: {
      skillGroups: { orderBy: { position: 'asc' } },
      projects: { orderBy: { position: 'asc' } },
    },
  });
}

/**
 * Returns only the id of the user's resume, or `null` when it does not exist or
 * belongs to another user.
 */
export async function getResumeIdForUser({
  resumeId,
  userId,
}: GetResumeForUserInput) {
  return prisma.resume.findFirst({
    where: { id: resumeId, userId },
    select: { id: true },
  });
}

/**
 * Records the repositories that could not be analyzed, only while the resume is
 * still `GENERATING`. Returns whether a resume was changed.
 */
export async function saveFailedRepoNames({
  failedRepoNames,
  resumeId,
}: SaveFailedRepoNamesInput) {
  const { count } = await prisma.resume.updateMany({
    where: { id: resumeId, status: 'GENERATING' },
    data: {
      failedRepoNames,
    },
  });

  return count === 1;
}

/**
 * Records the repositories whose analysis was stored for the resume, only while
 * it is still `GENERATING`.
 */
export async function saveAnalyzedRepoIds({
  resumeId,
  analyzedRepoIds,
}: SaveAnalyzedRepoIdsInput) {
  await prisma.resume.updateMany({
    where: {
      id: resumeId,
      status: 'GENERATING',
    },
    data: {
      analyzedRepoIds,
    },
  });
}

const RETRYABLE_FAILURE_REASONS = [
  ErrorCode.SERVICE_UNAVAILABLE,
  ErrorCode.GITHUB_REPO_ANALYSIS_FAILED,
];

/**
 * Moves the user's resume from `FAILED` back to `GENERATING` and clears its
 * failure reason, only when the reason is in `RETRYABLE_FAILURE_REASONS`. Returns
 * whether a resume was changed.
 */
export async function resetFailedResume({
  resumeId,
  userId,
}: ResetFailedResumeInput) {
  const { count } = await prisma.resume.updateMany({
    where: {
      id: resumeId,
      userId,
      status: 'FAILED',
      failureReason: { in: RETRYABLE_FAILURE_REASONS },
    },
    data: {
      status: 'GENERATING',
      failureReason: null,
    },
  });

  return count === 1;
}

/**
 * Saves the generated content on the resume, marks it `READY` and sets the user's
 * `onboardingCompletedAt` if it is still empty, all in one transaction. Returns
 * false and saves nothing when the resume is no longer `GENERATING`.
 */
export async function saveResumeContent({
  resumeId,
  userId,
  content,
}: SaveResumeContentInput) {
  const { headline, summary, skillGroups, projects } = content;

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.resume.updateMany({
      where: { id: resumeId, status: 'GENERATING' },
      data: { headline, summary, status: 'READY' },
    });
    if (count === 0) return false;

    await tx.skillGroup.createMany({
      data: skillGroups.map(({ title, skills }, idx) => ({
        resumeId,
        title,
        skills,
        position: idx,
      })),
    });

    await tx.project.createMany({
      data: projects.map(
        ({ name, repoUrl, description, tools, bullets }, idx) => ({
          resumeId,
          name,
          description,
          tools,
          bullets: bullets.map((bullet) => bullet.text),
          repoUrl,
          position: idx,
        }),
      ),
    });

    await tx.user.updateMany({
      where: { clerkUserId: userId, onboardingCompletedAt: null },
      data: { onboardingCompletedAt: new Date() },
    });

    return true;
  });
}
