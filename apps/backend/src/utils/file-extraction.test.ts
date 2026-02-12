import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTextFromFile } from './file-extraction';
import { AppError } from './AppError';
import { ErrorCode } from 'shared';

// Mock the external dependencies
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

vi.mock('unpdf', () => ({
  getDocumentProxy: vi.fn(),
  extractText: vi.fn(),
}));

import mammoth from 'mammoth';
import { getDocumentProxy, extractText } from 'unpdf';

describe('File Extraction Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Plain Text Files', () => {
    it('should extract text from plain text file', async () => {
      const buffer = Buffer.from('Hello, this is my resume content.');
      const result = await extractTextFromFile(buffer, 'text/plain');
      expect(result).toBe('Hello, this is my resume content.');
    });

    it('should handle UTF-8 encoded text', async () => {
      const buffer = Buffer.from('こんにちは Resume 履歴書', 'utf8');
      const result = await extractTextFromFile(buffer, 'text/plain');
      expect(result).toBe('こんにちは Resume 履歴書');
    });
  });

  describe('PDF Files', () => {
    it('should extract text from PDF', async () => {
      const mockPdf = { numPages: 1 };
      (getDocumentProxy as any).mockResolvedValue(mockPdf);
      (extractText as any).mockResolvedValue({ text: ['Page 1 content', 'Page 2 content'] });

      const buffer = Buffer.from('fake pdf content');
      const result = await extractTextFromFile(buffer, 'application/pdf');

      expect(result).toBe('Page 1 content\nPage 2 content');
      expect(getDocumentProxy).toHaveBeenCalled();
      expect(extractText).toHaveBeenCalledWith(mockPdf);
    });
  });

  describe('Word Documents (.docx)', () => {
    it('should extract text from .docx file', async () => {
      (mammoth.extractRawText as any).mockResolvedValue({ value: 'Word document content' });

      const buffer = Buffer.from('fake docx content');
      const result = await extractTextFromFile(
        buffer,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      expect(result).toBe('Word document content');
      expect(mammoth.extractRawText).toHaveBeenCalledWith({ buffer });
    });

    it('should throw AppError for corrupted .docx', async () => {
      (mammoth.extractRawText as any).mockRejectedValue(new Error('Corrupted file'));

      const buffer = Buffer.from('corrupted docx');
      
      await expect(
        extractTextFromFile(
          buffer,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).rejects.toThrow(AppError);

      await expect(
        extractTextFromFile(
          buffer,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        errorCode: ErrorCode.BAD_REQUEST,
      });
    });
  });

  describe('Legacy Word Documents (.doc)', () => {
    it('should reject legacy .doc files', async () => {
      const buffer = Buffer.from('legacy doc content');

      await expect(
        extractTextFromFile(buffer, 'application/msword')
      ).rejects.toThrow(AppError);

      await expect(
        extractTextFromFile(buffer, 'application/msword')
      ).rejects.toMatchObject({
        message: expect.stringContaining('.doc'),
        statusCode: 400,
      });
    });
  });

  describe('Unsupported File Types', () => {
    it('should reject unsupported mimetypes', async () => {
      const buffer = Buffer.from('some content');

      await expect(
        extractTextFromFile(buffer, 'image/png')
      ).rejects.toThrow(AppError);

      await expect(
        extractTextFromFile(buffer, 'application/zip')
      ).rejects.toMatchObject({
        statusCode: 400,
        errorCode: ErrorCode.BAD_REQUEST,
      });
    });
  });
});
