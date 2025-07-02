import { Request, Response } from 'express';
import { APIResponse } from '@/types';

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: APIResponse = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] as string,
  };

  res.status(404).json(response);
};