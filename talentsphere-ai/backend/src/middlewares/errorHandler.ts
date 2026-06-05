import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const status = (err as Error & { status?: number }).status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'Route not found' });
}
