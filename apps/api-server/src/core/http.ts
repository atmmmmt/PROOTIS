import type { NextFunction, Request, Response } from "express";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export function asyncHandler<T extends Request>(
  handler: (req: T, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const apiError =
    err instanceof ApiError ? err : new ApiError(500, "internal_error", err instanceof Error ? err.message : "Unknown error");

  res.status(apiError.statusCode).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details
    }
  });
}

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({ success: true, data, meta });
}
