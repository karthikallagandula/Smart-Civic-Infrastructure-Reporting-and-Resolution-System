import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/errors';
import env from '../config/env';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Endpoint not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.message, details: error.details });
  }
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  const anyError = error as { code?: string; name?: string; message?: string };
  if (anyError?.name === 'MulterError') {
    const msg =
      anyError.code === 'LIMIT_FILE_SIZE'
        ? 'Image is too large. Maximum allowed size is 5 MB.'
        : 'Invalid file upload.';
    return res.status(400).json({ error: msg });
  }
  if (anyError?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Image is too large. Maximum allowed size is 5 MB.' });
  }

  console.error('[error]', error);
  const message =
    env.nodeEnv === 'production' ? 'Something went wrong on the server' : anyError?.message || 'Something went wrong';
  res.status(500).json({ error: message });
}
