import { describe, it, expect } from 'vitest';
import { fileUploadSchema } from './upload';

/**
 * Helper to create a mock File object for testing
 */
function createMockFile(
  name: string,
  size: number,
  type: string
): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
}

describe('Upload Schema', () => {
  describe('fileUploadSchema', () => {
    it('should accept valid PDF file', () => {
      const file = createMockFile('resume.pdf', 1024, 'application/pdf');
      const result = fileUploadSchema.safeParse({ file });
      expect(result.success).toBe(true);
    });

    it('should accept valid DOCX file', () => {
      const file = createMockFile(
        'resume.docx',
        1024,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      const result = fileUploadSchema.safeParse({ file });
      expect(result.success).toBe(true);
    });

    it('should accept valid DOC file', () => {
      const file = createMockFile('resume.doc', 1024, 'application/msword');
      const result = fileUploadSchema.safeParse({ file });
      expect(result.success).toBe(true);
    });

    it('should accept valid TXT file', () => {
      const file = createMockFile('resume.txt', 1024, 'text/plain');
      const result = fileUploadSchema.safeParse({ file });
      expect(result.success).toBe(true);
    });

    it('should reject file larger than 5MB', () => {
      const file = createMockFile('large.pdf', 6 * 1024 * 1024, 'application/pdf');
      const result = fileUploadSchema.safeParse({ file });
      expect(result.success).toBe(false);
    });

    it('should accept file exactly 5MB', () => {
      const file = createMockFile('exact.pdf', 5 * 1024 * 1024, 'application/pdf');
      const result = fileUploadSchema.safeParse({ file });
      expect(result.success).toBe(true);
    });

    it('should reject unsupported file types', () => {
      const file = createMockFile('image.png', 1024, 'image/png');
      const result = fileUploadSchema.safeParse({ file });
      expect(result.success).toBe(false);
    });

    it('should reject non-File values', () => {
      const result = fileUploadSchema.safeParse({ file: 'not a file' });
      expect(result.success).toBe(false);
    });

    it('should reject null file', () => {
      const result = fileUploadSchema.safeParse({ file: null });
      expect(result.success).toBe(false);
    });
  });
});
