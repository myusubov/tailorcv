# Backend Error Handling Guide

This project uses a centralized error handling strategy to ensure consistent API responses.

## 1. How to Throw Errors

Use the `AppError` class to throw operational errors. You generally do not need `try/catch` blocks in controllers; let errors bubble up to the global handler.

```typescript
import { AppError } from '../utils/AppError';
import { ErrorCode } from 'shared';

// Throwing a 404
if (!user) {
  throw new AppError('User not found', ErrorCode.USER_NOT_FOUND, 404);
}

// Throwing a 400
if (invalid) {
  throw new AppError('Invalid Input', ErrorCode.BAD_REQUEST, 400);
}
```

## 2. Standard Response Format

All errors return this JSON structure:

```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "details": null // Optional validation details object
  },
  "meta": {
    "timestamp": "2024-12-06T10:00:00.000Z"
  }
}
```

## 3. Automatic Handling

The global middleware in `src/middleware/error.ts` automatically handles:

- **AppError**: Uses your provided status code and message.
- **ZodError**: Returns `400` with `ErrorCode.VALIDATION_ERROR` and validation details.
- **Clerk Errors**: Returns `401` with `ErrorCode.UNAUTHORIZED`.
- **Unknown Errors**: Returns `500` "Internal Server Error" (implementation details hidden in production).

## 4. Helper Utilities

Located in `src/utils/response.ts`:
- `successResponse(res, data, statusCode)`
- `errorResponse(res, message, statusCode, code, details)`
- `paginatedResponse(res, data, page, limit, total)`
