import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { AppError } from './AppError';
import { ErrorCode } from 'shared';

export async function extractTextFromFile(buffer: Buffer, mimetype: string): Promise<string> {
  try {
    if (mimetype === 'application/pdf') {
      // @types/pdf-parse is sometimes incorrectly typed for ESM/interop.
      // We use a specific function type assertion instead of 'any'.
      const parsePdf = pdf as unknown as (buffer: Buffer) => Promise<{ text: string }>;
      const data = await parsePdf(buffer);
      return data.text;
    } 
    
    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    if (mimetype === 'text/plain') {
      return buffer.toString('utf8');
    }

    throw new AppError(
      'Unsupported file type. Please upload a PDF, Word document, or plain text file.',
      ErrorCode.BAD_REQUEST,
      400
    );
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    console.error('File extraction error:', err);
    throw new AppError(
      'Failed to extract text from the file. Please ensure the file is not corrupted.',
      ErrorCode.INTERNAL_ERROR,
      500
    );
  }
}
