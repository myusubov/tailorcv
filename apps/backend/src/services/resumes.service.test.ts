import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from 'shared';

// Mock prisma client using vi.hoisted to ensure proper initialization order
const { mockPrismaBaseResume } = vi.hoisted(() => ({
  mockPrismaBaseResume: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../lib', () => ({
  prisma: {
    baseResume: mockPrismaBaseResume,
  },
}));

// Import after mocks
import {
  createBaseResume,
  listBaseResumes,
  getBaseResumeById,
  updateBaseResume,
  deleteBaseResume,
} from './resumes.service';
import { AppError } from '../utils/AppError';

describe('Resumes Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResumeData = {
    version: 1 as const,
    contact: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      headline: null,
      phone: null,
      location: null,
      websiteUrl: null,
      linkedinUrl: null,
      githubUrl: null,
    },
    summary: 'Test summary',
    skills: [],
    experiences: [],
    projects: [],
    education: [],
  };

  describe('createBaseResume', () => {
    it('should create a resume and return it', async () => {
      const mockCreated = { id: 'resume-1', name: 'My Resume', data: mockResumeData };
      mockPrismaBaseResume.create.mockResolvedValue(mockCreated);

      const result = await createBaseResume({
        clerkUserId: 'user-1',
        name: 'My Resume',
        data: mockResumeData,
      });

      expect(result).toEqual(mockCreated);
      expect(mockPrismaBaseResume.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          name: 'My Resume',
          data: mockResumeData,
        },
      });
    });
  });

  describe('listBaseResumes', () => {
    it('should return all resumes for a user', async () => {
      const mockResumes = [
        { id: 'resume-1', name: 'Resume 1' },
        { id: 'resume-2', name: 'Resume 2' },
      ];
      mockPrismaBaseResume.findMany.mockResolvedValue(mockResumes);

      const result = await listBaseResumes({ clerkUserId: 'user-1' });

      expect(result).toEqual(mockResumes);
      expect(mockPrismaBaseResume.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should return empty array when no resumes exist', async () => {
      mockPrismaBaseResume.findMany.mockResolvedValue([]);

      const result = await listBaseResumes({ clerkUserId: 'user-new' });

      expect(result).toEqual([]);
    });
  });

  describe('getBaseResumeById', () => {
    it('should return a resume when found', async () => {
      const mockResume = { id: 'resume-1', name: 'My Resume', data: mockResumeData };
      mockPrismaBaseResume.findFirst.mockResolvedValue(mockResume);

      const result = await getBaseResumeById({
        id: 'resume-1',
        clerkUserId: 'user-1',
      });

      expect(result).toEqual(mockResume);
    });

    it('should throw AppError when resume not found', async () => {
      mockPrismaBaseResume.findFirst.mockResolvedValue(null);

      await expect(
        getBaseResumeById({ id: 'nonexistent', clerkUserId: 'user-1' })
      ).rejects.toThrow(AppError);

      await expect(
        getBaseResumeById({ id: 'nonexistent', clerkUserId: 'user-1' })
      ).rejects.toMatchObject({
        statusCode: 404,
        errorCode: ErrorCode.NOT_FOUND,
      });
    });
  });

  describe('updateBaseResume', () => {
    it('should update resume name', async () => {
      mockPrismaBaseResume.findFirst.mockResolvedValue({
        id: 'resume-1',
        data: mockResumeData,
      });
      mockPrismaBaseResume.update.mockResolvedValue({
        id: 'resume-1',
        name: 'Updated Name',
      });

      const result = await updateBaseResume({
        id: 'resume-1',
        clerkUserId: 'user-1',
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should throw AppError when resume not found for update', async () => {
      mockPrismaBaseResume.findFirst.mockResolvedValue(null);

      await expect(
        updateBaseResume({
          id: 'nonexistent',
          clerkUserId: 'user-1',
          name: 'New Name',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteBaseResume', () => {
    it('should delete resume when found', async () => {
      mockPrismaBaseResume.findFirst.mockResolvedValue({ id: 'resume-1' });
      mockPrismaBaseResume.delete.mockResolvedValue({});

      await deleteBaseResume({ id: 'resume-1', clerkUserId: 'user-1' });

      expect(mockPrismaBaseResume.delete).toHaveBeenCalledWith({
        where: { id: 'resume-1' },
      });
    });

    it('should throw AppError when trying to delete nonexistent resume', async () => {
      mockPrismaBaseResume.findFirst.mockResolvedValue(null);

      await expect(
        deleteBaseResume({ id: 'nonexistent', clerkUserId: 'user-1' })
      ).rejects.toThrow(AppError);

      await expect(
        deleteBaseResume({ id: 'nonexistent', clerkUserId: 'user-1' })
      ).rejects.toMatchObject({
        statusCode: 404,
        errorCode: ErrorCode.NOT_FOUND,
      });
    });
  });
});
