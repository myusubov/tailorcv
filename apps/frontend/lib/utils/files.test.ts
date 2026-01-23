import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  getFileIcon,
} from './files';

describe('File Utilities', () => {
  describe('formatFileSize', () => {
    it('should return "0 Bytes" for 0', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1234567)).toBe('1.18 MB');
    });
  });

  describe('getFileIcon', () => {
    it('should return PDF icon for .pdf files', () => {
      expect(getFileIcon('resume.pdf')).toBe('vscode-icons:file-type-pdf2');
    });

    it('should return Word icon for .docx files', () => {
      expect(getFileIcon('document.docx')).toBe('vscode-icons:file-type-word');
    });

    it('should return text icon for unknown file types', () => {
      expect(getFileIcon('file.txt')).toBe('bxs:file-txt');
      expect(getFileIcon('file.xyz')).toBe('bxs:file-txt');
      expect(getFileIcon('resume')).toBe('bxs:file-txt');
    });
  });
});
