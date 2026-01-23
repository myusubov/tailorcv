import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from 'shared';

// Mock dependencies using vi.hoisted
const { mockPrisma, mockEnv, mockJwt, mockFetch } = vi.hoisted(() => ({
  mockPrisma: {
    gitHubConnection: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
  mockEnv: {
    JWT_SECRET: 'test-secret',
    GITHUB_CLIENT_ID: 'test-client-id',
    GITHUB_CLIENT_SECRET: 'test-client-secret',
    GITHUB_REDIRECT_URI: 'http://localhost:3000/callback',
  },
  mockJwt: {
    sign: vi.fn(),
    verify: vi.fn(),
    TokenExpiredError: class TokenExpiredError extends Error {},
    JsonWebTokenError: class JsonWebTokenError extends Error {},
  },
  mockFetch: vi.fn(),
}));

vi.mock('../lib', () => ({
  prisma: mockPrisma,
}));

vi.mock('../config/env', () => ({
  env: mockEnv,
}));

vi.mock('jsonwebtoken', () => ({
  default: mockJwt,
}));

// Mock global fetch
vi.stubGlobal('fetch', mockFetch);

// Import after mocks
import {
  getGithubAuthUrl,
  verifyOAuthState,
  getGithubConnection,
  saveGitHubConnection,
  getGitHubUser,
  fetchGithubRepos,
} from './github.service';
import { AppError } from '../utils/AppError';

describe('GitHub Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGithubAuthUrl', () => {
    it('should generate a valid OAuth URL with all parameters', () => {
      mockJwt.sign.mockReturnValue('signed-jwt-state');

      const url = getGithubAuthUrl('user-123');

      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('scope=repo+read%3Auser');
      expect(url).toContain('state=signed-jwt-state');
    });

    it('should sign JWT with correct payload', () => {
      mockJwt.sign.mockReturnValue('token');

      getGithubAuthUrl('user-456');

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-456',
          purpose: 'github_oauth',
        }),
        'test-secret',
        { expiresIn: '10m' }
      );
    });
  });

  describe('verifyOAuthState', () => {
    it('should pass verification with valid state', () => {
      mockJwt.verify.mockReturnValue({
        userId: 'user-123',
        purpose: 'github_oauth',
        timestamp: Date.now(),
      });

      expect(() => verifyOAuthState('valid-state', 'user-123')).not.toThrow();
    });

    it('should throw AppError for mismatched userId', () => {
      mockJwt.verify.mockReturnValue({
        userId: 'user-123',
        purpose: 'github_oauth',
        timestamp: Date.now(),
      });

      expect(() => verifyOAuthState('state', 'different-user')).toThrow(AppError);
    });

    it('should throw AppError for invalid purpose', () => {
      mockJwt.verify.mockReturnValue({
        userId: 'user-123',
        purpose: 'wrong_purpose',
        timestamp: Date.now(),
      });

      expect(() => verifyOAuthState('state', 'user-123')).toThrow(AppError);
    });

    it('should throw AppError for expired token', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new mockJwt.TokenExpiredError('Token expired');
      });

      expect(() => verifyOAuthState('expired-state', 'user-123'))
        .toThrow(AppError);
    });

    it('should throw AppError for invalid JWT', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new mockJwt.JsonWebTokenError('Invalid token');
      });

      expect(() => verifyOAuthState('invalid-jwt', 'user-123'))
        .toThrow(AppError);
    });
  });

  describe('getGithubConnection', () => {
    it('should return connection when found', async () => {
      const mockConnection = {
        id: 'conn-1',
        userId: 'user-1',
        accessToken: 'token',
        githubUsername: 'testuser',
      };
      mockPrisma.gitHubConnection.findUnique.mockResolvedValue(mockConnection);

      const result = await getGithubConnection('user-1');

      expect(result).toEqual(mockConnection);
    });

    it('should throw AppError when connection not found', async () => {
      mockPrisma.gitHubConnection.findUnique.mockResolvedValue(null);

      await expect(getGithubConnection('user-1')).rejects.toThrow(AppError);
      await expect(getGithubConnection('user-1')).rejects.toMatchObject({
        errorCode: ErrorCode.GITHUB_CONNECTION_FETCH_FAILED,
      });
    });
  });

  describe('saveGitHubConnection', () => {
    it('should upsert GitHub connection', async () => {
      const input = {
        userId: 'user-1',
        accessToken: 'new-token',
        githubUserId: 12345,
        githubUsername: 'testuser',
        githubAvatarUrl: 'https://avatar.url',
        scope: 'repo read:user',
      };

      mockPrisma.gitHubConnection.upsert.mockResolvedValue({ id: 'conn-1', ...input });

      const result = await saveGitHubConnection(input);

      expect(mockPrisma.gitHubConnection.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        })
      );
      expect(result.accessToken).toBe('new-token');
    });
  });

  describe('getGitHubUser', () => {
    it('should fetch GitHub user profile', async () => {
      const mockUser = { id: 123, login: 'testuser', name: 'Test User' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await getGitHubUser('access-token');

      expect(result).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/user',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token',
          }),
        })
      );
    });

    it('should throw AppError on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      });

      await expect(getGitHubUser('invalid-token')).rejects.toThrow(AppError);
      await expect(getGitHubUser('invalid-token')).rejects.toMatchObject({
        errorCode: ErrorCode.GITHUB_USER_FETCH_FAILED,
      });
    });
  });

  describe('fetchGithubRepos', () => {
    it('should fetch user repositories', async () => {
      const mockRepos = [
        { id: 1, name: 'repo-1', full_name: 'user/repo-1' },
        { id: 2, name: 'repo-2', full_name: 'user/repo-2' },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRepos),
      });

      const result = await fetchGithubRepos('access-token');

      expect(result).toEqual(mockRepos);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.github.com/user/repos'),
        expect.any(Object)
      );
    });

    it('should throw AppError on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Server Error',
      });

      await expect(fetchGithubRepos('token')).rejects.toThrow(AppError);
      await expect(fetchGithubRepos('token')).rejects.toMatchObject({
        errorCode: ErrorCode.GITHUB_REPOS_FETCH_FAILED,
      });
    });
  });
});
