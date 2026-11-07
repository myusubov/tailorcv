import { Prisma } from '../../prisma/generated/client/client.js';
import { prisma } from '../lib';

import { CreateResumeInput, CreateResumeOutput } from '../types/resume';

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
