import { ErrorCode } from 'shared';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly details?: any;

  constructor(
    message: string,
    errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    details?: any,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.name = this.constructor.name;

    // Capturing stack trace, excluding constructor call from it.
    Error.captureStackTrace(this, this.constructor);
  }
}
