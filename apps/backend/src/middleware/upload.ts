import multer from 'multer';
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(
        'Invalid file type. Please upload a PDF, Word document, or text file.',
        ErrorCode.BAD_REQUEST,
        400
      ));
    }
  },
});
