import mammoth from 'mammoth';
import { getDocumentProxy, extractText } from 'unpdf';
import { AppError } from './AppError';
import { ErrorCode } from 'shared';

export async function extractTextFromFile(buffer: Buffer, mimetype: string): Promise<string> {
  try {
    if (mimetype === 'application/pdf') {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf);
      
      return text.join('\n');
    } 
    
    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      } catch (e) {
        console.error('Mammoth extraction failed:', e);
        throw new AppError(
          'Failed to read .docx file. It might be corrupted or password protected.',
          ErrorCode.BAD_REQUEST,
          400
        );
      }
    }

    if (mimetype === 'application/msword') {
      throw new AppError(
        'Legacy Word documents (.doc) are not supported. Please save as .docx or PDF and try again.',
        ErrorCode.BAD_REQUEST,
        400
      );
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
