import { ErrorCode } from 'shared';
import { prisma } from '../lib';
import { AppError } from '../utils/AppError';
import { baseResumeDataSchema } from 'shared';
import { deepMerge } from '../utils/deepMerge';
import type {
  CreateBaseResumeInput,
  DeleteBaseResumeInput,
  GetBaseResumeByIdInput,
  ListBaseResumesInput,
  UpdateBaseResumeInput,
} from '../types/resumes';

export async function createBaseResume(input: CreateBaseResumeInput) {
  return prisma.baseResume.create({
    data: {
      userId: input.clerkUserId,
      name: input.name,
      data: input.data,
    },
  });
}

export async function listBaseResumes(input: ListBaseResumesInput) {
  return prisma.baseResume.findMany({
    where: { userId: input.clerkUserId },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getBaseResumeById(input: GetBaseResumeByIdInput) {
  const baseResume = await prisma.baseResume.findFirst({
    where: { id: input.id, userId: input.clerkUserId },
  });

  if (!baseResume) {
    throw new AppError('Resume not found', ErrorCode.NOT_FOUND, 404);
  }

  return baseResume;
}

export async function updateBaseResume(input: UpdateBaseResumeInput) {
  const existing = await prisma.baseResume.findFirst({
    where: { id: input.id, userId: input.clerkUserId },
    select: { id: true, data: true },
  });

  if (!existing) {
    throw new AppError('Resume not found', ErrorCode.NOT_FOUND, 404);
  }

  const nextData =
    input.data !== undefined
      ? baseResumeDataSchema.parse(deepMerge(existing.data, input.data))
      : undefined;

  return prisma.baseResume.update({
    where: { id: input.id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(nextData ? { data: nextData } : {}),
    },
  });
}

export async function deleteBaseResume(input: DeleteBaseResumeInput) {
  const existing = await prisma.baseResume.findFirst({
    where: { id: input.id, userId: input.clerkUserId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError('Resume not found', ErrorCode.NOT_FOUND, 404);
  }

  await prisma.baseResume.delete({ where: { id: input.id } });
}
